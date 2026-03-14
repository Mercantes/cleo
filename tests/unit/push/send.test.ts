import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock web-push before importing
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
}));

describe('push/send', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('should export isWebPushConfigured', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    vi.stubEnv('VAPID_PRIVATE_KEY', '');
    const { isWebPushConfigured } = await import('@/lib/push/send');
    expect(typeof isWebPushConfigured).toBe('function');
  });

  it('should return false when VAPID keys not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    vi.stubEnv('VAPID_PRIVATE_KEY', '');
    const { isWebPushConfigured } = await import('@/lib/push/send');
    expect(isWebPushConfigured()).toBe(false);
  });

  it('should return true when VAPID keys are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'test-public-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'test-private-key');
    const { isWebPushConfigured } = await import('@/lib/push/send');
    expect(isWebPushConfigured()).toBe(true);
  });

  it('should call web-push sendNotification with correct params', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'test-public-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'test-private-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:test@test.com');

    const { sendPushNotification } = await import('@/lib/push/send');
    const webpush = (await import('web-push')).default;

    await sendPushNotification(
      { endpoint: 'https://push.example.com/sub1', p256dh: 'key1', auth: 'auth1' },
      { title: 'Test', body: 'Hello', tag: 'test', url: '/dashboard' },
    );

    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      'mailto:test@test.com',
      'test-public-key',
      'test-private-key',
    );
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: 'https://push.example.com/sub1', keys: { p256dh: 'key1', auth: 'auth1' } },
      JSON.stringify({ title: 'Test', body: 'Hello', tag: 'test', url: '/dashboard' }),
      { TTL: 86400 },
    );
  });
});
