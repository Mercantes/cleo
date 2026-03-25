import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockChallengesQuery = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockGoalsSelect = vi.fn();
const mockGoalsUpdate = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'challenges') {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                order: () => ({
                  limit: () => mockChallengesQuery(),
                }),
              }),
            }),
          }),
          insert: (...args: unknown[]) => mockInsert(...args),
          update: (...args: unknown[]) => mockUpdate(...args),
        };
      }
      if (table === 'goals') {
        return {
          select: () => ({
            eq: () => ({
              single: () => mockGoalsSelect(),
            }),
          }),
          update: (...args: unknown[]) => mockGoalsUpdate(...args),
        };
      }
      return {};
    },
  }),
}));

describe('GET /api/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/challenges/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('returns active and completed challenges', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockChallengesQuery.mockResolvedValue({
      data: [
        { id: '1', title: 'Test', status: 'active', end_date: '2026-04-01' },
        { id: '2', title: 'Done', status: 'completed', end_date: '2026-03-01' },
      ],
    });

    const { GET } = await import('@/app/api/challenges/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.active).toHaveLength(1);
    expect(data.completed).toHaveLength(1);
    expect(data.available.length).toBeGreaterThan(0);
  });
});

describe('POST /api/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/challenges/route');
    const response = await POST(
      new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ templateIndex: 0 }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it('creates challenge from template', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockInsert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: { id: 'new-1', title: 'Semana sem delivery', status: 'active' },
            error: null,
          }),
      }),
    });

    const { POST } = await import('@/app/api/challenges/route');
    const response = await POST(
      new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ templateIndex: 0 }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.challenge.title).toBe('Semana sem delivery');
  });

  it('returns 400 for invalid data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const { POST } = await import('@/app/api/challenges/route');
    const response = await POST(
      new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid status', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const { PATCH } = await import('@/app/api/challenges/route');
    const response = await PATCH(
      new NextRequest('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ challengeId: '1', status: 'invalid' }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
