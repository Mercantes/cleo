import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock webhook handler
const mockHandleEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/pluggy/webhook-handler', () => ({
  handleWebhookEvent: (...args: unknown[]) => mockHandleEvent(...args),
}));

import { POST } from '@/app/api/webhooks/pluggy/route';

function createWebhookRequest(body: string | object) {
  return new Request('http://localhost:3000/api/webhooks/pluggy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/webhooks/pluggy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid JSON', async () => {
    const response = await POST(createWebhookRequest('not-json'));
    expect(response.status).toBe(400);
  });

  it('should return 400 when event field is missing', async () => {
    const response = await POST(createWebhookRequest({ data: {} }));
    expect(response.status).toBe(400);
  });

  it('should return 200 for valid event', async () => {
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
});
