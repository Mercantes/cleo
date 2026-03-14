import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { buildFinancialContext } from '@/lib/ai/financial-context';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { checkTierLimit, incrementUsage } from '@/lib/finance/tier-check';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

  const conversationHistory = (history || [])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationHistory,
    });

    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              fullResponse += event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token: event.delta.text })}\n\n`),
              );
            }
          }

          const finalMessage = await stream.finalMessage();

          // Save assistant response
          const { data: assistantMessage } = await supabase
            .from('chat_messages')
            .insert({ user_id: user.id, role: 'assistant', content: fullResponse })
            .select('id, role, content, created_at')
            .single();

          // Increment tier usage
          await incrementUsage(user.id, 'chat');

          // Send final message with metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                userMessage,
                assistantMessage,
              })}\n\n`,
            ),
          );
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

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`,
            ),
          );
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
