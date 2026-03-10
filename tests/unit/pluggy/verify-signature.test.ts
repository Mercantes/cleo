import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { verifyPluggySignature } from '@/lib/pluggy/verify-signature';

const SECRET = 'test-webhook-secret';

function generateSignature(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

describe('verifyPluggySignature', () => {
  it('should return true for valid signature', () => {
    const body = '{"event":"item/updated"}';
    const signature = generateSignature(body);

    expect(verifyPluggySignature(body, signature, SECRET)).toBe(true);
  });

  it('should return false for invalid signature', () => {
    const body = '{"event":"item/updated"}';

    expect(verifyPluggySignature(body, 'invalid-signature', SECRET)).toBe(false);
  });

  it('should return false for tampered body', () => {
    const original = '{"event":"item/updated"}';
    const signature = generateSignature(original);
    const tampered = '{"event":"item/deleted"}';

    expect(verifyPluggySignature(tampered, signature, SECRET)).toBe(false);
  });

  it('should return false for empty signature', () => {
    expect(verifyPluggySignature('body', '', SECRET)).toBe(false);
  });

  it('should return false for empty secret', () => {
    expect(verifyPluggySignature('body', 'sig', '')).toBe(false);
  });
});
