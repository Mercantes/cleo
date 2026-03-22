import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { buildFinancialContext } from '@/lib/ai/financial-context';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { checkTierLimit, incrementUsage } from '@/lib/finance/tier-check';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';
import { getAnthropicTools, executeTool } from '@/lib/ai/tools';

export const maxDuration = 60; // Vision requests need more time

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MAX_TOOL_ROUNDS = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 3;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf'];

interface AttachmentInput {
  name: string;
  type: string;
  size: number;
  data: string;
  mediaType: string;
}

function validateAttachments(attachments: unknown): AttachmentInput[] {
  if (!Array.isArray(attachments)) return [];
  if (attachments.length > MAX_FILES) {
    throw new Error(`Máximo de ${MAX_FILES} arquivos por mensagem`);
  }

  const validated: AttachmentInput[] = [];
  for (const att of attachments) {
    if (!att || typeof att !== 'object') continue;
    const { name, type, size, data, mediaType } = att as AttachmentInput;

    if (!name || !data || !mediaType) continue;

    const isImage = ALLOWED_IMAGE_TYPES.includes(mediaType);
    const isDoc = ALLOWED_DOC_TYPES.includes(mediaType);
    if (!isImage && !isDoc) {
      throw new Error(`Tipo não suportado: ${name}`);
    }

    if (size > MAX_FILE_SIZE) {
      throw new Error(`${name} excede o limite de 10MB`);
    }

    validated.push({ name, type, size, data, mediaType });
  }

  return validated;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 20 requests/min per user
  const rl = rateLimit(`chat:${user.id}`, RATE_LIMITS.chat);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const body = await request.json();
  const { message, attachments: rawAttachments } = body;

  // Validate attachments
  let validatedAttachments: AttachmentInput[] = [];
  try {
    validatedAttachments = validateAttachments(rawAttachments);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro nos anexos' },
      { status: 400 },
    );
  }

  // Message is required unless there are attachments
  if ((!message || typeof message !== 'string') && validatedAttachments.length === 0) {
    return NextResponse.json({ error: 'Message or attachment is required' }, { status: 400 });
  }

  const messageText = typeof message === 'string' ? message : '';

  if (messageText.length > 4000) {
    return NextResponse.json({ error: 'Mensagem muito longa (máximo 4000 caracteres)' }, { status: 400 });
  }

  // Check tier limit
  const tierCheck = await checkTierLimit(user.id, 'chat');
  if (!tierCheck.allowed) {
    return NextResponse.json(
      {
        error: 'TIER_LIMIT_REACHED',
        feature: 'chat',
        current: tierCheck.current,
        limit: tierCheck.limit,
        tier: tierCheck.tier,
        upgradeUrl: '/upgrade',
      },
      { status: 403 },
    );
  }

  // Build attachment metadata for DB storage
  const attachmentMeta = validatedAttachments.length > 0
    ? validatedAttachments.map(a => ({ name: a.name, type: a.type, size: a.size }))
    : null;

  // Save user message with attachment metadata
  const { data: userMessage } = await supabase
    .from('chat_messages')
    .insert({
      user_id: user.id,
      role: 'user',
      content: messageText || '(anexo)',
      metadata: attachmentMeta ? { attachments: attachmentMeta } : null,
    })
    .select('id, role, content, created_at, metadata')
    .single();

  // Build context and system prompt
  const financialContext = await buildFinancialContext(user.id);
  const systemPrompt = buildSystemPrompt(financialContext);

  // Get recent conversation history (last 10 messages for context)
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const conversationHistory: Anthropic.MessageParam[] = (history || [])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Replace the last user message content with multimodal content blocks if there are attachments
  if (validatedAttachments.length > 0 && conversationHistory.length > 0) {
    const lastIdx = conversationHistory.length - 1;
    if (conversationHistory[lastIdx].role === 'user') {
      const contentBlocks: Anthropic.ContentBlockParam[] = [];

      for (const att of validatedAttachments) {
        if (ALLOWED_IMAGE_TYPES.includes(att.mediaType)) {
          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: att.mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: att.data,
            },
          });
        } else if (att.mediaType === 'application/pdf') {
          contentBlocks.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: att.data,
            },
          });
        }
      }

      if (messageText) {
        contentBlocks.push({ type: 'text', text: messageText });
      } else {
        contentBlocks.push({ type: 'text', text: 'Analise este arquivo.' });
      }

      conversationHistory[lastIdx] = { role: 'user', content: contentBlocks };
    }
  }

  try {
    const tools = getAnthropicTools();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        function sendSSE(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          // Tool use loop: stream text, pause for tool calls, resume
          let messages = [...conversationHistory];
          let toolRound = 0;

          while (toolRound <= MAX_TOOL_ROUNDS) {
            const stream = anthropic.messages.stream({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1024,
              system: systemPrompt,
              messages,
              tools: tools.length > 0 ? tools : undefined,
            });

            // Accumulate content blocks for potential tool_use continuation
            let hasToolUse = false;
            const assistantContentBlocks: Anthropic.ContentBlock[] = [];

            for await (const event of stream) {
              if (event.type === 'content_block_start') {
                if (event.content_block.type === 'tool_use') {
                  hasToolUse = true;
                }
              } else if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                fullResponse += event.delta.text;
                sendSSE({ token: event.delta.text });
              }
            }

            const finalMessage = await stream.finalMessage();

            // Collect content blocks from final message
            for (const block of finalMessage.content) {
              assistantContentBlocks.push(block);
            }

            // If Claude used tools, execute ALL of them and continue the loop
            if (hasToolUse && finalMessage.stop_reason === 'tool_use') {
              const toolBlocks = finalMessage.content.filter(
                (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
              );

              if (toolBlocks.length > 0) {
                const toolResults: Anthropic.ToolResultBlockParam[] = [];

                for (const toolBlock of toolBlocks) {
                  sendSSE({ tool_executing: toolBlock.name });
                  const result = await executeTool(
                    toolBlock.name,
                    toolBlock.input as Record<string, unknown>,
                    user.id,
                  );

                  sendSSE({
                    tool_executed: toolBlock.name,
                    success: result.success,
                    description: result.message,
                  });

                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolBlock.id,
                    content: JSON.stringify(result),
                  });
                }

                // Continue conversation with ALL tool results
                messages = [
                  ...messages,
                  { role: 'assistant', content: assistantContentBlocks },
                  { role: 'user', content: toolResults },
                ];
                toolRound++;
                continue;
              }
            }

            // No tool use or end_turn — done
            break;
          }

          // Save assistant response
          const { data: assistantMessage } = await supabase
            .from('chat_messages')
            .insert({ user_id: user.id, role: 'assistant', content: fullResponse })
            .select('id, role, content, created_at')
            .single();

          // Increment tier usage
          await incrementUsage(user.id, 'chat');

          // Send final message with metadata
          sendSSE({ done: true, userMessage, assistantMessage });
          controller.close();
        } catch (error) {
          const errDetail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
          console.error('[chat] streaming error:', errDetail, error instanceof Anthropic.APIError ? `status=${error.status}` : '');

          let errorMessage = 'Erro ao processar resposta. Tente novamente.';
          if (error instanceof Anthropic.APIError) {
            if (error.status === 429) {
              errorMessage = 'Serviço temporariamente sobrecarregado. Tente em alguns segundos.';
            } else if (error.status === 401) {
              errorMessage = 'Erro de configuração do serviço de IA.';
            } else if (error.status === 529) {
              errorMessage = 'Serviço de IA temporariamente indisponível. Tente novamente.';
            }
          }

          // Remove orphaned user message if no response was generated
          if (!fullResponse && userMessage?.id) {
            await supabase.from('chat_messages').delete().eq('id', userMessage.id);
          }

          sendSSE({ error: errorMessage });
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[chat] API error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
