import { eq, and, sql, desc, gte, lte, isNotNull, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { tasks, keyResults } from '../../db/schema';
import type { CreateTaskInput, UpdateTaskInput, Priority, TaskStatus } from '@app/shared';

export async function listTasks(query: {
  list?: string;
  status?: string;
  ownerId?: string;
  krId?: string;
  priority?: string;
  projectId?: string;
  page: number;
  pageSize: number;
}) {
  const conditions = [];

  if (query.status) conditions.push(eq(tasks.status, query.status as TaskStatus));
  if (query.ownerId) conditions.push(eq(tasks.ownerId, query.ownerId));
  if (query.krId) conditions.push(eq(tasks.krId, query.krId));
  if (query.priority) conditions.push(eq(tasks.priority, query.priority as Priority));
  if (query.projectId) conditions.push(eq(tasks.projectId, query.projectId));

  if (query.list === 'myday') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    conditions.push(gte(tasks.dueDate, today.toISOString()));
    conditions.push(lte(tasks.dueDate, tomorrow.toISOString()));
  }

  if (query.list === 'important') {
    conditions.push(eq(tasks.priority, 'high'));
  }

  if (query.list === 'planned') {
    conditions.push(isNotNull(tasks.planStartDate));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db.select()
    .from(tasks)
    .where(where)
    .orderBy(desc(tasks.createdAt))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  const [count] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(where);

  return { items, total: Number(count.count), page: query.page, pageSize: query.pageSize };
}

export async function createTask(input: CreateTaskInput, ownerId: string) {
  const [task] = await db.insert(tasks).values({ ...input, ownerId }).returning();
  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput, userId: string, userRole?: string) {
  // Ownership check — managers/admins can update any task
  const existing = await getTask(id);
  if (existing.ownerId !== userId && userRole !== 'admin' && userRole !== 'manager') {
    throw new Error('无权修改此任务');
  }

  const [task] = await db.update(tasks).set({ ...input, updatedAt: new Date().toISOString() }).where(eq(tasks.id, id)).returning();
  if (!task) throw new Error('任务不存在');

  // KR progress auto-update: recalculate KR progress when status changes
  if (task.krId && input.status) {
    await recalcKRProgress(task.krId);
  }

  return task;
}

export async function recalcKRProgress(krId: string) {
  const linkedTasks = await db.select().from(tasks).where(eq(tasks.krId, krId));
  const total = linkedTasks.length;
  if (total === 0) return;

  const completed = linkedTasks.filter(t => t.status === 'completed' || t.status === 'accepted').length;
  const progress = Math.round((completed / total) * 100);

  await db.update(keyResults)
    .set({ progress, updatedAt: new Date().toISOString() })
    .where(eq(keyResults.id, krId));
}

export async function deleteTask(id: string, userId: string, userRole?: string) {
  // Ownership check — managers/admins can delete any task
  const existing = await getTask(id);
  if (existing.ownerId !== userId && userRole !== 'admin' && userRole !== 'manager') {
    throw new Error('无权删除此任务');
  }

  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function getTask(id: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) throw new Error('任务不存在');
  return task;
}

export async function getSubTasks(parentId: string) {
  return db.select().from(tasks).where(eq(tasks.parentId, parentId)).orderBy(desc(tasks.createdAt));
}
