import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  parentId: z.string().uuid().optional(),
});

export const createUserSchema = z.object({
  account: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  orgId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'worker']).optional().default('worker'),
});

export const updateUserSchema = createUserSchema.partial();
