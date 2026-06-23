import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    (req as any).user = payload;
  } catch {
    return reply.status(401).send({ code: 401, message: '未登录', data: null });
  }
}
