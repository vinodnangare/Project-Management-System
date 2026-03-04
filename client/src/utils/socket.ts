import { io, Socket } from 'socket.io-client';

// Use Vite env var, fallback to same origin (server runs on port 5000)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Get or create socket connection with authentication.
 * Always includes the current auth token from localStorage.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('access token');
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: { token: token ? `Bearer ${token}` : '' },
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });
  }
  return socket;
};

/**
 * Disconnect and clean up socket connection.
 * Call this on logout.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('[Socket.IO] Socket disconnected and cleaned up');
  }
};

/**
 * Reconnect socket with fresh auth token.
 * Call this after login to establish authenticated connection.
 */
export const reconnectSocket = (): Socket => {
  disconnectSocket();
  return getSocket();
};
