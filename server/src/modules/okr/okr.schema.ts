import { z } from 'zod';

export const createObjectiveSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  orgId: z.string().uuid(),
  period: z.enum(['annual', 'quarterly', 'monthly']),
  periodLabel: z.string().min(1),
  weight: z.number().optional().default(1),
});

export const createKRSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  objectiveId: z.string().uuid(),
  targetValue: z.number().positive(),
  unit: z.string().min(1),
  ownerId: z.string().uuid(),
});

export const okrQuerySchema = z.object({
  period: z.string().optional(),
  orgId: z.string().uuid().optional(),
});
