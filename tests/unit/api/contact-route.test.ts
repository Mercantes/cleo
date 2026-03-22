import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/utils/rate-limit', () => ({
  rateLimit: () => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 }),
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns success with valid data', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const response = await POST(makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      message: 'Hello, this is a test message.',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 400 when name is missing', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const response = await POST(makeRequest({
      email: 'test@example.com',
      message: 'Hello',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('All fields are required');
  });

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const response = await POST(makeRequest({
      name: 'Test User',
      message: 'Hello',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('All fields are required');
  });

  it('returns 400 when message is missing', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const response = await POST(makeRequest({
      name: 'Test User',
      email: 'test@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('All fields are required');
  });

  it('returns 400 with invalid email format', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const response = await POST(makeRequest({
      name: 'Test User',
      email: 'not-an-email',
      message: 'Hello',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email');
  });

  it('returns 400 when message exceeds 2000 characters', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const response = await POST(makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      message: 'a'.repeat(2001),
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Message too long');
  });

  it('returns 429 when rate limited', async () => {
    vi.doMock('@/lib/utils/rate-limit', () => ({
      rateLimit: () => ({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 }),
    }));

    const { POST } = await import('@/app/api/contact/route');
    const response = await POST(makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      message: 'Hello',
    }));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Too many requests');
  });
});
