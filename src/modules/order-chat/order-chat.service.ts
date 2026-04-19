import { isValidObjectId, Types } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { buildPaginationMeta, PaginationOptions } from '../../common/utils/pagination';
import { getUserPresence } from '../../socket/presence';
import { UserModel } from '../auth/auth.model';
import { BookingModel, IBooking } from '../bookings/booking.model';
import { ServiceProviderServiceModel } from '../service-provider/service-provider.model';
import { VenueProviderVenueModel } from '../venue-provider/venue-provider.model';
import {
  IOrderChatConversation,
  IOrderChatMessage,
  OrderChatConversationModel,
  OrderChatMessageModel
} from './order-chat.model';

type ChatParticipant = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isOnline: boolean;
  lastSeenAt: string | null;
};

type SerializedBookingContext = {
  _id: string;
  targetType: string;
  targetId: string;
  status: string;
  customerId: string;
  providerId: string;
  conversationId: string | null;
};

type ConversationContext = {
  conversation: {
    _id: string;
    customerId: string;
    providerId: string;
    status: string;
    activatedAt: Date | null;
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

const getReferenceId = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Types.ObjectId) {
    return String(value);
  }

  if (typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }

  return String(value);
};

const toParticipant = (user: {
  _id: unknown;
  fullName: string;
  email: string;
  role: string;
}): ChatParticipant => {
  const userId = String(user._id);
  const presence = getUserPresence(userId);

  return {
    _id: userId,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isOnline: presence.isOnline,
    lastSeenAt: presence.lastSeenAt
  };
};

const serializeConversation = (conversation: IOrderChatConversation) => ({
  _id: String(conversation._id),
  customerId: String(conversation.customerId),
  providerId: String(conversation.providerId),
  status: conversation.status,
  activatedAt: conversation.activatedAt ?? null,
  lastMessageId: conversation.lastMessageId ? String(conversation.lastMessageId) : null,
  lastMessageAt: conversation.lastMessageAt ?? null,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt
});

const serializeBooking = (booking: IBooking | null): SerializedBookingContext | null => {
  if (!booking) {
    return null;
  }

  return {
    _id: String(booking._id),
    targetType: booking.targetType,
    targetId: String(booking.targetId),
    status: booking.status,
    customerId: String(booking.customerId),
    providerId: String(booking.providerId),
    conversationId: booking.conversationId ? String(booking.conversationId) : null
  };
};

const serializeMessage = (message: IOrderChatMessage, actorId: string) => ({
  _id: String(message._id),
  conversationId: String(message.conversationId),
  bookingId: message.bookingId ? String(message.bookingId) : null,
  senderId: String(message.senderId),
  receiverId: String(message.receiverId),
  type: message.type,
  content: message.content,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  isMine: String(message.senderId) === actorId
});

export const getOrderChatRoom = (conversationId: string): string =>
  `order-chat:conversation:${conversationId}`;
export const getOrderChatPresenceRoom = (): string => 'order-chat:presence';
export const getUserSocketRoom = (userId: string): string => `user:${userId}`;

export class OrderChatService {
  private static async loadParticipants(customerId: string, providerId: string) {
    const users = await UserModel.find({
      _id: { $in: [customerId, providerId] }
    }).select('_id fullName email role');

    const customer = users.find((user) => String(user._id) === customerId);
    const provider = users.find((user) => String(user._id) === providerId);

    if (!customer || !provider) {
      throw new AppError(404, 'Conversation participants not found');
    }

    return {
      customer: toParticipant(customer),
      provider: toParticipant(provider)
    };
  }

  private static async syncBookingConversationId(booking: IBooking, conversationId: Types.ObjectId) {
    if (booking.conversationId && String(booking.conversationId) === String(conversationId)) {
      return;
    }

    booking.conversationId = conversationId;
    await booking.save();
  }

  static async getOrAssignConversationIdForBooking(booking: IBooking): Promise<Types.ObjectId | null> {
    if (booking.conversationId) {
      return booking.conversationId as Types.ObjectId;
    }

    const customerId = getReferenceId(booking.customerId);
    const providerId = getReferenceId(booking.providerId);
    const existingConversation = await this.findPairConversation(customerId, providerId);

    if (existingConversation) {
      await this.syncBookingConversationId(booking, existingConversation._id as Types.ObjectId);
      return existingConversation._id as Types.ObjectId;
    }

    if (booking.status === 'confirmed') {
      return this.activateConversationForBooking(booking);
    }

    return null;
  }

  private static async findPairConversation(customerId: string, providerId: string) {
    return OrderChatConversationModel.findOne({ customerId, providerId });
  }

  private static async getConversationContext(
    conversationId: string,
    actorId: string
  ): Promise<ConversationContext> {
    ensureObjectId(conversationId, 'conversationId');
    ensureObjectId(actorId, 'actorId');

    const conversation = await OrderChatConversationModel.findById(conversationId);
    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    const customerId = String(conversation.customerId);
    const providerId = String(conversation.providerId);
    const isParticipant = actorId === customerId || actorId === providerId;

    if (!isParticipant) {
      throw new AppError(403, 'Only conversation participants can access this chat');
    }

    if (conversation.status !== 'active') {
      throw new AppError(403, 'This conversation is not active');
    }

    const participants = await this.loadParticipants(customerId, providerId);
    const actor = actorId === customerId ? participants.customer : participants.provider;
    const counterpart = actorId === customerId ? participants.provider : participants.customer;

    return {
      conversation: {
        _id: String(conversation._id),
        customerId,
        providerId,
        status: conversation.status,
        activatedAt: conversation.activatedAt ?? null
      },
      actor,
      counterpart,
      participants
    };
  }

  static async activateConversationForBooking(booking: IBooking): Promise<Types.ObjectId> {
    const customerId = getReferenceId(booking.customerId);
    const providerId = getReferenceId(booking.providerId);

    ensureObjectId(customerId, 'customerId');
    ensureObjectId(providerId, 'providerId');

    const conversation = await OrderChatConversationModel.findOneAndUpdate(
      {
        customerId,
        providerId
      },
      {
        $setOnInsert: {
          customerId,
          providerId,
          createdAt: new Date()
        },
        $set: {
          status: 'active',
          activatedAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    await this.syncBookingConversationId(booking, conversation._id as Types.ObjectId);

    const hasSystemMessage = await OrderChatMessageModel.exists({
      conversationId: conversation._id,
      bookingId: booking._id,
      type: 'system'
    });

    if (!hasSystemMessage) {
      const systemMessage = await OrderChatMessageModel.create({
        conversationId: conversation._id,
        bookingId: booking._id,
        senderId: booking.providerId,
        receiverId: booking.customerId,
        type: 'system',
        content: `Booking ${String(booking._id)} was confirmed. Conversation is now active.`
      });

      conversation.lastMessageId = systemMessage._id as Types.ObjectId;
      conversation.lastMessageAt = systemMessage.createdAt;
      await conversation.save();
    }

    return conversation._id as Types.ObjectId;
  }

  static async getConversationByBooking(bookingId: string, actorId: string) {
    ensureObjectId(bookingId, 'bookingId');
    ensureObjectId(actorId, 'actorId');

    const booking = await BookingModel.findById(bookingId).select(
      '_id customerId providerId targetType targetId status conversationId'
    );

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    const customerId = String(booking.customerId);
    const providerId = String(booking.providerId);
    const isParticipant = actorId === customerId || actorId === providerId;

    if (!isParticipant) {
      throw new AppError(403, 'Only booking participants can access this conversation');
    }

    const assignedConversationId = await this.getOrAssignConversationIdForBooking(booking);
    let conversation = assignedConversationId
      ? await OrderChatConversationModel.findById(assignedConversationId)
      : null;

    if (!conversation) {
      if (booking.status !== 'confirmed') {
        throw new AppError(403, 'Conversation becomes available only after booking confirmation');
      }

      await this.activateConversationForBooking(booking);
      conversation = await this.findPairConversation(customerId, providerId);
    }

    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    await this.syncBookingConversationId(booking, conversation._id as Types.ObjectId);
    const context = await this.getConversationContext(String(conversation._id), actorId);

    return {
      conversation: context.conversation,
      booking: serializeBooking(booking),
      participants: context.participants
    };
  }

  static async getMessages(conversationId: string, actorId: string, pagination: PaginationOptions) {
    const context = await this.getConversationContext(conversationId, actorId);
    const total = await OrderChatMessageModel.countDocuments({ conversationId });

    const messages = await OrderChatMessageModel.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const linkedBookings = await BookingModel.find({
      conversationId
    })
      .sort({ updatedAt: -1 })
      .select('_id targetType targetId status customerId providerId conversationId');

    return {
      meta: buildPaginationMeta(total, pagination),
      conversation: context.conversation,
      participants: context.participants,
      bookings: linkedBookings.map((booking) => serializeBooking(booking)).filter(Boolean),
      data: messages.reverse().map((message) => serializeMessage(message, actorId))
    };
  }

  static async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
    bookingId?: string
  ) {
    const context = await this.getConversationContext(conversationId, senderId);
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      throw new AppError(400, 'Message content is required');
    }

    let linkedBooking: IBooking | null = null;
    if (bookingId) {
      ensureObjectId(bookingId, 'bookingId');
      linkedBooking = await BookingModel.findById(bookingId).select(
        '_id customerId providerId targetType targetId status conversationId'
      );

      if (!linkedBooking) {
        throw new AppError(404, 'Booking not found');
      }

      const participantsMatch =
        String(linkedBooking.customerId) === context.conversation.customerId &&
        String(linkedBooking.providerId) === context.conversation.providerId;

      if (!participantsMatch) {
        throw new AppError(400, 'The booking does not belong to this conversation');
      }

      await this.syncBookingConversationId(
        linkedBooking,
        new Types.ObjectId(context.conversation._id)
      );
    }

    const message = await OrderChatMessageModel.create({
      conversationId,
      bookingId: linkedBooking?._id ?? null,
      senderId,
      receiverId: context.counterpart._id,
      type: 'text',
      content: normalizedContent
    });

    await OrderChatConversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessageId: message._id,
        lastMessageAt: message.createdAt,
        updatedAt: new Date()
      }
    });

    if (linkedBooking) {
      await BookingModel.findByIdAndUpdate(linkedBooking._id, {
        $set: {
          updatedAt: new Date(),
          conversationId
        }
      });
    }

    return {
      conversation: context.conversation,
      participants: context.participants,
      booking: serializeBooking(linkedBooking),
      message: serializeMessage(message, senderId)
    };
  }

  static async listConversations(actorId: string, pagination: PaginationOptions) {
    ensureObjectId(actorId, 'actorId');

    const filter = {
      status: 'active',
      $or: [{ customerId: actorId }, { providerId: actorId }]
    };

    const [conversations, total] = await Promise.all([
      OrderChatConversationModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit),
      OrderChatConversationModel.countDocuments(filter)
    ]);

    const conversationIds = conversations.map((conversation) => String(conversation._id));
    const participantIds = new Set<string>();

    for (const conversation of conversations) {
      participantIds.add(String(conversation.customerId));
      participantIds.add(String(conversation.providerId));
    }

    const [users, latestMessages, linkedBookings] = await Promise.all([
      UserModel.find({ _id: { $in: [...participantIds] } }).select('_id fullName email role'),
      OrderChatMessageModel.aggregate<{
        _id: unknown;
        message: IOrderChatMessage;
      }>([
        {
          $match: {
            conversationId: {
              $in: conversationIds.map((id) => new Types.ObjectId(id))
            }
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$conversationId',
            message: { $first: '$$ROOT' }
          }
        }
      ]),
      BookingModel.find({ conversationId: { $in: conversationIds } })
        .sort({ updatedAt: -1 })
        .select('_id targetType targetId status bookingDate customerId providerId conversationId')
    ]);

    const userMap = new Map(users.map((user) => [String(user._id), toParticipant(user)]));
    const latestMessageMap = new Map(
      latestMessages.map((entry) => [String(entry._id), entry.message])
    );
    const latestBookingMap = new Map<string, IBooking>();

    for (const booking of linkedBookings) {
      const key = getReferenceId(booking.conversationId);
      if (key && !latestBookingMap.has(key)) {
        latestBookingMap.set(key, booking);
      }
    }

    const bookingTargetIds = {
      venues: [] as string[],
      services: [] as string[],
      eventPlanners: [] as string[]
    };

    for (const booking of latestBookingMap.values()) {
      if (booking.targetType === 'venue') {
        bookingTargetIds.venues.push(String(booking.targetId));
      } else if (booking.targetType === 'service') {
        bookingTargetIds.services.push(String(booking.targetId));
      } else if (booking.targetType === 'event') {
        bookingTargetIds.eventPlanners.push(String(booking.targetId));
      }
    }

    const [venues, services, eventPlanners] = await Promise.all([
      bookingTargetIds.venues.length
        ? VenueProviderVenueModel.find({ _id: { $in: bookingTargetIds.venues } }).select(
            '_id information.venueName'
          )
        : Promise.resolve([]),
      bookingTargetIds.services.length
        ? ServiceProviderServiceModel.find({ _id: { $in: bookingTargetIds.services } }).select(
            '_id information.serviceName'
          )
        : Promise.resolve([]),
      bookingTargetIds.eventPlanners.length
        ? UserModel.find({ _id: { $in: bookingTargetIds.eventPlanners } }).select('_id fullName')
        : Promise.resolve([])
    ]);

    const venueMap = new Map(
      venues.map((venue: any) => [String(venue._id), venue.information?.venueName ?? 'Venue'])
    );
    const serviceMap = new Map(
      services.map((service: any) => [String(service._id), service.information?.serviceName ?? 'Service'])
    );
    const eventPlannerMap = new Map(
      eventPlanners.map((planner: any) => [String(planner._id), planner.fullName ?? 'Event Planner'])
    );

    return {
      meta: buildPaginationMeta(total, pagination),
      data: conversations.map((conversation) => {
        const conversationId = String(conversation._id);
        const customerId = String(conversation.customerId);
        const providerId = String(conversation.providerId);
        const counterpartId = actorId === customerId ? providerId : customerId;
        const counterpart = userMap.get(counterpartId) ?? null;
        const latestMessage = latestMessageMap.get(conversationId);
        const latestBooking = latestBookingMap.get(conversationId) ?? null;

        let targetName = 'Conversation';
        if (latestBooking?.targetType === 'venue') {
          targetName = venueMap.get(String(latestBooking.targetId)) ?? 'Venue';
        } else if (latestBooking?.targetType === 'service') {
          targetName = serviceMap.get(String(latestBooking.targetId)) ?? 'Service';
        } else if (latestBooking?.targetType === 'event') {
          targetName = eventPlannerMap.get(String(latestBooking.targetId)) ?? 'Event Planner';
        }

        return {
          conversation: serializeConversation(conversation),
          counterpart,
          latestBooking: latestBooking
            ? {
                ...serializeBooking(latestBooking),
                targetName
              }
            : null,
          latestMessage: latestMessage
            ? serializeMessage(latestMessage as unknown as IOrderChatMessage, actorId)
            : null
        };
      })
    };
  }
}
