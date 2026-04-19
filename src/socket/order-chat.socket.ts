import { Server, Socket } from 'socket.io';
import { AppError } from '../common/errors/AppError';
import { authenticateToken, AuthenticatedUser } from '../common/utils/auth-user';
import {
  getOrderChatPresenceRoom,
  getOrderChatRoom,
  getUserSocketRoom,
  OrderChatService
} from '../modules/order-chat/order-chat.service';
import { markUserOffline, markUserOnline } from './presence';

type OrderChatSocket = Socket & {
  data: {
    user?: AuthenticatedUser;
  };
};

const getTokenFromSocket = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
  }

  const authorizationHeader = socket.handshake.headers.authorization;
  if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.slice(7);
  }

  return null;
};

const toSocketError = (error: unknown): Error => {
  if (error instanceof AppError) {
    return new Error(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unexpected socket error');
};

const getSocketUser = (socket: OrderChatSocket): AuthenticatedUser => {
  if (!socket.data.user) {
    throw new AppError(401, 'Authentication required: connect with a valid token before using order chat');
  }

  return socket.data.user;
};

export const registerOrderChatSocket = (io: Server): void => {
  io.use(async (socket: Socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error('Unauthorized: missing token'));
      }

      (socket as OrderChatSocket).data.user = await authenticateToken(token);
      return next();
    } catch (error) {
      return next(toSocketError(error));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as OrderChatSocket;
    const user = getSocketUser(socket);
    const presence = markUserOnline(user.userId);

    void socket.join(getUserSocketRoom(user.userId));
    void socket.join(getOrderChatPresenceRoom());

    socket.emit('order-chat:connected', {
      success: true,
      user: {
        _id: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      presence: {
        userId: user.userId,
        isOnline: presence.isOnline,
        lastSeenAt: presence.lastSeenAt
      }
    });

    io.to(getOrderChatPresenceRoom()).emit('order-chat:presence:update', {
      success: true,
      data: {
        userId: user.userId,
        isOnline: true,
        lastSeenAt: presence.lastSeenAt
      }
    });

    socket.on('order-chat:join', async (payload, callback) => {
      try {
        const conversationId = typeof payload?.conversationId === 'string' ? payload.conversationId : '';
        const historyPage = Number.isFinite(Number(payload?.page)) ? Number(payload.page) : 1;
        const historyLimit = Number.isFinite(Number(payload?.limit)) ? Number(payload.limit) : 50;

        const messages = await OrderChatService.getMessages(conversationId, user.userId, {
          page: historyPage > 0 ? historyPage : 1,
          limit: historyLimit > 0 ? Math.min(historyLimit, 100) : 50,
          skip: (Math.max(historyPage, 1) - 1) * (historyLimit > 0 ? Math.min(historyLimit, 100) : 50),
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        await socket.join(getOrderChatRoom(conversationId));

        callback?.({
          success: true,
          conversation: messages.conversation,
          bookings: messages.bookings,
          participants: messages.participants,
          meta: messages.meta,
          data: messages.data
        });
      } catch (error) {
        callback?.({
          success: false,
          message: toSocketError(error).message
        });
      }
    });

    socket.on('order-chat:leave', async (payload, callback) => {
      const conversationId = typeof payload?.conversationId === 'string' ? payload.conversationId : '';
      await socket.leave(getOrderChatRoom(conversationId));
      callback?.({
        success: true
      });
    });

    socket.on('order-chat:message:send', async (payload, callback) => {
      try {
        const conversationId = typeof payload?.conversationId === 'string' ? payload.conversationId : '';
        const bookingId = typeof payload?.bookingId === 'string' ? payload.bookingId : undefined;
        const content = typeof payload?.content === 'string' ? payload.content : '';
        const result = await OrderChatService.createMessage(conversationId, user.userId, content, bookingId);
        const room = getOrderChatRoom(conversationId);

        await socket.join(room);
        io.to(room).emit('order-chat:message:new', {
          success: true,
          conversation: result.conversation,
          booking: result.booking,
          participants: result.participants,
          data: result.message
        });

        callback?.({
          success: true,
          conversation: result.conversation,
          booking: result.booking,
          participants: result.participants,
          data: result.message
        });
      } catch (error) {
        callback?.({
          success: false,
          message: toSocketError(error).message
        });
      }
    });

    socket.on('disconnect', () => {
      const snapshot = markUserOffline(user.userId);

      io.to(getOrderChatPresenceRoom()).emit('order-chat:presence:update', {
        success: true,
        data: {
          userId: user.userId,
          isOnline: snapshot.isOnline,
          lastSeenAt: snapshot.lastSeenAt
        }
      });
    });
  });
};
