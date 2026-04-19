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
  static listConversations = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const conversations = await OrderChatService.listConversations(user.userId, pagination);

    return res.status(200).json({
      success: true,
      meta: conversations.meta,
      data: conversations.data
    });
  });

  static getMessages = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const messages = await OrderChatService.getMessages(req.params.conversationId, user.userId, pagination);

    return res.status(200).json({
      success: true,
      meta: messages.meta,
      conversation: messages.conversation,
      bookings: messages.bookings,
      participants: messages.participants,
      data: messages.data
    });
  });

  static getConversationByBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const result = await OrderChatService.getConversationByBooking(req.params.bookingId, user.userId);

    return res.status(200).json({
      success: true,
      conversation: result.conversation,
      booking: result.booking,
      participants: result.participants
    });
  });

  static sendMessage = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const result = await OrderChatService.createMessage(
      req.params.conversationId,
      user.userId,
      req.body.content,
      req.body.bookingId
    );
    const io = getSocketServer();

    io?.to(getOrderChatRoom(req.params.conversationId)).emit('order-chat:message:new', {
      success: true,
      conversation: result.conversation,
      booking: result.booking,
      participants: result.participants,
      data: result.message
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      conversation: result.conversation,
      booking: result.booking,
      participants: result.participants,
      data: result.message
    });
  });
}
