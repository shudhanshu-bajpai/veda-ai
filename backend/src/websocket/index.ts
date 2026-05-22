import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface ClientInfo {
  ws: WebSocket;
  assignmentIds: Set<string>;
}

const clients = new Map<string, ClientInfo>();

let wss: WebSocketServer;

export function setupWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substring(7);
    clients.set(clientId, { ws, assignmentIds: new Set() });

    console.log(`WebSocket client connected: ${clientId}`);

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "subscribe" && message.assignmentId) {
          const client = clients.get(clientId);
          if (client) {
            client.assignmentIds.add(message.assignmentId);
            console.log(
              `Client ${clientId} subscribed to assignment ${message.assignmentId}`
            );
          }
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });

    ws.send(JSON.stringify({ type: "connected", clientId }));
  });
}

export function notifyAssignmentUpdate(
  assignmentId: string,
  data: Record<string, unknown>
): void {
  const message = JSON.stringify({
    type: "assignment_update",
    assignmentId,
    ...data,
  });

  clients.forEach((client) => {
    if (
      client.assignmentIds.has(assignmentId) &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      client.ws.send(message);
    }
  });
}

export function broadcastToAll(data: Record<string, unknown>): void {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}
