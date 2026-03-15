import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '@/lib/validations/auth';

const validSignup = {
  name: 'João Silva',
  email: 'joao@email.com',
  cpf: '529.982.247-25',
  password: 'Senha123',
  acceptTerms: true as const,
};

describe('Auth Validation Schemas', () => {
  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const result = signupSchema.safeParse(validSignup);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = signupSchema.safeParse({ ...validSignup, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject short password (< 8 chars)', () => {
      const result = signupSchema.safeParse({ ...validSignup, password: 'Ab1' });
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const result = signupSchema.safeParse({ ...validSignup, password: 'senha123' });
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = signupSchema.safeParse({ ...validSignup, password: 'SENHA123' });
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = signupSchema.safeParse({ ...validSignup, password: 'SenhaForte' });
      expect(result.success).toBe(false);
    });

    it('should reject short name (< 2 chars)', () => {
      const result = signupSchema.safeParse({ ...validSignup, name: 'J' });
      expect(result.success).toBe(false);
    });

    it('should reject when terms not accepted', () => {
      const result = signupSchema.safeParse({ ...validSignup, acceptTerms: false });
      expect(result.success).toBe(false);
    });

    it('should reject invalid CPF', () => {
      const result = signupSchema.safeParse({ ...validSignup, cpf: '000.000.000-00' });
      expect(result.success).toBe(false);
    });

    it('should reject CPF with wrong check digits', () => {
      const result = signupSchema.safeParse({ ...validSignup, cpf: '529.982.247-99' });
      expect(result.success).toBe(false);
    });

    it('should accept valid CPF', () => {
      const result = signupSchema.safeParse({ ...validSignup, cpf: '529.982.247-25' });
      expect(result.success).toBe(true);
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
