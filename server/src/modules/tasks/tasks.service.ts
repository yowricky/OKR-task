import { eq, and, sql, desc, gte, lte, isNotNull } from 'drizzle-orm';
import { db } from '../../db';
import { tasks } from '../../db/schema';
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

export async function updateTask(id: string, input: UpdateTaskInput, userId: string) {
  // Ownership check
  const existing = await getTask(id);
  if (existing.ownerId !== userId) throw new Error('无权修改此任务');

  const [task] = await db.update(tasks).set({ ...input, updatedAt: new Date().toISOString() }).where(eq(tasks.id, id)).returning();
  if (!task) throw new Error('任务不存在');
  return task;
}

export async function deleteTask(id: string, userId: string) {
  // Ownership check
  const existing = await getTask(id);
  if (existing.ownerId !== userId) throw new Error('无权删除此任务');

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
