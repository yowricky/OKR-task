import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { createOrgSchema, createUserSchema, updateUserSchema } from './org.schema';
import { getOrgTree, listUsers, createUser, updateUser, createOrg, updateOrg } from './org.service';
import { z } from 'zod';

export async function orgRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  app.get('/structure', async () => {
    const tree = await getOrgTree();
    return { code: 200, data: tree, message: 'ok' };
  });

  app.post('/structure', { preHandler: requireRole('admin') }, async (req) => {
    const input = createOrgSchema.parse(req.body);
    const org = await createOrg(input);
    return { code: 200, data: org, message: 'ok' };
  });

  app.put('/structure/:id', { preHandler: requireRole('admin') }, async (req) => {
    const { id } = req.params as { id: string };
    const input = createOrgSchema.partial().parse(req.body);
    const org = await updateOrg(id, input);
    return { code: 200, data: org, message: 'ok' };
  });

  app.get('/users', async (req) => {
    const { orgId } = req.query as { orgId?: string };
    const users = await listUsers(orgId);
    return { code: 200, data: users, message: 'ok' };
  });

  app.post('/users', { preHandler: requireRole('admin') }, async (req) => {
    const input = createUserSchema.parse(req.body);
    const user = await createUser(input);
    return { code: 200, data: user, message: 'ok' };
  });

  app.put('/users/:id', { preHandler: requireRole('admin') }, async (req) => {
    const { id } = req.params as { id: string };
    const input = updateUserSchema.parse(req.body);
    const user = await updateUser(id, input);
    return { code: 200, data: user, message: 'ok' };
  });
}
