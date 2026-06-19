import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** URL del servidor de WebSocket (la API sin el sufijo /api). */
function wsUrl(): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
  return base.replace(/\/api\/?$/, '');
}

/** Conecta (o reconecta) el socket autenticado con el access token. */
export function connectSocket(token: string): Socket {
  if (socket) socket.disconnect();
  socket = io(wsUrl(), { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
