import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '@/lib/utils/format';
import type { ToolDefinition, ToolResult } from './types';

export const queryTransactionsTool: ToolDefinition = {
  name: 'query_transactions',
  description:
    'Consultar transações do usuário com filtros. Use SEMPRE que o usuário perguntar sobre transações específicas, gastos em determinado dia/período, transações de um merchant/estabelecimento, ou quiser detalhes além do resumo mensal. Retorna até 50 transações ordenadas por data.',
  input_schema: {
    type: 'object' as const,
    properties: {
      date_from: {
        type: 'string',
        description: 'Data inicial no formato YYYY-MM-DD. Se o usuário disser "ontem", calcule a data.',
      },
      date_to: {
        type: 'string',
        description: 'Data final no formato YYYY-MM-DD. Se não informado, usa a mesma data de date_from para buscar um dia específico.',
      },
      category: {
        type: 'string',
        description: 'Filtrar por nome da categoria (ex: "Alimentação", "Transporte"). Busca parcial case-insensitive.',
      },
      merchant: {
        type: 'string',
        description: 'Filtrar por nome do merchant/estabelecimento. Busca parcial case-insensitive.',
      },
      type: {
        type: 'string',
        enum: ['credit', 'debit'],
        description: 'Filtrar por tipo: "credit" (receitas) ou "debit" (despesas).',
      },
      min_amount: {
        type: 'number',
        description: 'Valor mínimo da transação (em reais).',
      },
      max_amount: {
        type: 'number',
        description: 'Valor máximo da transação (em reais).',
      },
      limit: {
        type: 'number',
        description: 'Número máximo de transações a retornar (padrão: 30, máximo: 50).',
      },
    },
    required: [],
  },
  execute: async (input: Record<string, unknown>, userId: string): Promise<ToolResult> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .from('transactions')
      .select('date, description, amount, type, merchant, categories(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply filters
    const dateFrom = input.date_from as string | undefined;
    const dateTo = input.date_to as string | undefined;

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date', dateTo);
    } else if (dateFrom) {
      // Single day query
      query = query.lte('date', dateFrom);
    }

    if (input.type) {
      query = query.eq('type', input.type as string);
    }

    if (input.min_amount) {
      query = query.gte('amount', input.min_amount as number);
    }

    if (input.max_amount) {
      query = query.lte('amount', input.max_amount as number);
    }

    if (input.merchant) {
      query = query.ilike('merchant', `%${input.merchant as string}%`);
    }

    const limit = Math.min(Number(input.limit) || 30, 50);
    query = query.limit(limit);

    const { data: transactions, error } = await query;

    if (error) {
      return { success: false, message: `Erro ao buscar transações: ${error.message}` };
    }

    if (!transactions || transactions.length === 0) {
      const filters: string[] = [];
      if (dateFrom) filters.push(`de ${dateFrom}`);
      if (dateTo && dateTo !== dateFrom) filters.push(`até ${dateTo}`);
      if (input.merchant) filters.push(`merchant: ${input.merchant}`);
      if (input.category) filters.push(`categoria: ${input.category}`);
      return {
        success: true,
        message: `Nenhuma transação encontrada${filters.length ? ` (${filters.join(', ')})` : ''}.`,
        data: { transactions: [], count: 0 },
      };
    }

    // Filter by category name (done post-query since it's a joined table)
    let filtered = transactions;
    if (input.category) {
      const catFilter = (input.category as string).toLowerCase();
      filtered = transactions.filter((t) => {
        const catObj = t.categories as unknown as { name: string } | null;
        return catObj?.name?.toLowerCase().includes(catFilter);
      });
    }

    // Format for AI readability
    const formatted = filtered.map((t) => {
      const catObj = t.categories as unknown as { name: string } | null;
      return {
        data: t.date,
        descricao: t.description || t.merchant || 'Sem descrição',
        valor: formatCurrency(Math.abs(Number(t.amount))),
        tipo: t.type === 'credit' ? 'receita' : 'despesa',
        categoria: catObj?.name || 'Sem categoria',
        merchant: t.merchant || null,
      };
    });

    // Summary stats
    const totalDebit = filtered
      .filter((t) => t.type === 'debit')
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const totalCredit = filtered
      .filter((t) => t.type === 'credit')
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    const summary = [
      `${filtered.length} transação(ões) encontrada(s).`,
    ];
    if (totalDebit > 0) summary.push(`Total despesas: ${formatCurrency(totalDebit)}`);
    if (totalCredit > 0) summary.push(`Total receitas: ${formatCurrency(totalCredit)}`);

    return {
      success: true,
      message: summary.join(' '),
      data: {
        transactions: formatted,
        count: filtered.length,
        total_despesas: totalDebit,
        total_receitas: totalCredit,
      },
    };
  },
};
