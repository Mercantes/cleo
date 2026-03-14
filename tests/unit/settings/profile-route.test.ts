import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return { single: () => mockSingle() };
          },
        };
      },
      update: (data: unknown) => {
        mockUpdate(data);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockUpdateEq(...eqArgs);
            return { error: null };
          },
        };
      },
    }),
  }),
}));

describe('Settings Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    });
    mockSingle.mockResolvedValue({
      data: { full_name: 'Test User', avatar_url: null },
      error: null,
    });
  });

  it('GET returns profile data', async () => {
    const { GET } = await import('@/app/api/settings/profile/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profile).toBeDefined();
    expect(data.profile.full_name).toBe('Test User');
  });

  it('GET returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/settings/profile/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('PATCH updates profile name', async () => {
    const { PATCH } = await import('@/app/api/settings/profile/route');
    const request = new NextRequest('http://localhost/api/settings/profile', {
      method: 'PATCH',
      body: JSON.stringify({ full_name: 'New Name' }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'New Name' }),
    );
  });
});
