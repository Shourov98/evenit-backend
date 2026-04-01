import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { buildPaginationMeta, PaginationOptions } from '../../common/utils/pagination';
import { UserModel } from '../auth/auth.model';
import { BookingModel } from '../bookings/booking.model';
import { IOrderChatMessage, OrderChatMessageModel } from './order-chat.model';

type ChatParticipant = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
};

type ChatContext = {
  booking: {
    _id: string;
    targetType: string;
    targetId: string;
    status: string;
    customerId: string;
    providerId: string;
  };
  actor: ChatParticipant;
  counterpart: ChatParticipant;
  participants: {
    customer: ChatParticipant;
    provider: ChatParticipant;
  };
};

const ensureObjectId = (value: string, label: string): void => {
  if (!isValidObjectId(value)) {
    throw new AppError(400, `Invalid ${label}`);
  }
};

const toParticipant = (user: {
  _id: unknown;
  fullName: string;
  email: string;
  role: string;
}): ChatParticipant => ({
  _id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  role: user.role
});

const serializeMessage = (message: IOrderChatMessage, actorId: string) => ({
  _id: String(message._id),
  bookingId: String(message.bookingId),
  senderId: String(message.senderId),
  receiverId: String(message.receiverId),
  content: message.content,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  isMine: String(message.senderId) === actorId
});

export const getOrderChatRoom = (bookingId: string): string => `order-chat:${bookingId}`;

export class OrderChatService {
  static async getChatContext(bookingId: string, actorId: string): Promise<ChatContext> {
    ensureObjectId(bookingId, 'bookingId');
    ensureObjectId(actorId, 'actorId');

    const booking = await BookingModel.findById(bookingId).select(
      '_id customerId providerId targetType targetId status'
    );
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    const customerId = String(booking.customerId);
    const providerId = String(booking.providerId);
    const isParticipant = actorId === customerId || actorId === providerId;

    if (!isParticipant) {
      throw new AppError(403, 'Only booking participants can access this chat');
    }

    const users = await UserModel.find({
      _id: { $in: [booking.customerId, booking.providerId] }
    }).select('_id fullName email role');

    const customer = users.find((user) => String(user._id) === customerId);
    const provider = users.find((user) => String(user._id) === providerId);

    if (!customer || !provider) {
      throw new AppError(404, 'Booking participants not found');
    }

    const customerParticipant = toParticipant(customer);
    const providerParticipant = toParticipant(provider);
    const actor = actorId === customerId ? customerParticipant : providerParticipant;
    const counterpart = actorId === customerId ? providerParticipant : customerParticipant;

    return {
      booking: {
        _id: String(booking._id),
        targetType: booking.targetType,
        targetId: String(booking.targetId),
        status: booking.status,
        customerId,
        providerId
      },
      actor,
      counterpart,
      participants: {
        customer: customerParticipant,
        provider: providerParticipant
      }
    };
  }

  static async getMessages(bookingId: string, actorId: string, pagination: PaginationOptions) {
    const context = await this.getChatContext(bookingId, actorId);
    const total = await OrderChatMessageModel.countDocuments({ bookingId });

    const messages = await OrderChatMessageModel.find({ bookingId })
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return {
      meta: buildPaginationMeta(total, pagination),
      booking: context.booking,
      participants: context.participants,
      data: messages.reverse().map((message) => serializeMessage(message, actorId))
    };
  }

  static async createMessage(bookingId: string, senderId: string, content: string) {
    const context = await this.getChatContext(bookingId, senderId);
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      throw new AppError(400, 'Message content is required');
    }

    const message = await OrderChatMessageModel.create({
      bookingId,
      senderId,
      receiverId: context.counterpart._id,
      content: normalizedContent
    });

    return {
      booking: context.booking,
      participants: context.participants,
      message: serializeMessage(message, senderId)
    };
  }
}

