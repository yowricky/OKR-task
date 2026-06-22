import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.enum(['event', 'task']).optional().default('event'),
  taskId: z.string().uuid().optional(),
  isAllDay: z.boolean().optional().default(false),
  recurrence: z.string().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const calendarQuerySchema = z.object({
  start: z.string(),
  end: z.string(),
});
