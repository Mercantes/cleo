import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();

function chainable(): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    select: () => obj,
    eq: () => obj,
    single: () => mockSingle(),
    update: (data: unknown) => {
      mockUpdate(data);
      return obj;
    },
    upsert: (data: unknown, opts: unknown) => {
      mockUpsert(data, opts);
      return { error: null };
    },
  };
  return obj;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: () => chainable(),
  })),
}));

describe('Onboarding API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
  });

  it('GET returns onboarding state', async () => {
    mockSingle.mockResolvedValue({
      data: { onboarding_step: 1, onboarding_completed: false, onboarding_skipped_steps: ['connect-bank'] },
    });

    const { GET } = await import('@/app/api/onboarding/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.step).toBe(1);
    expect(data.completed).toBe(false);
    expect(data.skippedSteps).toContain('connect-bank');
  });

  it('GET returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/onboarding/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('PATCH updates onboarding step', async () => {
    const { PATCH } = await import('@/app/api/onboarding/route');
    const request = new NextRequest('http://localhost/api/onboarding', {
      method: 'PATCH',
      body: JSON.stringify({ step: 2 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ onboarding_step: 2 }));
  });

  it('POST marks onboarding complete', async () => {
    const { POST } = await import('@/app/api/onboarding/route');
    const request = new NextRequest('http://localhost/api/onboarding', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_completed: true }),
    );
  });
});
