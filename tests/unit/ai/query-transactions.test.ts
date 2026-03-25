import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ---------- chainable Supabase mock ---------- */

type MockResult = {
  data: unknown;
  error: { message: string } | null;
};

function chainable(terminal?: MockResult): Record<string, unknown> {
  const resolved = terminal ?? { data: null, error: null };
  const self: Record<string, unknown> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'gte',
    'lte',
    'ilike',
    'or',
    'in',
    'order',
    'limit',
    'single',
  ];
  for (const m of methods) {
    self[m] = vi.fn(() => self);
  }
  self.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve, reject);
  return self;
}

let fromHandler: (table: string) => Record<string, unknown>;

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => fromHandler(table),
  }),
}));

import { queryTransactionsTool } from '@/lib/ai/tools/query-transactions';

const USER_ID = 'user-123';

const SAMPLE_TX = [
  {
    date: '2026-03-20',
    description: 'iFood Pedido',
    amount: 45.9,
    type: 'debit',
    merchant: 'iFood',
    categories: { name: 'Alimentação' },
  },
  {
    date: '2026-03-19',
    description: 'Salário',
    amount: 5000,
    type: 'credit',
    merchant: 'Empresa LTDA',
    categories: { name: 'Receita' },
  },
  {
    date: '2026-03-18',
    description: 'Uber Trip',
    amount: 22.5,
    type: 'debit',
    merchant: 'Uber',
    categories: { name: 'Transporte' },
  },
];

describe('query_transactions tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromHandler = () => chainable({ data: SAMPLE_TX, error: null });
  });

  it('should have correct name and schema', () => {
    expect(queryTransactionsTool.name).toBe('query_transactions');
    expect(queryTransactionsTool.input_schema.type).toBe('object');
    expect(queryTransactionsTool.input_schema.properties).toHaveProperty('date_from');
    expect(queryTransactionsTool.input_schema.properties).toHaveProperty('merchant');
    expect(queryTransactionsTool.input_schema.properties).toHaveProperty('category');
    expect(queryTransactionsTool.input_schema.required).toEqual([]);
  });

  it('should return formatted transactions with summary', async () => {
    const result = await queryTransactionsTool.execute({}, USER_ID);

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(3);
    expect(result.data?.transactions).toHaveLength(3);
    expect(result.message).toContain('3 transação(ões)');
  });

  it('should compute total_despesas and total_receitas', async () => {
    const result = await queryTransactionsTool.execute({}, USER_ID);

    expect(result.data?.total_despesas).toBeCloseTo(68.4); // 45.90 + 22.50
    expect(result.data?.total_receitas).toBe(5000);
  });

  it('should format transactions for AI readability', async () => {
    fromHandler = () => chainable({ data: [SAMPLE_TX[0]], error: null });

    const result = await queryTransactionsTool.execute({}, USER_ID);
    const txs = result.data?.transactions as Array<Record<string, unknown>>;

    expect(txs[0].data).toBe('2026-03-20');
    expect(txs[0].descricao).toBe('iFood Pedido');
    expect(txs[0].tipo).toBe('despesa');
    expect(txs[0].categoria).toBe('Alimentação');
    expect(txs[0].merchant).toBe('iFood');
  });

  it('should return empty result when no transactions found', async () => {
    fromHandler = () => chainable({ data: [], error: null });

    const result = await queryTransactionsTool.execute(
      { date_from: '2026-01-01', date_to: '2026-01-31' },
      USER_ID,
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('Nenhuma transação encontrada');
    expect(result.message).toContain('de 2026-01-01');
    expect(result.message).toContain('até 2026-01-31');
    expect(result.data?.count).toBe(0);
  });

  it('should return empty result when data is null', async () => {
    fromHandler = () => chainable({ data: null, error: null });

    const result = await queryTransactionsTool.execute({}, USER_ID);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Nenhuma transação encontrada');
  });

  it('should handle DB error', async () => {
    fromHandler = () => chainable({ data: null, error: { message: 'connection timeout' } });

    const result = await queryTransactionsTool.execute({}, USER_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain('connection timeout');
  });

  it('should filter by category at DB level via category_id lookup', async () => {
    const foodTx = [SAMPLE_TX[0]]; // Only Alimentação
    fromHandler = (table: string) => {
      if (table === 'categories') {
        return chainable({ data: { id: 'cat-1' }, error: null });
      }
      return chainable({ data: foodTx, error: null });
    };

    const result = await queryTransactionsTool.execute({ category: 'Alimentação' }, USER_ID);

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(1);
    const txs = result.data?.transactions as Array<Record<string, unknown>>;
    expect(txs[0].categoria).toBe('Alimentação');
  });

  it('should return empty when category not found in DB', async () => {
    fromHandler = (table: string) => {
      if (table === 'categories') {
        return chainable({ data: null, error: null });
      }
      return chainable({ data: SAMPLE_TX, error: null });
    };

    const result = await queryTransactionsTool.execute(
      { category: 'CategoriaInexistente' },
      USER_ID,
    );

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(0);
    expect(result.message).toContain('CategoriaInexistente');
  });

  it('should handle transactions without category', async () => {
    const noCatTx = [
      {
        date: '2026-03-20',
        description: 'PIX',
        amount: 100,
        type: 'debit',
        merchant: null,
        categories: null,
      },
    ];
    fromHandler = () => chainable({ data: noCatTx, error: null });

    const result = await queryTransactionsTool.execute({}, USER_ID);

    const txs = result.data?.transactions as Array<Record<string, unknown>>;
    expect(txs[0].categoria).toBe('Sem categoria');
    expect(txs[0].descricao).toBe('PIX');
  });

  it('should handle transactions without description or merchant', async () => {
    const noDescTx = [
      {
        date: '2026-03-20',
        description: null,
        amount: 50,
        type: 'debit',
        merchant: null,
        categories: null,
      },
    ];
    fromHandler = () => chainable({ data: noDescTx, error: null });

    const result = await queryTransactionsTool.execute({}, USER_ID);

    const txs = result.data?.transactions as Array<Record<string, unknown>>;
    expect(txs[0].descricao).toBe('Sem descrição');
  });

  it('should cap limit at 50', async () => {
    const chain = chainable({ data: [], error: null });
    fromHandler = () => chain;

    await queryTransactionsTool.execute({ limit: 100 }, USER_ID);

    expect(chain.limit).toHaveBeenCalledWith(50);
  });

  it('should default limit to 30', async () => {
    const chain = chainable({ data: [], error: null });
    fromHandler = () => chain;

    await queryTransactionsTool.execute({}, USER_ID);

    expect(chain.limit).toHaveBeenCalledWith(30);
  });

  it('should include filter info in empty message for merchant filter', async () => {
    fromHandler = () => chainable({ data: [], error: null });

    const result = await queryTransactionsTool.execute({ merchant: 'Starbucks' }, USER_ID);

    expect(result.message).toContain('merchant: Starbucks');
  });

  it('should show only debit summary when no credits exist', async () => {
    fromHandler = () => chainable({ data: [SAMPLE_TX[0], SAMPLE_TX[2]], error: null });

    const result = await queryTransactionsTool.execute({}, USER_ID);

    expect(result.message).toContain('Total despesas');
    expect(result.message).not.toContain('Total receitas');
  });
});
