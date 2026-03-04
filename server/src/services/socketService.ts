import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

interface JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let io: SocketIOServer | null = null;

/**
 * Initialize the Socket.IO server and attach it to the given HTTP server.
 * Call this ONCE from index.ts right after creating the HTTP server.
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',   // tighten in production
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Use websocket-first transport for lower latency; fall back to polling
    transports: ['websocket', 'polling'],
  });

  // ─── JWT Auth Middleware ─────────────────────────────────────────────────
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      // The client sends the token as a handshake auth object:
      //   socket = io(url, { auth: { token: "Bearer <jwt>" } })
      // OR as a query param:
      //   socket = io(url, { query: { token: "<jwt>" } })

      const rawToken: string =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token as string ||
        '';

      const token = rawToken.startsWith('Bearer ')
        ? rawToken.slice(7)
        : rawToken;

      if (!token) {
        return next(new Error('Authentication error: no token provided'));
      }

      const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
      const payload = jwt.verify(token, secret) as JwtPayload;

      socket.userId    = payload.id;
      socket.userEmail = payload.email;
      socket.userRole  = payload.role;

      next();
    } catch (err) {
      next(new Error('Authentication error: invalid or expired token'));
    }
  });

  // ─── Connection Handler ──────────────────────────────────────────────────
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // Every user joins their own private room so we can target them precisely
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    console.log(
      `[Socket.IO] ✅  User connected — userId: ${userId}  socketId: ${socket.id}`
    );

    // ── Client events ──────────────────────────────────────────────────────

    /**
     * Client can call this to mark a notification as read without an HTTP call.
     * The actual DB write is still done via the REST API – this is just an
     * acknowledgement channel that keeps things in sync in real-time.
     *
     * Payload: { notificationId: string }
     */
    socket.on(
      'notification:markRead',
      (payload: { notificationId: string }, ack?: Function) => {
        console.log(
          `[Socket.IO] notification:markRead — userId: ${userId}  id: ${payload?.notificationId}`
        );
        // Optionally persist here; for now the frontend still calls PATCH /api/notifications/:id/read
        if (typeof ack === 'function') ack({ success: true });
      }
    );

    /**
     * Ping/pong – useful for frontend heartbeat checks.
     */
    socket.on('ping', (ack?: Function) => {
      if (typeof ack === 'function') ack('pong');
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(
        `[Socket.IO] ❌  User disconnected — userId: ${userId}  reason: ${reason}`
      );
    });
  });

  console.log('[Socket.IO] Server initialised');
  return io;
}

/**
 * Get the Socket.IO server instance.
 * Throws if called before initSocketServer().
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error(
      'Socket.IO server not initialised. Call initSocketServer(httpServer) first.'
    );
  }
  return io;
}

/**
 * Emit a real-time notification to ONE specific user.
 *
 * @param userId     MongoDB user ObjectId string
 * @param notification  The notification object to push
 */
export function emitNotificationToUser(
  userId: string,
  notification: {
    id: string;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }
): void {
  if (!io) {
    console.warn('[Socket.IO] emitNotificationToUser called before init — skipping');
    return;
  }
  const room = `user:${userId}`;
  io.to(room).emit('notification:new', notification);
  console.log(`[Socket.IO] 📨  Notification emitted to room "${room}"`);
}

/**
 * Broadcast a notification to ALL connected users (e.g. system-wide alerts).
 *
 * @param notification  The notification object to broadcast
 */
export function broadcastNotification(notification: {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}): void {
  if (!io) {
    console.warn('[Socket.IO] broadcastNotification called before init — skipping');
    return;
  }
  io.emit('notification:broadcast', notification);
  console.log('[Socket.IO] 📢  Broadcast notification emitted');
}
