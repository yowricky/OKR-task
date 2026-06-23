import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { loginSchema, weworkCallbackSchema } from './auth.schema';
import { login } from './auth.service';
import { getQrUrl, handleCallback } from './wework/wework.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

export async function authRoutes(app: FastifyInstance) {
  // 企微扫码 - 获取授权URL
  app.get('/wework/qr-url', async () => {
    const { qrUrl, state } = getQrUrl();
    return { code: 200, data: { qrUrl, state }, message: 'ok' };
  });

  // 企微扫码 - 回调登录
  app.post('/wework/callback', async (req, reply) => {
    const parsed = weworkCallbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ code: 400, message: parsed.error.issues[0].message, data: null });
    }
    try {
      const result = await handleCallback(parsed.data.code);
      return { code: 200, data: result, message: 'ok' };
    } catch (err: any) {
      return reply.status(401).send({ code: 401, message: err.message, data: null });
    }
  });

  // 用户名密码登录（兜底）
  app.post('/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ code: 400, message: parsed.error.issues[0].message, data: null });
    }
    try {
      const result = await login(parsed.data);
      return { code: 200, data: result, message: 'ok' };
    } catch (err: any) {
      return reply.status(401).send({ code: 401, message: err.message, data: null });
    }
  });

  // Token 刷新
  app.post('/refresh', async (req, reply) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
      const accessToken = jwt.sign({ sub: payload.sub, role: payload.role }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ sub: payload.sub, role: payload.role }, JWT_SECRET, { expiresIn: '7d' });
      return { code: 200, data: { accessToken, refreshToken }, message: 'ok' };
    } catch {
      return reply.status(401).send({ code: 401, message: 'token 无效', data: null });
    }
  });
}
