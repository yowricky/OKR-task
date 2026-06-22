import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { createObjectiveSchema, createKRSchema, okrQuerySchema } from './okr.schema';
import { listObjectives, getObjective, createObjective, createKeyResult, updateKeyResultProgress, getDashboard } from './okr.service';

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

  app.put('/key-results/:id/progress', async (req) => {
    const { id } = req.params as { id: string };
    const { currentValue } = req.body as { currentValue: number };
    const kr = await updateKeyResultProgress(id, currentValue);
    return { code: 200, data: kr, message: 'ok' };
  });

  app.get('/dashboard', async (req) => {
    const query = req.query as { orgId?: string; period?: string };
    const dashboard = await getDashboard(query.orgId, query.period);
    return { code: 200, data: dashboard, message: 'ok' };
  });
}
