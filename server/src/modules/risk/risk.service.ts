import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db';
import { riskItems } from '../../db/schema';
import type { RiskLevel } from '@app/shared';
import { checkDelayedTasks } from './risk.checker';

export async function listRisks(status?: string) {
  const all = await db.select().from(riskItems).orderBy(desc(riskItems.createdAt));
  if (status) return all.filter(r => r.status === status);
  return all;
}

export async function createRisk(taskId: string, level: RiskLevel, description: string) {
  // Dedup: skip if an open risk already exists for this taskId
  const existing = await db.select().from(riskItems).where(
    and(eq(riskItems.taskId, taskId), eq(riskItems.status, 'open'))
  );
  if (existing.length > 0) return null;

  const [risk] = await db.insert(riskItems).values({ taskId, level, description, status: 'open' }).returning();
  return risk;
}

export async function updateRiskStatus(id: string, status: string) {
  const [risk] = await db.update(riskItems).set({ status: status as any, updatedAt: new Date().toISOString() }).where(eq(riskItems.id, id)).returning();
  return risk;
}

export async function runRiskCheck() {
  const { overdue, dueIn3Days, lagging } = await checkDelayedTasks();

  for (const task of overdue) {
    await createRisk(task.id, 'high', `任务已逾期：截止日期 ${task.dueDate}`);
  }
  for (const task of dueIn3Days) {
    await createRisk(task.id, 'medium', `任务即将到期：截止日期 ${task.dueDate}`);
  }
  for (const task of lagging) {
    await createRisk(task.id, 'medium', `任务进度滞后：截止日期 ${task.dueDate}`);
  }

  return { overdue: overdue.length, dueIn3Days: dueIn3Days.length, lagging: lagging.length };
}
