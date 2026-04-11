import { Server, Socket } from 'socket.io';
import { AppError } from '../common/errors/AppError';
import { authenticateToken, AuthenticatedUser } from '../common/utils/auth-user';
import { OrderChatService, getOrderChatRoom } from '../modules/order-chat/order-chat.service';

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

    socket.emit('order-chat:connected', {
      success: true,
      user: {
        _id: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

    socket.on('order-chat:join', async (payload, callback) => {
      try {
        const bookingId = typeof payload?.bookingId === 'string' ? payload.bookingId : '';
        const historyPage = Number.isFinite(Number(payload?.page)) ? Number(payload.page) : 1;
        const historyLimit = Number.isFinite(Number(payload?.limit)) ? Number(payload.limit) : 50;

        const messages = await OrderChatService.getMessages(bookingId, user.userId, {
          page: historyPage > 0 ? historyPage : 1,
          limit: historyLimit > 0 ? Math.min(historyLimit, 100) : 50,
          skip: (Math.max(historyPage, 1) - 1) * (historyLimit > 0 ? Math.min(historyLimit, 100) : 50),
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        await socket.join(getOrderChatRoom(bookingId));

        callback?.({
          success: true,
          booking: messages.booking,
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
      const bookingId = typeof payload?.bookingId === 'string' ? payload.bookingId : '';
      await socket.leave(getOrderChatRoom(bookingId));
      callback?.({
        success: true
      });
    });

    socket.on('order-chat:message:send', async (payload, callback) => {
      try {
        const bookingId = typeof payload?.bookingId === 'string' ? payload.bookingId : '';
        const content = typeof payload?.content === 'string' ? payload.content : '';
        const result = await OrderChatService.createMessage(bookingId, user.userId, content);
        const room = getOrderChatRoom(bookingId);

        await socket.join(room);
        io.to(room).emit('order-chat:message:new', {
          success: true,
          booking: result.booking,
          participants: result.participants,
          data: result.message
        });

        callback?.({
          success: true,
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
  });
};
