import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { listRisks, createRisk, updateRiskStatus, runRiskCheck } from './risk.service';

const createRiskSchema = z.object({
  taskId: z.string().uuid(),
  level: z.enum(['high', 'medium', 'low']),
  description: z.string().min(1).max(500),
});

export async function riskRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  app.get('/', async (req) => {
    const { status } = req.query as { status?: string };
    const risks = await listRisks(status);
    return { code: 200, data: risks, message: 'ok' };
  });

  app.post('/', { preHandler: requireRole('admin', 'manager') }, async (req) => {
    const input = createRiskSchema.parse(req.body);
    const risk = await createRisk(input.taskId, input.level, input.description);
    return { code: 200, data: risk, message: 'ok' };
  });

  app.post('/check', { preHandler: requireRole('admin', 'manager') }, async () => {
    const result = await runRiskCheck();
    return { code: 200, data: result, message: 'ok' };
  });

  app.put('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const risk = await updateRiskStatus(id, status);
    return { code: 200, data: risk, message: 'ok' };
  });
}
