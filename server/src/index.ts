import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './modules/auth/auth.routes';
import { calendarRoutes } from './modules/calendar/calendar.routes';
import { okrRoutes } from './modules/okr/okr.routes';
import { riskRoutes } from './modules/risk/risk.routes';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(calendarRoutes, { prefix: '/api/calendar' });
  await app.register(okrRoutes, { prefix: '/api/okr' });

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
