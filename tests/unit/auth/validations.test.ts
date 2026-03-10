import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '@/lib/validations/auth';

describe('Auth Validation Schemas', () => {
  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const result = signupSchema.safeParse({
        name: 'João Silva',
        email: 'joao@email.com',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = signupSchema.safeParse({
        name: 'João',
        email: 'not-an-email',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password (< 6 chars)', () => {
      const result = signupSchema.safeParse({
        name: 'João',
        email: 'joao@email.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short name (< 2 chars)', () => {
      const result = signupSchema.safeParse({
        name: 'J',
        email: 'joao@email.com',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({
        email: 'joao@email.com',
        password: 'any-password',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'joao@email.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'bad-email',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });
  });
});
