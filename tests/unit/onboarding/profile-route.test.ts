import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockUpdate = vi.fn();
const mockMaybeSingle = vi.fn();

function chainable(): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    select: () => obj,
    eq: (col: string, val: string) => {
      obj._lastEq = { col, val };
      return obj;
    },
    neq: () => obj,
    maybeSingle: () => mockMaybeSingle(),
    update: (data: unknown) => {
      mockUpdate(data);
      return obj;
    },
  };
  return obj;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: () => chainable(),
  })),
}));

describe('Onboarding Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
    mockMaybeSingle.mockResolvedValue({ data: null });
  });

  it('POST saves CPF to profile', async () => {
    const { POST } = await import('@/app/api/onboarding/profile/route');
    const request = new NextRequest('http://localhost/api/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify({ cpf: '529.982.247-25' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ cpf: '52998224725' });
  });

  it('POST returns 400 for invalid CPF', async () => {
    const { POST } = await import('@/app/api/onboarding/profile/route');
    const request = new NextRequest('http://localhost/api/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify({ cpf: '111.111.111-11' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('POST returns 409 when CPF already exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'other-user' } });

    const { POST } = await import('@/app/api/onboarding/profile/route');
    const request = new NextRequest('http://localhost/api/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify({ cpf: '529.982.247-25' }),
    });

    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(409);
    expect(data.error).toBe('CPF_ALREADY_EXISTS');
  });

  it('POST returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/onboarding/profile/route');
    const request = new NextRequest('http://localhost/api/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify({ cpf: '529.982.247-25' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
