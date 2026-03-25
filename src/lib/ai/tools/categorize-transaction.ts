import { createAdminClient } from '@/lib/supabase/admin';
import type { ToolDefinition, ToolResult } from './types';
import { CATEGORIES } from '@/lib/ai/categorize';

export const categorizeTransactionTool: ToolDefinition = {
  name: 'categorize_transaction',
  description:
    'Recategorizar uma transação do usuário. Use quando o usuário pedir para mudar a categoria de uma transação específica.',
  input_schema: {
    type: 'object' as const,
    properties: {
      transaction_description: {
        type: 'string',
        description: 'Descrição ou nome do merchant da transação a recategorizar',
      },
      category_name: {
        type: 'string',
        enum: [...CATEGORIES],
        description: 'Nova categoria para a transação',
      },
    },
    required: ['transaction_description', 'category_name'],
  },
  execute: async (input: Record<string, unknown>, userId: string): Promise<ToolResult> => {
    const description = input.transaction_description as string;
    const categoryName = input.category_name as string;

    const supabase = createAdminClient();

    // Find the category ID
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', categoryName)
      .single();

    if (!categories) {
      return { success: false, message: `Categoria "${categoryName}" não encontrada.` };
    }

    // Find matching transactions (fuzzy: ilike on description or merchant)
    const searchTerm = `%${description}%`;
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, description, merchant, amount, date')
      .eq('user_id', userId)
      .or(`description.ilike.${searchTerm},merchant.ilike.${searchTerm}`)
      .order('date', { ascending: false })
      .limit(5);

    if (!transactions || transactions.length === 0) {
      return { success: false, message: `Nenhuma transação encontrada com "${description}".` };
    }

    if (transactions.length > 1) {
      // Update all matches — Claude already has context to decide
      const ids = transactions.map((t) => t.id);
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: categories.id, category_confidence: 0.95 })
        .in('id', ids);

      if (error) {
        return { success: false, message: `Erro ao atualizar: ${error.message}` };
      }

      return {
        success: true,
        message: `${transactions.length} transações com "${description}" recategorizadas para ${categoryName}.`,
        data: { count: transactions.length, category: categoryName },
      };
    }

    // Single match
    const { error } = await supabase
      .from('transactions')
      .update({ category_id: categories.id, category_confidence: 0.95 })
      .eq('id', transactions[0].id);

    if (error) {
      return { success: false, message: `Erro ao atualizar: ${error.message}` };
    }

    return {
      success: true,
      message: `Transação "${transactions[0].merchant || transactions[0].description}" recategorizada para ${categoryName}.`,
      data: { transaction_id: transactions[0].id, category: categoryName },
    };
  },
};
