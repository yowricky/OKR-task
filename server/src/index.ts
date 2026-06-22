import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './modules/auth/auth.routes';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(authRoutes, { prefix: '/api/auth' });

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Server running on port ${port}`);
}

main();
