import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { organizations, users } from '../../db/schema';

export async function getOrgTree() {
  const all = await db.select().from(organizations);
  return buildTree(all, null);

  function buildTree(items: typeof all, parentId: string | null): any[] {
    return items
      .filter(i => i.parentId === parentId)
      .map(i => ({ ...i, children: buildTree(items, i.id) }));
  }
}

export async function createOrg(input: { name: string; code: string; parentId?: string }) {
  const [org] = await db.insert(organizations).values(input).returning();
  return org;
}

export async function listUsers(orgId?: string) {
  const all = await db.select().from(users);
  return orgId ? all.filter(u => u.orgId === orgId) : all;
}

export async function createUser(input: { account: string; name: string; email: string; password: string; orgId: string; role: string }) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [user] = await db.insert(users).values({ ...input, passwordHash }).returning();
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function updateUser(id: string, input: any) {
  const [user] = await db.update(users)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id))
    .returning();
  return user;
}
