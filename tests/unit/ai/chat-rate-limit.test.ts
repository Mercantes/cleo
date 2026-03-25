import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => mockFrom(table),
    rpc: (...args: unknown[]) => mockRpc(...args),
  })),
}));

describe('checkChatRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows pro tier unlimited', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => ({ data: { subscription_tier: 'pro' }, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
    });

    const { checkChatRateLimit } = await import('@/lib/ai/chat-rate-limit');
    const result = await checkChatRateLimit('user-1');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it('enforces free tier limit of 30', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => ({ data: { subscription_tier: 'free' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'chat_usage') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => ({ data: { message_count: 30 }, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => ({ data: null, error: null }),
          }),
        }),
      };
    });

    const { checkChatRateLimit } = await import('@/lib/ai/chat-rate-limit');
    const result = await checkChatRateLimit('user-2');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(30);
  });

  it('allows when under limit', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => ({ data: { subscription_tier: 'free' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'chat_usage') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => ({ data: { message_count: 10 }, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => ({ data: null, error: null }),
          }),
        }),
      };
    });

    const { checkChatRateLimit } = await import('@/lib/ai/chat-rate-limit');
    const result = await checkChatRateLimit('user-3');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(20);
  });
});

describe('incrementChatUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls atomic rpc for increment', async () => {
    mockRpc.mockResolvedValue({ data: 11, error: null });

    const { incrementChatUsage } = await import('@/lib/ai/chat-rate-limit');
    await incrementChatUsage('user-1');

    expect(mockRpc).toHaveBeenCalledWith(
      'increment_chat_usage',
      expect.objectContaining({
        p_user_id: 'user-1',
      }),
    );
  });
});
