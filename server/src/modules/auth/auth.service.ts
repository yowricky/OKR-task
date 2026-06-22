import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { users } from '../../db/schema';
import type { LoginInput } from './auth.schema';
import type { LoginResponse } from '@app/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function login(input: LoginInput): Promise<LoginResponse> {
  const [user] = await db.select().from(users).where(eq(users.account, input.account)).limit(1);
  if (!user) throw new Error('账号或密码错误');
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new Error('账号或密码错误');
  if (user.status === 'disabled') throw new Error('账号已被禁用');

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  const { passwordHash, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}
