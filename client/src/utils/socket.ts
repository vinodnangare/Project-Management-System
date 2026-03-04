import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Get or create a socket connection with JWT auth.
 * The token is retrieved from localStorage each time to ensure it's current.
 */
export const getSocket = (): Socket => {
  const token = localStorage.getItem('accessToken') || '';

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
    });
  }

  return socket;
};

/**
 * Reconnect the socket with a fresh token (call after login).
 */
export const reconnectSocket = (): Socket => {
  disconnectSocket();
  return getSocket();
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
