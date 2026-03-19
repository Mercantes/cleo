import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { buildFinancialContext } from '@/lib/ai/financial-context';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { checkTierLimit, incrementUsage } from '@/lib/finance/tier-check';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';
import { getAnthropicTools, executeTool } from '@/lib/ai/tools';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MAX_TOOL_ROUNDS = 3;

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
  const { message } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  if (message.length > 4000) {
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

  // Save user message
  const { data: userMessage } = await supabase
    .from('chat_messages')
    .insert({ user_id: user.id, role: 'user', content: message })
    .select('id, role, content, created_at')
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
          console.error('[chat] streaming error:', error);

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
