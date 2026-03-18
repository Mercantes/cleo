import { createClient } from '@supabase/supabase-js';
import type { ToolDefinition, ToolResult } from './types';

export const manageRecurringTool: ToolDefinition = {
  name: 'manage_recurring',
  description:
    'Gerenciar assinaturas e transações recorrentes do usuário. Pode cancelar/dispensar uma recorrência ou reclassificar seu tipo. Use quando o usuário pedir para cancelar assinatura, remover recorrência, ou mudar tipo de um compromisso recorrente.',
  input_schema: {
    type: 'object' as const,
    properties: {
      merchant_name: {
        type: 'string',
        description: 'Nome do merchant/serviço (ex: Netflix, Spotify, Uber)',
      },
      action: {
        type: 'string',
        enum: ['dismiss', 'reclassify'],
        description: 'dismiss = remover da lista de recorrências, reclassify = mudar o tipo',
      },
      new_type: {
        type: 'string',
        enum: ['subscription', 'installment', 'income'],
        description: 'Novo tipo (apenas para action=reclassify)',
      },
    },
    required: ['merchant_name', 'action'],
  },
  execute: async (input: Record<string, unknown>, userId: string): Promise<ToolResult> => {
    const merchantName = input.merchant_name as string;
    const action = input.action as string;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Find recurring transaction by merchant name (fuzzy)
    const { data: items } = await supabase
      .from('recurring_transactions')
      .select('id, merchant, amount, type')
      .eq('user_id', userId)
      .eq('status', 'active')
      .ilike('merchant', `%${merchantName}%`)
      .limit(3);

    if (!items || items.length === 0) {
      return { success: false, message: `Nenhuma recorrência encontrada com "${merchantName}".` };
    }

    const item = items[0];

    if (action === 'dismiss') {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ user_override: 'dismissed', status: 'dismissed' })
        .eq('id', item.id)
        .eq('user_id', userId);

      if (error) {
        return { success: false, message: `Erro ao remover: ${error.message}` };
      }

      return {
        success: true,
        message: `"${item.merchant}" removido das recorrências.`,
        data: { merchant: item.merchant, action: 'dismissed' },
      };
    }

    if (action === 'reclassify') {
      const newType = input.new_type as string | undefined;
      if (!newType || !['subscription', 'installment', 'income'].includes(newType)) {
        return { success: false, message: 'Tipo inválido. Use: subscription, installment ou income.' };
      }

      const { error } = await supabase
        .from('recurring_transactions')
        .update({ user_override: newType })
        .eq('id', item.id)
        .eq('user_id', userId);

      if (error) {
        return { success: false, message: `Erro ao reclassificar: ${error.message}` };
      }

      const typeLabels: Record<string, string> = {
        subscription: 'assinatura',
        installment: 'parcela',
        income: 'receita',
      };

      return {
        success: true,
        message: `"${item.merchant}" reclassificado como ${typeLabels[newType]}.`,
        data: { merchant: item.merchant, new_type: newType },
      };
    }

    return { success: false, message: 'Ação inválida. Use: dismiss ou reclassify.' };
  },
};
