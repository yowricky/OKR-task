import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@app/shared';

export function requireRole(...roles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const userRole = (req as any).user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return reply.status(403).send({ code: 403, message: '权限不足', data: null });
    }
  };
}
