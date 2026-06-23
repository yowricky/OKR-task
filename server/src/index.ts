import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './modules/auth/auth.routes';
import { calendarRoutes } from './modules/calendar/calendar.routes';
import { okrRoutes } from './modules/okr/okr.routes';
import { riskRoutes } from './modules/risk/risk.routes';
import { taskRoutes } from './modules/tasks/tasks.routes';
import { wsRoutes } from './modules/ws/ws.routes';
import { orgRoutes } from './modules/org/org.routes';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(calendarRoutes, { prefix: '/api/calendar' });
  await app.register(okrRoutes, { prefix: '/api/okr' });
  await app.register(riskRoutes, { prefix: '/api/risks' });
  await app.register(taskRoutes, { prefix: '/api/tasks' });
  await app.register(orgRoutes, { prefix: '/api/org' });
  await app.register(wsRoutes);

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Server running on port ${port}`);

  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
