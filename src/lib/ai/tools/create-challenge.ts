import { createClient } from '@supabase/supabase-js';
import type { ToolDefinition, ToolResult } from './types';

const CHALLENGE_TEMPLATES = [
  { title: 'Semana sem delivery', description: 'Não peça delivery por 7 dias e economize!', type: 'no_spend', durationDays: 7, xpReward: 50 },
  { title: 'Desafio da marmita', description: 'Leve marmita para o trabalho por 5 dias seguidos.', type: 'no_spend', durationDays: 5, xpReward: 40 },
  { title: 'Economia de R$100', description: 'Economize R$100 esta semana cortando gastos desnecessários.', type: 'savings', targetAmount: 100, durationDays: 7, xpReward: 60 },
  { title: 'Sem compras por impulso', description: 'Passe 3 dias sem comprar nada que não seja essencial.', type: 'no_spend', durationDays: 3, xpReward: 30 },
  { title: 'Caça ao desconto', description: 'Economize R$50 usando promoções e cupons esta semana.', type: 'savings', targetAmount: 50, durationDays: 7, xpReward: 45 },
  { title: 'Desafio do cofrinho', description: 'Reserve R$200 este mês para sua meta de economia.', type: 'savings', targetAmount: 200, durationDays: 30, xpReward: 100 },
] as const;

const templateNames = CHALLENGE_TEMPLATES.map((t) => t.title);

export const createChallengeTool: ToolDefinition = {
  name: 'create_challenge',
  description:
    'Criar um desafio financeiro para o usuário. Pode ser um dos templates pré-definidos ou um desafio customizado. Templates disponíveis: ' +
    templateNames.join(', ') +
    '. Para desafios customizados, forneça title, description, type e duration_days.',
  input_schema: {
    type: 'object' as const,
    properties: {
      template_name: {
        type: 'string',
        description: 'Nome exato do template pré-definido (ex: "Semana sem delivery"). Se fornecido, os outros campos são ignorados.',
      },
      title: {
        type: 'string',
        description: 'Título do desafio customizado (se não usar template)',
      },
      description: {
        type: 'string',
        description: 'Descrição do desafio customizado',
      },
      type: {
        type: 'string',
        enum: ['savings', 'spending_limit', 'no_spend', 'custom'],
        description: 'Tipo do desafio',
      },
      target_amount: {
        type: 'number',
        description: 'Valor alvo em reais (para desafios de economia)',
      },
      duration_days: {
        type: 'number',
        description: 'Duração do desafio em dias',
      },
    },
  },
  execute: async (input: Record<string, unknown>, userId: string): Promise<ToolResult> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Check for existing active challenges (limit to 3 concurrent)
    const { data: activeChallenges } = await supabase
      .from('challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (activeChallenges && activeChallenges.length >= 3) {
      return { success: false, message: 'O usuário já tem 3 desafios ativos. Complete ou cancele um antes de criar outro.' };
    }

    let challengeData: Record<string, unknown>;

    // Try template match first
    const templateName = input.template_name as string | undefined;
    if (templateName) {
      const template = CHALLENGE_TEMPLATES.find(
        (t) => t.title.toLowerCase() === templateName.toLowerCase(),
      );
      if (!template) {
        return {
          success: false,
          message: `Template "${templateName}" não encontrado. Templates disponíveis: ${templateNames.join(', ')}`,
        };
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + template.durationDays);

      challengeData = {
        user_id: userId,
        title: template.title,
        description: template.description,
        type: template.type,
        target_amount: 'targetAmount' in template ? template.targetAmount : null,
        end_date: endDate.toISOString().split('T')[0],
      };
    } else {
      // Custom challenge
      const title = input.title as string | undefined;
      const type = input.type as string | undefined;
      const durationDays = input.duration_days as number | undefined;

      if (!title || !durationDays) {
        return { success: false, message: 'Para desafio customizado, forneça title e duration_days.' };
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const validTypes = ['savings', 'spending_limit', 'no_spend', 'custom'];
      challengeData = {
        user_id: userId,
        title: String(title).slice(0, 100),
        description: input.description ? String(input.description).slice(0, 500) : null,
        type: type && validTypes.includes(type) ? type : 'custom',
        target_amount: input.target_amount ? Number(input.target_amount) : null,
        end_date: endDate.toISOString().split('T')[0],
      };
    }

    const { data, error } = await supabase
      .from('challenges')
      .insert(challengeData)
      .select('id, title, end_date')
      .single();

    if (error) {
      return { success: false, message: `Erro ao criar desafio: ${error.message}` };
    }

    const daysLeft = Math.ceil(
      (new Date(data.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      success: true,
      message: `Desafio "${data.title}" criado com sucesso! Duração: ${daysLeft} dias.`,
      data: { challenge_id: data.id, title: data.title, end_date: data.end_date },
    };
  },
};
