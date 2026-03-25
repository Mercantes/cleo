import { createAdminClient } from '@/lib/supabase/admin';
import type { ToolDefinition, ToolResult } from './types';

export const createBudgetTool: ToolDefinition = {
  name: 'create_budget',
  description:
    'Definir ou atualizar um orçamento mensal para uma categoria de gastos. Use quando o usuário pedir para limitar gastos em uma categoria, criar orçamento, ou definir teto de gastos.',
  input_schema: {
    type: 'object' as const,
    properties: {
      category_name: {
        type: 'string',
        description: 'Nome da categoria (ex: Alimentação, Transporte, Lazer)',
      },
      monthly_limit: {
        type: 'number',
        description: 'Limite mensal em reais',
      },
    },
    required: ['category_name', 'monthly_limit'],
  },
  execute: async (input: Record<string, unknown>, userId: string): Promise<ToolResult> => {
    const categoryName = input.category_name as string;
    const monthlyLimit = input.monthly_limit as number;

    if (monthlyLimit <= 0) {
      return { success: false, message: 'O limite deve ser um valor positivo.' };
    }

    const supabase = createAdminClient();

    // Find category by name
    const { data: category } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', categoryName)
      .single();

    if (!category) {
      return { success: false, message: `Categoria "${categoryName}" não encontrada.` };
    }

    // Upsert budget
    const { error } = await supabase.from('category_budgets').upsert(
      {
        user_id: userId,
        category_id: category.id,
        monthly_limit: monthlyLimit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,category_id' },
    );

    if (error) {
      return { success: false, message: `Erro ao salvar orçamento: ${error.message}` };
    }

    return {
      success: true,
      message: `Orçamento de R$ ${monthlyLimit.toFixed(2)}/mês definido para ${category.name}.`,
      data: { category_id: category.id, category_name: category.name, monthly_limit: monthlyLimit },
    };
  },
};
