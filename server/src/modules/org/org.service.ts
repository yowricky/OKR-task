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
  let result;
  if (orgId) {
    result = await db.select().from(users).where(eq(users.orgId, orgId));
  } else {
    result = await db.select().from(users);
  }
  return result.map(({ passwordHash, ...safe }) => safe);
}

export async function createUser(input: { account: string; name: string; email: string; password: string; orgId: string; role: string }) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [user] = await db.insert(users).values({ ...input, passwordHash }).returning();
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function updateUser(id: string, input: {
  account?: string;
  name?: string;
  email?: string;
  password?: string;
  orgId?: string;
  role?: string;
  skillTags?: string[];
  status?: string;
}) {
  const { password, ...rest } = input;
  const setData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (password) {
    setData.passwordHash = await bcrypt.hash(password, 10);
  }
  const [user] = await db.update(users)
    .set(setData)
    .where(eq(users.id, id))
    .returning();
  if (!user) return null;
  const { passwordHash: _, ...safe } = user;
  return safe;
}
