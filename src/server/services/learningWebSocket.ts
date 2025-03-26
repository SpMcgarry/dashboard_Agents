import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import { authenticateUser } from "../middleware/auth";

interface LearningClient {
  userId: number;
  agentId: string;
  ws: WebSocket;
}

class LearningWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, LearningClient>;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map();
    this.initialize();
  }

  private initialize() {
    this.wss.on("connection", async (ws: WebSocket, req) => {
      try {
        // Extract token from query parameters
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
          ws.close(1008, "Authentication required");
          return;
        }

        // Authenticate user
        const user = await authenticateUser(token);
        if (!user) {
          ws.close(1008, "Invalid authentication");
          return;
        }

        // Extract agent ID from query parameters
        const agentId = url.searchParams.get("agentId");
        if (!agentId) {
          ws.close(1008, "Agent ID required");
          return;
        }

        // Store client connection
        const clientId = `${user.id}-${agentId}`;
        this.clients.set(clientId, {
          userId: user.id,
          agentId,
          ws,
        });

        // Handle client disconnect
        ws.on("close", () => {
          this.clients.delete(clientId);
        });

        // Handle errors
        ws.on("error", (error) => {
          console.error("WebSocket error:", error);
          this.clients.delete(clientId);
        });

      } catch (error) {
        console.error("Error in WebSocket connection:", error);
        ws.close(1011, "Internal server error");
      }
    });
  }

  public sendProgress(agentId: string, progress: number, message?: string) {
    const clients = Array.from(this.clients.values()).filter(
      (client) => client.agentId === agentId
    );

    const update = {
      type: "progress",
      progress,
      message,
      timestamp: new Date().toISOString(),
    };

    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(update));
      }
    });
  }

  public sendError(agentId: string, error: string) {
    const clients = Array.from(this.clients.values()).filter(
      (client) => client.agentId === agentId
    );

    const update = {
      type: "error",
      error,
      timestamp: new Date().toISOString(),
    };

    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(update));
      }
    });
  }

  public sendComplete(agentId: string, result: any) {
    const clients = Array.from(this.clients.values()).filter(
      (client) => client.agentId === agentId
    );

    const update = {
      type: "complete",
      result,
      timestamp: new Date().toISOString(),
    };

    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(update));
      }
    });
  }
}

let wssInstance: LearningWebSocketServer;

export function initializeWebSocket(server: Server) {
  wssInstance = new LearningWebSocketServer(server);
}

export function getWebSocketServer(): LearningWebSocketServer {
  if (!wssInstance) {
    throw new Error("WebSocket server not initialized");
  }
  return wssInstance;
} 