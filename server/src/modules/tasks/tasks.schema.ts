import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  planStartDate: z.string().optional(),
  dueDate: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  krId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['pending', 'in_progress', 'completed', 'accepted']).optional(),
});

export const taskQuerySchema = z.object({
  list: z.enum(['myday', 'important', 'planned', 'all']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'accepted']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  ownerId: z.string().uuid().optional(),
  krId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(50),
});
