import http from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { registerOrderChatSocket } from './order-chat.socket';

const buildCorsOrigin = (): string | string[] => {
  if (env.CORS_ORIGIN === '*') {
    return '*';
  }

  const origins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : '*';
};

let io: Server | null = null;

export const initializeSocketServer = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: buildCorsOrigin(),
      credentials: true
    }
  });

  registerOrderChatSocket(io);
  return io;
};

export const getSocketServer = (): Server | null => io;

