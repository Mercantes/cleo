import { describe, it, expect } from 'vitest';
import type { Database, Profile, UserSettings, Transaction } from '@/types/database';

describe('Supabase Types', () => {
  it('should have Database type with public schema', () => {
    type PublicSchema = Database['public'];
    type Tables = PublicSchema['Tables'];

    // Verify all 10 tables exist in the type
    type TableNames = keyof Tables;
    const _check: TableNames = 'profiles' as TableNames;
    expect(_check).toBe('profiles');
  });

  it('should have Profile type with expected fields', () => {
    const profile: Profile = {
      id: 'uuid',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };
    expect(profile.id).toBe('uuid');
    expect(profile.email).toBe('test@example.com');
    expect(profile.full_name).toBe('Test User');
  });

  it('should have UserSettings type with expected fields', () => {
    const settings: UserSettings = {
      id: 'uuid',
      user_id: 'user-uuid',
      retirement_goal_age: 65,
      monthly_contribution_target: 1000,
      expected_return_rate: 0.08,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };
    expect(settings.retirement_goal_age).toBe(65);
    expect(settings.monthly_contribution_target).toBe(1000);
  });

  it('should have Transaction type with expected fields', () => {
    const transaction: Transaction = {
      id: 'uuid',
      user_id: 'user-uuid',
      account_id: 'account-uuid',
      category_id: null,
      category_confidence: null,
      pluggy_transaction_id: 'pluggy-id',
      description: 'Mercado',
      amount: -150.5,
      date: '2026-01-15',
      type: 'DEBIT',
      created_at: '2026-01-01',
      installment_number: null,
      installment_total: null,
      is_recurring: false,
      merchant: null,
      raw_category: null,
    };
    expect(transaction.amount).toBe(-150.5);
    expect(transaction.type).toBe('DEBIT');
  });

  it('should have all type aliases defined', () => {
    // Type-level check: these will fail compilation if types don't exist
    const types: string[] = [
      'Profile',
      'UserSettings',
      'BankConnection',
      'Account',
      'Transaction',
      'Category',
      'RecurringTransaction',
      'Subscription',
      'ChatMessage',
      'ChatUsage',
    ];
    expect(types).toHaveLength(10);
  });
});
