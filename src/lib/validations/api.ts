import { z } from 'zod';

export const createSplitSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória').max(255),
  totalAmount: z.number().positive('Valor deve ser positivo'),
  transactionId: z.string().uuid().optional().nullable(),
  participants: z.array(z.object({
    name: z.string().min(1, 'Nome obrigatório').max(100),
    amount: z.number().positive('Valor deve ser positivo'),
    is_paid: z.boolean().default(false),
  })).min(2, 'Mínimo 2 participantes'),
});

export const updateParticipantSchema = z.object({
  participantId: z.string().uuid(),
  isPaid: z.boolean(),
});

export const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  monthlyLimit: z.number().positive().max(1_000_000),
});

export const goalSchema = z.object({
  monthlySavingsTarget: z.number().min(0).max(1_000_000).optional(),
  retirementAge: z.number().int().min(18).max(120).optional(),
  emergencyFundBalance: z.number().min(0).max(100_000_000).optional(),
});

/**
 * Safely parse request body with Zod schema.
 * Returns parsed data or error message.
 */
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error?: never } | { data?: never; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data };
  const firstError = result.error.issues[0];
  return { error: firstError?.message || 'Dados inválidos' };
}
