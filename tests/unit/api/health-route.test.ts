import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        limit: () => mockSelect(),
      }),
    }),
  }),
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('returns ok when all checks pass', async () => {
    mockSelect.mockResolvedValue({ error: null });

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.checks.database).toBe('ok');
    expect(data.checks.env).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('returns degraded when database fails', async () => {
    mockSelect.mockResolvedValue({ error: { message: 'connection failed' } });

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.checks.database).toBe('error');
  });

  it('returns degraded when env vars missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    mockSelect.mockResolvedValue({ error: null });

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.checks.env).toBe('error');
  });
});
