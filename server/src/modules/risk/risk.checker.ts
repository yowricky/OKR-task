import { eq, and, lte } from 'drizzle-orm';
import { db } from '../../db';
import { tasks } from '../../db/schema';

export async function checkDelayedTasks() {
  const now = new Date().toISOString();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();

  const overdue = await db.select().from(tasks).where(
    and(eq(tasks.status, 'in_progress'), lte(tasks.dueDate, now))
  );

  const dueIn3Days = await db.select().from(tasks).where(
    and(lte(tasks.dueDate, threeDaysFromNow), lte(tasks.status as any, 'in_progress'))
  );

  const lagging = await db.select().from(tasks).where(
    and(eq(tasks.status, 'in_progress'), lte(tasks.dueDate, oneDayFromNow))
  );

  return { overdue, dueIn3Days, lagging };
}
