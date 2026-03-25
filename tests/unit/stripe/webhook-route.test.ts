import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockUpdateUserTier = vi.fn();
const mockSetGracePeriod = vi.fn();

vi.mock('@/lib/stripe/subscription', () => ({
  updateUserTier: (...args: unknown[]) => mockUpdateUserTier(...args),
  setGracePeriod: (...args: unknown[]) => mockSetGracePeriod(...args),
}));

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => mockSubscriptionsRetrieve(...args),
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
      id: 'evt_checkout_1',
      type: 'checkout.session.completed',
      data: {
        object: { customer: 'cus_test', subscription: 'sub_test' },
      },
    });
    mockSubscriptionsRetrieve.mockResolvedValue({
      items: { data: [{ price: { id: 'price_pro' } }] },
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
      id: 'evt_deleted_1',
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
      id: 'evt_failed_1',
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

  it('handles subscription.updated with active status → pro', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_sub_updated_active',
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_test',
          id: 'sub_123',
          status: 'active',
          items: { data: [{ price: { id: 'price_pro' } }] },
        },
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
    expect(mockUpdateUserTier).toHaveBeenCalledWith('cus_test', 'pro', 'sub_123', 'active');
  });

  it('handles subscription.updated with past_due → grace period', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_sub_updated_past_due',
      type: 'customer.subscription.updated',
      data: {
        object: { customer: 'cus_test', id: 'sub_123', status: 'past_due' },
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

  it('handles subscription.updated with canceled → free', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_sub_updated_canceled',
      type: 'customer.subscription.updated',
      data: {
        object: { customer: 'cus_test', id: 'sub_123', status: 'canceled' },
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
    expect(mockUpdateUserTier).toHaveBeenCalledWith('cus_test', 'free', null, 'canceled');
  });

  it('handles subscription.updated with trialing → pro', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_sub_updated_trialing',
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_test',
          id: 'sub_trial',
          status: 'trialing',
          items: { data: [{ price: { id: 'price_pro' } }] },
        },
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
    expect(mockUpdateUserTier).toHaveBeenCalledWith('cus_test', 'pro', 'sub_trial', 'trialing');
  });

  it('returns 500 when webhook secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'valid' },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
