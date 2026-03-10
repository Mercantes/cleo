import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockUpdateUserTier = vi.fn();
const mockSetGracePeriod = vi.fn();

vi.mock('@/lib/stripe/subscription', () => ({
  updateUserTier: (...args: unknown[]) => mockUpdateUserTier(...args),
  setGracePeriod: (...args: unknown[]) => mockSetGracePeriod(...args),
}));

const mockConstructEvent = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}));

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('returns 400 when signature is missing', async () => {
    const { POST } = await import('@/app/api/stripe/webhook/route');
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'invalid' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('handles checkout.session.completed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: { customer: 'cus_test', subscription: 'sub_test' },
      },
    });

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'valid' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockUpdateUserTier).toHaveBeenCalledWith('cus_test', 'pro', 'sub_test', 'active');
  });

  it('handles customer.subscription.deleted', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: { customer: 'cus_test', id: 'sub_test', status: 'canceled' },
      },
    });

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'valid' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockUpdateUserTier).toHaveBeenCalledWith('cus_test', 'free', undefined, 'canceled');
  });

  it('handles invoice.payment_failed with grace period', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: { customer: 'cus_test' },
      },
    });

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'valid' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockSetGracePeriod).toHaveBeenCalledWith('cus_test', 7);
  });
});
