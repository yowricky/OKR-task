import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { objectives, keyResults, tasks } from '../../db/schema';
import type { CreateObjectiveInput, CreateKeyResultInput } from '@app/shared';

export async function listObjectives(query: { period?: string; orgId?: string }) {
  const conditions = [];
  if (query.period) conditions.push(eq(objectives.period, query.period));
  if (query.orgId) conditions.push(eq(objectives.orgId, query.orgId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(objectives).where(where);
}

export async function getObjective(id: string) {
  const [obj] = await db.select().from(objectives).where(eq(objectives.id, id)).limit(1);
  if (!obj) throw new Error('目标不存在');
  const krs = await db.select().from(keyResults).where(eq(keyResults.objectiveId, id));
  return { ...obj, keyResults: krs };
}

export async function createObjective(input: CreateObjectiveInput) {
  const [obj] = await db.insert(objectives).values(input).returning();
  return obj;
}

export async function createKeyResult(input: CreateKeyResultInput) {
  const [kr] = await db.insert(keyResults).values(input).returning();
  return kr;
}

export async function updateKeyResultProgress(id: string, currentValue: number) {
  const [kr] = await db.select().from(keyResults).where(eq(keyResults.id, id)).limit(1);
  if (!kr) throw new Error('KR 不存在');
  const progress = Math.min(100, Math.round((currentValue / kr.targetValue) * 100));
  const [updated] = await db.update(keyResults)
    .set({ currentValue, progress, updatedAt: new Date().toISOString() })
    .where(eq(keyResults.id, id))
    .returning();
  return updated;
}

export async function getDashboard(orgId?: string, period?: string) {
  const objs = await db.select().from(objectives).where(and(
    orgId ? eq(objectives.orgId, orgId) : undefined,
    period ? eq(objectives.period, period) : undefined,
  ));

  const dashboard = await Promise.all(objs.map(async (o) => {
    const krs = await db.select().from(keyResults).where(eq(keyResults.objectiveId, o.id));
    const krsWithTasks = await Promise.all(krs.map(async (kr) => {
      const relatedTasks = await db.select().from(tasks).where(eq(tasks.krId, kr.id));
      const completed = relatedTasks.filter(t => t.status === 'completed' || t.status === 'accepted').length;
      const taskProgress = relatedTasks.length > 0 ? Math.round((completed / relatedTasks.length) * 100) : 0;
      return { ...kr, taskCount: relatedTasks.length, taskProgress };
    }));
    return { ...o, keyResults: krsWithTasks };
  }));

  return dashboard;
}
