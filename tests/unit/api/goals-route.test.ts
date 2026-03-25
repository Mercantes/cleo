import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockGoalsSelect = vi.fn();
const mockTransactionsLte = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'goals') {
        return {
          select: () => ({
            eq: () => ({
              single: () => mockGoalsSelect(),
            }),
          }),
          upsert: (...args: unknown[]) => mockUpsert(...args),
        };
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                lte: () => mockTransactionsLte(),
              }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

describe('GET /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/goals/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('returns goals with progress data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockGoalsSelect.mockResolvedValue({
      data: {
        monthly_savings_target: 1000,
        retirement_age_target: 60,
        level: 2,
        xp: 150,
        streak_months: 3,
        best_streak: 5,
        total_challenges_completed: 8,
      },
    });
    mockTransactionsLte.mockResolvedValue({
      data: [
        { amount: 5000, type: 'credit' },
        { amount: 3500, type: 'debit' },
      ],
    });

    const { GET } = await import('@/app/api/goals/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress.currentSavings).toBe(1500);
    expect(data.progress.target).toBe(1000);
    expect(data.progress.percentage).toBe(100);
    expect(data.gamification.level).toBe(2);
    expect(data.gamification.xp).toBe(150);
    expect(data.gamification.streak).toBe(3);
  });

  it('returns empty goals when none set', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockGoalsSelect.mockResolvedValue({ data: null });
    mockTransactionsLte.mockResolvedValue({ data: [] });

    const { GET } = await import('@/app/api/goals/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.goals).toBeNull();
    expect(data.progress.percentage).toBe(0);
    expect(data.gamification.level).toBe(1);
  });
});

describe('PUT /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { PUT } = await import('@/app/api/goals/route');
    const response = await PUT(
      new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ monthlySavingsTarget: 500 }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it('updates goals successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockUpsert.mockResolvedValue({ error: null });

    const { PUT } = await import('@/app/api/goals/route');
    const response = await PUT(
      new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ monthlySavingsTarget: 500, retirementAgeTarget: 65 }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
