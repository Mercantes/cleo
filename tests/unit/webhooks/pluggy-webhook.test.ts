import { describe, it, expect, vi, beforeEach } from 'vitest';

const SECRET = 'test-webhook-secret';

// Mock verify-signature
vi.mock('@/lib/pluggy/verify-signature', () => ({
  verifyPluggySignature: (_body: string, sig: string) => sig === 'valid-sig',
}));

// Mock webhook handler
const mockHandleEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/pluggy/webhook-handler', () => ({
  handleWebhookEvent: (...args: unknown[]) => mockHandleEvent(...args),
}));

import { POST } from '@/app/api/webhooks/pluggy/route';

function createWebhookRequest(body: object, signature = 'valid-sig') {
  return new Request('http://localhost:3000/api/webhooks/pluggy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-pluggy-signature': signature,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/webhooks/pluggy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLUGGY_WEBHOOK_SECRET = SECRET;
  });

  it('should return 401 for invalid signature', async () => {
    const response = await POST(
      createWebhookRequest({ event: 'item/updated' }, 'bad-sig'),
    );

    expect(response.status).toBe(401);
  });

  it('should return 200 for valid signature', async () => {
    const response = await POST(
      createWebhookRequest({ event: 'item/updated', data: { itemId: 'item-1' } }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('should call handleWebhookEvent with parsed event', async () => {
    const event = { event: 'transactions/updated', data: { itemId: 'item-1' } };

    await POST(createWebhookRequest(event));

    // Give async handler time to fire
    await new Promise((r) => setTimeout(r, 10));

    expect(mockHandleEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'transactions/updated' }),
    );
  });

  it('should return 500 when webhook secret not configured', async () => {
    delete process.env.PLUGGY_WEBHOOK_SECRET;

    const response = await POST(createWebhookRequest({ event: 'test' }));

    expect(response.status).toBe(500);
  });
});
