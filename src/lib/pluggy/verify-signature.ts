import { createHmac, timingSafeEqual } from 'crypto';

export function verifyPluggySignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  try {
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
