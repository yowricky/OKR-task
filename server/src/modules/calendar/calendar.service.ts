import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../../db';
import { calendarEvents, tasks } from '../../db/schema';
import type { CreateEventInput } from '@app/shared';

export async function getEvents(start: string, end: string, userId: string): Promise<any[]> {
  const events = await db.select()
    .from(calendarEvents)
    .where(and(
      eq(calendarEvents.ownerId, userId),
      gte(calendarEvents.startTime, start),
      lte(calendarEvents.startTime, end),
    ));

  const userTasks = await db.select()
    .from(tasks)
    .where(and(
      eq(tasks.ownerId, userId),
      gte(tasks.dueDate, start),
      lte(tasks.dueDate, end),
    ));

  const taskEvents = userTasks
    .filter(t => t.dueDate !== null)
    .map(t => ({
      id: `task-${t.id}`,
      title: t.title,
      description: t.description || '',
      startTime: t.dueDate!,
      endTime: t.dueDate!,
      type: 'task' as const,
      taskId: t.id,
      ownerId: t.ownerId,
      isAllDay: true,
      recurrence: null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

  return [...events, ...taskEvents];
}

export async function createEvent(input: CreateEventInput, ownerId: string) {
  const [event] = await db.insert(calendarEvents).values({ ...input, ownerId }).returning();
  return event;
}

export async function updateEvent(id: string, input: Partial<CreateEventInput>) {
  const [event] = await db.update(calendarEvents)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(calendarEvents.id, id))
    .returning();
  return event;
}

export async function deleteEvent(id: string) {
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}
