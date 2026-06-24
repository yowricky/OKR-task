import { eq, and, inArray } from 'drizzle-orm';
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

export async function getKeyResult(id: string) {
  const [kr] = await db.select().from(keyResults).where(eq(keyResults.id, id)).limit(1);
  if (!kr) throw new Error('KR 不存在');
  return kr;
}

export async function updateKeyResultProgress(id: string, currentValue: number) {
  const [kr] = await db.select().from(keyResults).where(eq(keyResults.id, id)).limit(1);
  if (!kr) throw new Error('KR 不存在');
  const progress = Math.max(0, Math.min(100, Math.round((currentValue / kr.targetValue) * 100)));
  const [updated] = await db.update(keyResults)
    .set({ currentValue, progress, updatedAt: new Date().toISOString() })
    .where(eq(keyResults.id, id))
    .returning();
  return updated;
}

export async function updateObjective(id: string, input: { title?: string; description?: string; period?: string; periodLabel?: string; weight?: number; status?: string }) {
  const [obj] = await db.update(objectives)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(objectives.id, id))
    .returning();
  return obj || null;
}

export async function deleteObjective(id: string) {
  // Delete child KRs first
  await db.delete(keyResults).where(eq(keyResults.objectiveId, id));
  const [obj] = await db.delete(objectives).where(eq(objectives.id, id)).returning();
  return obj || null;
}

export async function updateKeyResult(id: string, input: { title?: string; targetValue?: number; unit?: string; description?: string }) {
  const [kr] = await db.update(keyResults)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(keyResults.id, id))
    .returning();
  return kr || null;
}

export async function deleteKeyResult(id: string) {
  const [kr] = await db.delete(keyResults).where(eq(keyResults.id, id)).returning();
  return kr || null;
}

export async function getDashboard(orgId?: string, period?: string) {
  const conditions = [];
  if (orgId) conditions.push(eq(objectives.orgId, orgId));
  if (period) conditions.push(eq(objectives.period, period));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const objs = await db.select().from(objectives).where(where);

  if (objs.length === 0) return [];

  // Batch fetch all KRs for all objectives (1 query instead of N)
  const objIds = objs.map(o => o.id);
  const allKrs = await db.select().from(keyResults).where(inArray(keyResults.objectiveId, objIds));

  // Batch fetch all tasks for all KRs (1 query instead of K queries)
  const krIds = allKrs.map(kr => kr.id);
  const allTasks = krIds.length > 0
    ? await db.select().from(tasks).where(inArray(tasks.krId, krIds))
    : [];

  // Group in memory
  const tasksByKr = new Map<string, typeof allTasks>();
  for (const t of allTasks) {
    const list = tasksByKr.get(t.krId!) || [];
    list.push(t);
    tasksByKr.set(t.krId!, list);
  }

  return objs.map(o => {
    const krs = allKrs.filter(kr => kr.objectiveId === o.id).map(kr => {
      const relatedTasks = tasksByKr.get(kr.id) || [];
      const completed = relatedTasks.filter(t => t.status === 'completed' || t.status === 'accepted').length;
      const taskProgress = relatedTasks.length > 0 ? Math.round((completed / relatedTasks.length) * 100) : 0;
      return { ...kr, taskCount: relatedTasks.length, taskProgress };
    });
    return { ...o, keyResults: krs };
  });
}
