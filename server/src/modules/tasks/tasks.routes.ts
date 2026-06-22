import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from './tasks.schema';
import { listTasks, createTask, updateTask, deleteTask, getTask, getSubTasks } from './tasks.service';

export async function taskRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  app.get('/', async (req) => {
    const query = taskQuerySchema.parse(req.query);
    const result = await listTasks(query);
    return { code: 200, data: result, message: 'ok' };
  });

  app.get('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const task = await getTask(id);
    return { code: 200, data: task, message: 'ok' };
  });

  app.get('/:id/subtasks', async (req) => {
    const { id } = req.params as { id: string };
    const subtasks = await getSubTasks(id);
    return { code: 200, data: subtasks, message: 'ok' };
  });

  app.post('/', async (req) => {
    const input = createTaskSchema.parse(req.body);
    const task = await createTask(input, (req as any).user.sub);
    return { code: 200, data: task, message: 'ok' };
  });

  app.put('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const input = updateTaskSchema.parse(req.body);
    const task = await updateTask(id, input);
    return { code: 200, data: task, message: 'ok' };
  });

  app.delete('/:id', async (req) => {
    const { id } = req.params as { id: string };
    await deleteTask(id);
    return { code: 200, data: null, message: 'ok' };
  });
}
