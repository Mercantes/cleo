import { createClient } from '@supabase/supabase-js';
import type { ToolDefinition, ToolResult } from './types';

export const createGoalTool: ToolDefinition = {
  name: 'create_goal',
  description:
    'Criar ou atualizar a meta mensal de economia do usuário. Use quando o usuário pedir para definir, criar ou alterar sua meta de economia mensal ou idade de aposentadoria.',
  input_schema: {
    type: 'object' as const,
    properties: {
      monthly_savings_target: {
        type: 'number',
        description: 'Valor em reais da meta mensal de economia',
      },
      retirement_age_target: {
        type: 'number',
        description: 'Idade alvo para aposentadoria (opcional)',
      },
    },
    required: ['monthly_savings_target'],
  },
  execute: async (input: Record<string, unknown>, userId: string): Promise<ToolResult> => {
    const monthlySavingsTarget = input.monthly_savings_target as number;
    const retirementAgeTarget = input.retirement_age_target as number | undefined;

    if (monthlySavingsTarget < 0) {
      return { success: false, message: 'O valor da meta deve ser positivo.' };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const updateData: Record<string, unknown> = {
      user_id: userId,
      monthly_savings_target: monthlySavingsTarget,
      updated_at: new Date().toISOString(),
    };

    if (retirementAgeTarget !== undefined) {
      updateData.retirement_age_target = retirementAgeTarget;
    }

    const { error } = await supabase
      .from('goals')
      .upsert(updateData, { onConflict: 'user_id' });

    if (error) {
      return { success: false, message: `Erro ao salvar meta: ${error.message}` };
    }

    const parts = [`Meta mensal de economia definida: R$ ${monthlySavingsTarget.toFixed(2)}`];
    if (retirementAgeTarget) {
      parts.push(`Idade de aposentadoria: ${retirementAgeTarget} anos`);
    }

    return {
      success: true,
      message: parts.join('. '),
      data: { monthly_savings_target: monthlySavingsTarget, retirement_age_target: retirementAgeTarget },
    };
  },
};
