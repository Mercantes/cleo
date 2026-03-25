import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ---------- chainable Supabase mock ---------- */

type MockResult = {
  data: unknown;
  error: { message: string } | null;
};

/**
 * Creates a chainable Supabase mock. Every method returns `self` synchronously,
 * and `await`-ing the chain resolves to `terminal` via a custom `then`.
 */
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
  // Make the object thenable so `await supabase.from(...).select(...).eq(...)` resolves
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

// Mock the categorize module (for CATEGORIES import in categorize-transaction)
vi.mock('@/lib/ai/categorize', () => ({
  CATEGORIES: [
    'Alimentacao',
    'Transporte',
    'Moradia',
    'Saude',
    'Educacao',
    'Lazer',
    'Compras',
    'Assinaturas',
    'Receita',
    'Transferencia',
    'Investimentos',
    'Outros',
  ],
}));

import { getAnthropicTools, executeTool } from '@/lib/ai/tools/index';
import { createGoalTool } from '@/lib/ai/tools/create-goal';
import { categorizeTransactionTool } from '@/lib/ai/tools/categorize-transaction';
import { createChallengeTool } from '@/lib/ai/tools/create-challenge';
import { createBudgetTool } from '@/lib/ai/tools/create-budget';
import { manageRecurringTool } from '@/lib/ai/tools/manage-recurring';

const USER_ID = 'user-123';

describe('AI Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    // Default: noop handler
    fromHandler = () => chainable({ data: null, error: null });
  });

  /* ================================================================
   * Registry tests
   * ================================================================ */
  describe('Registry (index.ts)', () => {
    it('getAnthropicTools() should return correct format for all 6 tools', () => {
      const tools = getAnthropicTools();
      expect(tools).toHaveLength(6);
      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('input_schema');
        expect(tool.input_schema.type).toBe('object');
      }
      const names = tools.map((t) => t.name);
      expect(names).toContain('create_goal');
      expect(names).toContain('categorize_transaction');
      expect(names).toContain('create_challenge');
      expect(names).toContain('create_budget');
      expect(names).toContain('manage_recurring');
    });

    it('executeTool() should find and execute a tool', async () => {
      // Setup: goals table upsert succeeds
      fromHandler = (table: string) => {
        if (table === 'goals') {
          return chainable({ data: null, error: null });
        }
        return chainable({ data: null, error: null });
      };

      const result = await executeTool('create_goal', { monthly_savings_target: 500 }, USER_ID);
      expect(result.success).toBe(true);
    });

    it('executeTool() should handle unknown tool names', async () => {
      const result = await executeTool('nonexistent_tool', {}, USER_ID);
      expect(result.success).toBe(false);
      expect(result.message).toContain('nonexistent_tool');
    });

    it('executeTool() should catch errors thrown by tool.execute', async () => {
      // Force an error by making fromHandler throw
      fromHandler = () => {
        throw new Error('DB exploded');
      };

      const result = await executeTool('create_goal', { monthly_savings_target: 100 }, USER_ID);
      expect(result.success).toBe(false);
      expect(result.message).toContain('DB exploded');
    });
  });

  /* ================================================================
   * create_goal
   * ================================================================ */
  describe('create_goal', () => {
    it('should upsert goal successfully', async () => {
      fromHandler = (table: string) => {
        if (table === 'goals') {
          return chainable({ data: null, error: null });
        }
        return chainable({ data: null, error: null });
      };

      const result = await createGoalTool.execute(
        { monthly_savings_target: 1000, retirement_age_target: 60 },
        USER_ID,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('R$ 1000.00');
      expect(result.message).toContain('60 anos');
      expect(result.data?.monthly_savings_target).toBe(1000);
      expect(result.data?.retirement_age_target).toBe(60);
    });

    it('should validate negative target', async () => {
      const result = await createGoalTool.execute({ monthly_savings_target: -100 }, USER_ID);

      expect(result.success).toBe(false);
      expect(result.message).toContain('positivo');
    });

    it('should handle DB error on upsert', async () => {
      fromHandler = (table: string) => {
        if (table === 'goals') {
          return chainable({ data: null, error: { message: 'unique violation' } });
        }
        return chainable({ data: null, error: null });
      };

      const result = await createGoalTool.execute({ monthly_savings_target: 500 }, USER_ID);

      expect(result.success).toBe(false);
      expect(result.message).toContain('unique violation');
    });
  });

  /* ================================================================
   * categorize_transaction
   * ================================================================ */
  describe('categorize_transaction', () => {
    it('should find and update a single transaction', async () => {
      const mockCategory = { id: 'cat-1', name: 'Alimentacao' };
      const mockTx = {
        id: 'tx-1',
        description: 'IFOOD',
        merchant: 'iFood',
        amount: 30,
        date: '2026-03-01',
      };

      fromHandler = (table: string) => {
        if (table === 'categories') {
          return chainable({ data: mockCategory, error: null });
        }
        if (table === 'transactions') {
          // Build a chain that handles select → eq → or → order → limit → returns data
          // Then update → eq → returns success
          const txChain: Record<string, unknown> = {};
          txChain.select = vi.fn(() => {
            const selectChain: Record<string, unknown> = {};
            selectChain.eq = vi.fn(() => {
              const eqChain: Record<string, unknown> = {};
              eqChain.or = vi.fn(() => {
                const orChain: Record<string, unknown> = {};
                orChain.order = vi.fn(() => {
                  const orderChain: Record<string, unknown> = {};
                  orderChain.limit = vi.fn(() => Promise.resolve({ data: [mockTx], error: null }));
                  return orderChain;
                });
                return orChain;
              });
              return eqChain;
            });
            return selectChain;
          });
          txChain.update = vi.fn(() => {
            const updateChain: Record<string, unknown> = {};
            updateChain.eq = vi.fn(() => Promise.resolve({ error: null }));
            updateChain.in = vi.fn(() => Promise.resolve({ error: null }));
            return updateChain;
          });
          return txChain;
        }
        return chainable({ data: null, error: null });
      };

      const result = await categorizeTransactionTool.execute(
        { transaction_description: 'IFOOD', category_name: 'Alimentacao' },
        USER_ID,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('iFood');
      expect(result.message).toContain('Alimentacao');
    });

    it('should handle no matching transactions', async () => {
      const mockCategory = { id: 'cat-1', name: 'Alimentacao' };

      fromHandler = (table: string) => {
        if (table === 'categories') {
          return chainable({ data: mockCategory, error: null });
        }
        if (table === 'transactions') {
          const txChain: Record<string, unknown> = {};
          txChain.select = vi.fn(() => {
            const selectChain: Record<string, unknown> = {};
            selectChain.eq = vi.fn(() => {
              const eqChain: Record<string, unknown> = {};
              eqChain.or = vi.fn(() => {
                const orChain: Record<string, unknown> = {};
                orChain.order = vi.fn(() => {
                  const orderChain: Record<string, unknown> = {};
                  orderChain.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
                  return orderChain;
                });
                return orChain;
              });
              return eqChain;
            });
            return selectChain;
          });
          return txChain;
        }
        return chainable({ data: null, error: null });
      };

      const result = await categorizeTransactionTool.execute(
        { transaction_description: 'UNKNOWN_MERCHANT', category_name: 'Alimentacao' },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('UNKNOWN_MERCHANT');
    });

    it('should handle category not found', async () => {
      fromHandler = (table: string) => {
        if (table === 'categories') {
          return chainable({ data: null, error: null });
        }
        return chainable({ data: null, error: null });
      };

      const result = await categorizeTransactionTool.execute(
        { transaction_description: 'IFOOD', category_name: 'InvalidCategory' },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('InvalidCategory');
    });
  });

  /* ================================================================
   * create_challenge
   * ================================================================ */
  describe('create_challenge', () => {
    it('should create challenge from template', async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      fromHandler = (table: string) => {
        if (table === 'challenges') {
          const ch: Record<string, unknown> = {};
          // select for active count check
          ch.select = vi.fn(() => {
            const sel: Record<string, unknown> = {};
            sel.eq = vi.fn(() => {
              const eq2: Record<string, unknown> = {};
              eq2.eq = vi.fn(() => Promise.resolve({ data: [], error: null }));
              return eq2;
            });
            return sel;
          });
          // insert for creation
          ch.insert = vi.fn(() => {
            const ins: Record<string, unknown> = {};
            ins.select = vi.fn(() => {
              const insSel: Record<string, unknown> = {};
              insSel.single = vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: 'ch-1',
                    title: 'Semana sem delivery',
                    end_date: endDate.toISOString().split('T')[0],
                  },
                  error: null,
                }),
              );
              return insSel;
            });
            return ins;
          });
          return ch;
        }
        return chainable({ data: null, error: null });
      };

      const result = await createChallengeTool.execute(
        { template_name: 'Semana sem delivery' },
        USER_ID,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Semana sem delivery');
      expect(result.data?.challenge_id).toBe('ch-1');
    });

    it('should enforce max 3 active challenges limit', async () => {
      fromHandler = (table: string) => {
        if (table === 'challenges') {
          const ch: Record<string, unknown> = {};
          ch.select = vi.fn(() => {
            const sel: Record<string, unknown> = {};
            sel.eq = vi.fn(() => {
              const eq2: Record<string, unknown> = {};
              eq2.eq = vi.fn(() =>
                Promise.resolve({
                  data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
                  error: null,
                }),
              );
              return eq2;
            });
            return sel;
          });
          return ch;
        }
        return chainable({ data: null, error: null });
      };

      const result = await createChallengeTool.execute(
        { template_name: 'Semana sem delivery' },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('3 desafios ativos');
    });

    it('should handle invalid template name', async () => {
      fromHandler = (table: string) => {
        if (table === 'challenges') {
          const ch: Record<string, unknown> = {};
          ch.select = vi.fn(() => {
            const sel: Record<string, unknown> = {};
            sel.eq = vi.fn(() => {
              const eq2: Record<string, unknown> = {};
              eq2.eq = vi.fn(() => Promise.resolve({ data: [], error: null }));
              return eq2;
            });
            return sel;
          });
          return ch;
        }
        return chainable({ data: null, error: null });
      };

      const result = await createChallengeTool.execute(
        { template_name: 'Nonexistent Template' },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Nonexistent Template');
    });

    it('should require title and duration_days for custom challenges', async () => {
      fromHandler = (table: string) => {
        if (table === 'challenges') {
          const ch: Record<string, unknown> = {};
          ch.select = vi.fn(() => {
            const sel: Record<string, unknown> = {};
            sel.eq = vi.fn(() => {
              const eq2: Record<string, unknown> = {};
              eq2.eq = vi.fn(() => Promise.resolve({ data: [], error: null }));
              return eq2;
            });
            return sel;
          });
          return ch;
        }
        return chainable({ data: null, error: null });
      };

      const result = await createChallengeTool.execute({ title: 'My challenge' }, USER_ID);

      expect(result.success).toBe(false);
      expect(result.message).toContain('duration_days');
    });
  });

  /* ================================================================
   * create_budget
   * ================================================================ */
  describe('create_budget', () => {
    it('should find category and upsert budget', async () => {
      fromHandler = (table: string) => {
        if (table === 'categories') {
          return chainable({ data: { id: 'cat-1', name: 'Alimentacao' }, error: null });
        }
        if (table === 'category_budgets') {
          return chainable({ data: null, error: null });
        }
        return chainable({ data: null, error: null });
      };

      const result = await createBudgetTool.execute(
        { category_name: 'Alimentacao', monthly_limit: 800 },
        USER_ID,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('R$ 800.00');
      expect(result.message).toContain('Alimentacao');
      expect(result.data?.category_id).toBe('cat-1');
      expect(result.data?.monthly_limit).toBe(800);
    });

    it('should handle unknown category', async () => {
      fromHandler = (table: string) => {
        if (table === 'categories') {
          return chainable({ data: null, error: null });
        }
        return chainable({ data: null, error: null });
      };

      const result = await createBudgetTool.execute(
        { category_name: 'Fantasia', monthly_limit: 500 },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Fantasia');
    });

    it('should reject non-positive limit', async () => {
      const result = await createBudgetTool.execute(
        { category_name: 'Alimentacao', monthly_limit: 0 },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('positivo');
    });

    it('should handle DB error on upsert', async () => {
      fromHandler = (table: string) => {
        if (table === 'categories') {
          return chainable({ data: { id: 'cat-1', name: 'Alimentacao' }, error: null });
        }
        if (table === 'category_budgets') {
          return chainable({ data: null, error: { message: 'constraint error' } });
        }
        return chainable({ data: null, error: null });
      };

      const result = await createBudgetTool.execute(
        { category_name: 'Alimentacao', monthly_limit: 500 },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('constraint error');
    });
  });

  /* ================================================================
   * manage_recurring
   * ================================================================ */
  describe('manage_recurring', () => {
    function buildRecurringHandler(items: unknown[] | null) {
      return (table: string) => {
        if (table === 'recurring_transactions') {
          const rt: Record<string, unknown> = {};
          // select chain: select → eq(user_id) → eq(status) → ilike → limit
          rt.select = vi.fn(() => {
            const sel: Record<string, unknown> = {};
            sel.eq = vi.fn(() => {
              const eq1: Record<string, unknown> = {};
              eq1.eq = vi.fn(() => {
                const eq2: Record<string, unknown> = {};
                eq2.ilike = vi.fn(() => {
                  const il: Record<string, unknown> = {};
                  il.limit = vi.fn(() => Promise.resolve({ data: items, error: null }));
                  return il;
                });
                return eq2;
              });
              return eq1;
            });
            return sel;
          });
          // update chain: update → eq(id) → eq(user_id)
          rt.update = vi.fn(() => {
            const upd: Record<string, unknown> = {};
            upd.eq = vi.fn(() => {
              const eq1: Record<string, unknown> = {};
              eq1.eq = vi.fn(() => Promise.resolve({ error: null }));
              return eq1;
            });
            return upd;
          });
          return rt;
        }
        return chainable({ data: null, error: null });
      };
    }

    it('should dismiss a recurring transaction', async () => {
      fromHandler = buildRecurringHandler([
        { id: 'rec-1', merchant: 'Netflix', amount: 39.9, type: 'subscription' },
      ]);

      const result = await manageRecurringTool.execute(
        { merchant_name: 'Netflix', action: 'dismiss' },
        USER_ID,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Netflix');
      expect(result.message).toContain('removido');
      expect(result.data?.action).toBe('dismissed');
    });

    it('should reclassify a recurring transaction', async () => {
      fromHandler = buildRecurringHandler([
        { id: 'rec-2', merchant: 'Spotify', amount: 21.9, type: 'subscription' },
      ]);

      const result = await manageRecurringTool.execute(
        { merchant_name: 'Spotify', action: 'reclassify', new_type: 'income' },
        USER_ID,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Spotify');
      expect(result.message).toContain('receita');
      expect(result.data?.new_type).toBe('income');
    });

    it('should handle not found recurring', async () => {
      fromHandler = buildRecurringHandler([]);

      const result = await manageRecurringTool.execute(
        { merchant_name: 'UnknownService', action: 'dismiss' },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('UnknownService');
    });

    it('should reject reclassify without valid new_type', async () => {
      fromHandler = buildRecurringHandler([
        { id: 'rec-3', merchant: 'Amazon', amount: 14.9, type: 'subscription' },
      ]);

      const result = await manageRecurringTool.execute(
        { merchant_name: 'Amazon', action: 'reclassify' },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Tipo');
    });

    it('should reject invalid action', async () => {
      fromHandler = buildRecurringHandler([
        { id: 'rec-4', merchant: 'HBO', amount: 34.9, type: 'subscription' },
      ]);

      const result = await manageRecurringTool.execute(
        { merchant_name: 'HBO', action: 'delete' },
        USER_ID,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('dismiss');
    });
  });
});
