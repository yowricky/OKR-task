import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { createObjectiveSchema, createKRSchema, okrQuerySchema } from './okr.schema';
import { listObjectives, getObjective, createObjective, createKeyResult, updateKeyResultProgress, updateObjective, deleteObjective, updateKeyResult, deleteKeyResult, getDashboard, getKeyResult, transitionObjective, reviewKeyResult } from './okr.service';

const progressSchema = z.object({ currentValue: z.number().min(0) });

export async function okrRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  app.get('/objectives', async (req) => {
    const query = okrQuerySchema.parse(req.query);
    const objs = await listObjectives(query);
    return { code: 200, data: objs, message: 'ok' };
  });

  app.get('/objectives/:id', async (req) => {
    const { id } = req.params as { id: string };
    const obj = await getObjective(id);
    return { code: 200, data: obj, message: 'ok' };
  });

  app.post('/objectives', { preHandler: requireRole('admin', 'manager') }, async (req) => {
    const input = createObjectiveSchema.parse(req.body);
    const obj = await createObjective(input);
    return { code: 200, data: obj, message: 'ok' };
  });

  app.post('/key-results', { preHandler: requireRole('admin', 'manager') }, async (req) => {
    const input = createKRSchema.parse(req.body);
    const kr = await createKeyResult(input);
    return { code: 200, data: kr, message: 'ok' };
  });

  app.put('/key-results/:id/progress', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { currentValue } = progressSchema.parse(req.body);
    const currentUser = (req as any).user;

    // RBAC: only the KR owner or admin/manager can update progress
    const kr = await getKeyResult(id);
    if (kr.ownerId !== currentUser.sub && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return reply.status(403).send({ code: 403, message: '权限不足', data: null });
    }

    const updated = await updateKeyResultProgress(id, currentValue);
    return { code: 200, data: updated, message: 'ok' };
  });

  app.get('/dashboard', async (req) => {
    const query = okrQuerySchema.parse(req.query);
    const dashboard = await getDashboard(query.orgId, query.period);
    return { code: 200, data: dashboard, message: 'ok' };
  });

  // ---- PUT /objectives/:id ----
  app.put('/objectives/:id', { preHandler: requireRole('admin', 'manager') }, async (req) => {
    const { id } = req.params as { id: string };
    const input = createObjectiveSchema.partial().parse(req.body);
    const obj = await updateObjective(id, input);
    return { code: 200, data: obj, message: 'ok' };
  });

  // ---- DELETE /objectives/:id ----
  app.delete('/objectives/:id', { preHandler: requireRole('admin') }, async (req) => {
    const { id } = req.params as { id: string };
    await deleteObjective(id);
    return { code: 200, data: null, message: 'ok' };
  });

  // ---- PUT /key-results/:id ----
  app.put('/key-results/:id', { preHandler: requireRole('admin', 'manager') }, async (req) => {
    const { id } = req.params as { id: string };
    const input = createKRSchema.partial().parse(req.body);
    const kr = await updateKeyResult(id, input);
    return { code: 200, data: kr, message: 'ok' };
  });

  // ---- DELETE /key-results/:id ----
  app.delete('/key-results/:id', { preHandler: requireRole('admin') }, async (req) => {
    const { id } = req.params as { id: string };
    await deleteKeyResult(id);
    return { code: 200, data: null, message: 'ok' };
  });

  // ---- PUT /objectives/:id/status (lifecycle transition) ----
  app.put('/objectives/:id/status', { preHandler: requireRole('admin', 'manager') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    try {
      const obj = await transitionObjective(id, status);
      return { code: 200, data: obj, message: 'ok' };
    } catch (err: any) {
      return reply.status(400).send({ code: 400, message: err.message, data: null });
    }
  });

  // ---- PUT /key-results/:id/review (scoring) ----
  app.put('/key-results/:id/review', { preHandler: requireRole('admin', 'manager') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reviewScore, reviewNote } = req.body as { reviewScore: number; reviewNote?: string };
    try {
      const kr = await reviewKeyResult(id, reviewScore, reviewNote);
      return { code: 200, data: kr, message: 'ok' };
    } catch (err: any) {
      return reply.status(400).send({ code: 400, message: err.message, data: null });
    }
  });
}
