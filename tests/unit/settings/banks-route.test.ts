import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockDelete = vi.fn();
const mockDeleteEq = vi.fn();
const mockDeleteEq2 = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              order: (...orderArgs: unknown[]) => {
                mockOrder(...orderArgs);
                return {
                  data: [
                    {
                      id: 'conn-1',
                      connector_name: 'Nubank',
                      status: 'active',
                      last_sync_at: '2026-03-01T00:00:00Z',
                      created_at: '2026-01-01T00:00:00Z',
                    },
                  ],
                  error: null,
                };
              },
            };
          },
        };
      },
      delete: () => {
        mockDelete();
        return {
          eq: (...eqArgs: unknown[]) => {
            mockDeleteEq(...eqArgs);
            return {
              eq: (...eq2Args: unknown[]) => {
                mockDeleteEq2(...eq2Args);
                return { error: null };
              },
            };
          },
        };
      },
    }),
  }),
}));

describe('Settings Banks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
  });

  it('GET returns bank connections', async () => {
    const { GET } = await import('@/app/api/settings/banks/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.connections).toHaveLength(1);
    expect(data.connections[0].connector_name).toBe('Nubank');
  });

  it('GET returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/settings/banks/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('DELETE disconnects a bank', async () => {
    const { DELETE } = await import('@/app/api/settings/banks/route');
    const request = new NextRequest(
      'http://localhost/api/settings/banks?id=00000000-0000-0000-0000-000000000001',
      { method: 'DELETE' },
    );

    const response = await DELETE(request);
    expect(response.status).toBe(200);
    expect(mockDelete).toHaveBeenCalled();
  });

  it('DELETE rejects invalid connection ID', async () => {
    const { DELETE } = await import('@/app/api/settings/banks/route');
    const request = new NextRequest(
      'http://localhost/api/settings/banks?id=not-a-uuid',
      { method: 'DELETE' },
    );

    const response = await DELETE(request);
    expect(response.status).toBe(400);
  });
});
