import { describe, it, expect } from 'vitest';
import { GET, POST, PUT, PATCH, DELETE } from '@/app/api/[...slug]/route';

describe('/api/[...slug] catch-all', () => {
  it('returns 404 for GET', async () => {
    const response = GET();
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Not found');
  });

  it('returns 404 for POST', async () => {
    const response = POST();
    expect(response.status).toBe(404);
  });

  it('returns 404 for PUT', async () => {
    const response = PUT();
    expect(response.status).toBe(404);
  });

  it('returns 404 for PATCH', async () => {
    const response = PATCH();
    expect(response.status).toBe(404);
  });

  it('returns 404 for DELETE', async () => {
    const response = DELETE();
    expect(response.status).toBe(404);
  });
});
