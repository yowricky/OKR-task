import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { createEventSchema, updateEventSchema, calendarQuerySchema } from './calendar.schema';
import { getEvents, createEvent, updateEvent, deleteEvent } from './calendar.service';

export async function calendarRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  app.get('/events', async (req) => {
    const query = calendarQuerySchema.parse(req.query);
    const events = await getEvents(query.start, query.end, (req as any).user.sub);
    return { code: 200, data: events, message: 'ok' };
  });

  app.post('/events', async (req) => {
    const input = createEventSchema.parse(req.body);
    const event = await createEvent(input, (req as any).user.sub);
    return { code: 200, data: event, message: 'ok' };
  });

  app.put('/events/:id', async (req) => {
    const { id } = req.params as { id: string };
    const input = updateEventSchema.parse(req.body);
    const event = await updateEvent(id, input, (req as any).user.sub);
    return { code: 200, data: event, message: 'ok' };
  });

  app.delete('/events/:id', async (req) => {
    const { id } = req.params as { id: string };
    await deleteEvent(id, (req as any).user.sub);
    return { code: 200, data: null, message: 'ok' };
  });
}
