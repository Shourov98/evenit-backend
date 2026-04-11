import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
import { parsePagination } from '../../common/utils/pagination';
import { getSocketServer } from '../../socket';
import { getOrderChatRoom, OrderChatService } from './order-chat.service';

const getUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required: sign in before accessing booking chat');
  }

  return req.user;
};

export class OrderChatController {
  static getMessages = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const messages = await OrderChatService.getMessages(req.params.bookingId, user.userId, pagination);

    return res.status(200).json({
      success: true,
      meta: messages.meta,
      booking: messages.booking,
      participants: messages.participants,
      data: messages.data
    });
  });

  static sendMessage = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const result = await OrderChatService.createMessage(req.params.bookingId, user.userId, req.body.content);
    const io = getSocketServer();

    io?.to(getOrderChatRoom(req.params.bookingId)).emit('order-chat:message:new', {
      success: true,
      booking: result.booking,
      participants: result.participants,
      data: result.message
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      booking: result.booking,
      participants: result.participants,
      data: result.message
    });
  });
}
