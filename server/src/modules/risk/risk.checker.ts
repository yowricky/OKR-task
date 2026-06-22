import { eq, and, lte, gt } from 'drizzle-orm';
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
    and(eq(tasks.status, 'in_progress'), lte(tasks.dueDate, threeDaysFromNow), gt(tasks.dueDate, now))
  );

  const lagging = await db.select().from(tasks).where(
    and(eq(tasks.status, 'in_progress'), lte(tasks.dueDate, oneDayFromNow), gt(tasks.dueDate, now))
  );

  return { overdue, dueIn3Days, lagging };
}
