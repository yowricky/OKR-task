import type { FastifyInstance } from 'fastify';

const clients = new Map<string, WebSocket>();

export async function wsRoutes(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    const userId = (req as any).user?.sub || 'anonymous';
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
