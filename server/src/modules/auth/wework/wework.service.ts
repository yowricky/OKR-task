import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import type { User } from '@app/shared';

const CORP_ID = process.env.WEWORK_CORP_ID || '';
const AGENT_SECRET = process.env.WEWORK_AGENT_SECRET || '';
const REDIRECT_URI = process.env.WEWORK_REDIRECT_URI || 'http://localhost:1420/auth/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

let cachedToken: { token: string; expiresAt: number } | null = null;

function toSafeUser(user: typeof users.$inferSelect): User {
  const { passwordHash, skillTags, ...rest } = user;
  return {
    ...rest,
    skillTags: skillTags ?? [],
    status: rest.status as 'active' | 'disabled',
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
  };
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
  const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CORP_ID}&corpsecret=${AGENT_SECRET}`);
  const json = await res.json() as any;
  if (json.errcode !== 0) throw new Error(`获取企微access_token失败: ${json.errmsg}`);
  cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in - 300) * 1000 };
  return cachedToken.token;
}

export function getQrUrl(): { qrUrl: string; state: string } {
  const state = Math.random().toString(36).substring(2, 15);
  const appid = CORP_ID;
  const redirectUri = encodeURIComponent(REDIRECT_URI);
  const qrUrl = `https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=${appid}&agentid=${process.env.WEWORK_AGENT_ID || ''}&redirect_uri=${redirectUri}&state=${state}`;
  return { qrUrl, state };
}

export async function handleCallback(code: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
  const token = await getAccessToken();
  const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${token}&code=${code}`);
  const json = await res.json() as any;
  if (json.errcode !== 0) throw new Error(`企微授权失败: ${json.errmsg}`);

  const wwUserId = json.UserId;
  // Find or create user by wwUserId mapped to account
  let [user] = await db.select().from(users).where(eq(users.account, wwUserId)).limit(1);
  if (!user) {
    // Auto-create user on first login (will need org assignment by admin)
    throw new Error('用户未在系统中注册，请联系管理员');
  }
  if (user.status === 'disabled') throw new Error('账号已被禁用');

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken, user: toSafeUser(user) };
}
