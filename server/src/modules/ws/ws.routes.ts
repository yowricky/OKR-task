import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const clients = new Map<string, WebSocket>();

export async function wsRoutes(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    const token = (req.query as any)?.token;

    if (!token) {
      socket.close(4001, 'Authentication required');
      return;
    }

    let userId: string;
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
      userId = payload.sub;
    } catch {
      socket.close(4001, 'Invalid token');
      return;
    }

    clients.set(userId, socket);

    socket.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data);
        if (msg.to && clients.has(msg.to)) {
          clients.get(msg.to)?.send(JSON.stringify(msg));
        }
      } catch {
        // ignore invalid messages
      }
    });

    socket.on('close', () => {
      clients.delete(userId);
    });
  });
}

// Broadcast risk alerts to specific users
export function broadcastRisk(userIds: string[], message: object) {
  for (const uid of userIds) {
    const client = clients.get(uid);
    if (client && client.readyState === 1) {
      client.send(JSON.stringify({ type: 'risk_alert', ...message }));
    }
  }
}
