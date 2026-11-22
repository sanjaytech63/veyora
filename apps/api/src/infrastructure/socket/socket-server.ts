import http from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { SOCKET_ROOMS, SOCKET_EVENTS } from "@veyora/config";
import { socketAuthMiddleware, AuthenticatedSocketUser } from "./socket-auth";
import { createRedisClient } from "../redis/redis-client";

export class SocketServer {
  private static instance: SocketServer;
  private io: Server | null = null;
  private pubClient: ReturnType<typeof createRedisClient> | null = null;
  private subClient: ReturnType<typeof createRedisClient> | null = null;

  public static getInstance(): SocketServer {
    if (!SocketServer.instance) {
      SocketServer.instance = new SocketServer();
    }
    return SocketServer.instance;
  }

  public init(httpServer: http.Server): Server {
    const origin =
      env.CORS_ORIGIN === "*"
        ? true
        : env.CORS_ORIGIN.includes(",")
        ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
        : [env.CORS_ORIGIN, "http://localhost:3000", "http://localhost:3001"];

    this.io = new Server(httpServer, {
      cors: {
        origin,
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    // 1. Configure Redis Adapter for multi-instance horizontal scaling
    if (env.NODE_ENV !== "test") {
      try {
        this.pubClient = createRedisClient();
        this.subClient = createRedisClient();
        this.io.adapter(createAdapter(this.pubClient, this.subClient));
        logger.info("Socket.IO Redis adapter attached for multi-replica scaling");
      } catch (err) {
        logger.warn(
          { error: (err as Error).message },
          "Socket.IO Redis adapter fallback to in-memory adapter for test/dev"
        );
      }
    }

    // 2. Attach strict token authentication
    this.io.use(socketAuthMiddleware);

    // 3. Connection lifecycle & room authorization
    this.io.on("connection", (socket: Socket) => {
      const user = socket.data.user as AuthenticatedSocketUser | undefined;
      if (!user) {
        socket.disconnect(true);
        return;
      }

      // Automatically join verified user room
      const userRoom = SOCKET_ROOMS.user(user.id);
      socket.join(userRoom);

      // Join authorized admin rooms if role is privileged
      if (user.role === "admin" || user.role === "superadmin") {
        socket.join(SOCKET_ROOMS.adminOrders);
        socket.join(SOCKET_ROOMS.adminPayments);
        socket.join(SOCKET_ROOMS.adminInventory);
        logger.debug({ socketId: socket.id, userId: user.id }, "Admin joined operational rooms");
      }

      logger.info(
        { socketId: socket.id, userId: user.id, role: user.role },
        "Client connected to real-time socket channel"
      );

      // Client-to-server read acknowledgment
      socket.on(SOCKET_EVENTS.CLIENT_TO_SERVER.MARK_NOTIFICATION_READ, (data) => {
        logger.debug({ userId: user.id, data }, "Client marked notification read");
      });

      socket.on("disconnect", (reason) => {
        logger.debug({ socketId: socket.id, userId: user.id, reason }, "Socket disconnected");
      });
    });

    return this.io;
  }

  public getIO(): Server | null {
    return this.io;
  }

  public async close(): Promise<void> {
    if (this.io) {
      await new Promise<void>((resolve) => {
        this.io!.close(() => {
          resolve();
        });
      });
      this.io = null;
    }
    if (this.pubClient) {
      try {
        await this.pubClient.quit();
      } catch {
        // Ignore disconnection error during shutdown
      }
      this.pubClient = null;
    }
    if (this.subClient) {
      try {
        await this.subClient.quit();
      } catch {
        // Ignore disconnection error during shutdown
      }
      this.subClient = null;
    }
  }
}

export const socketServer = SocketServer.getInstance();
