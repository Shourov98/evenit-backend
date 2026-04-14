import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { buildPaginationMeta, PaginationOptions } from '../../common/utils/pagination';
import { getUserPresence } from '../../socket/presence';
import { UserModel } from '../auth/auth.model';
import { BookingModel } from '../bookings/booking.model';
import { ServiceProviderServiceModel } from '../service-provider/service-provider.model';
import { VenueProviderVenueModel } from '../venue-provider/venue-provider.model';
import { IOrderChatMessage, OrderChatMessageModel } from './order-chat.model';

type ChatParticipant = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isOnline: boolean;
  lastSeenAt: string | null;
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
export const getOrderChatPresenceRoom = (): string => 'order-chat:presence';
export const getUserSocketRoom = (userId: string): string => `user:${userId}`;

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

    await BookingModel.findByIdAndUpdate(bookingId, {
      $set: {
        updatedAt: new Date()
      }
    });

    return {
      booking: context.booking,
      participants: context.participants,
      message: serializeMessage(message, senderId)
    };
  }

  static async listConversations(actorId: string, pagination: PaginationOptions) {
    ensureObjectId(actorId, 'actorId');

    const filter = {
      $or: [{ customerId: actorId }, { providerId: actorId }]
    };

    const [bookings, total] = await Promise.all([
      BookingModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .select('_id targetType targetId status bookingDate customerId providerId createdAt updatedAt'),
      BookingModel.countDocuments(filter)
    ]);

    const bookingIds = bookings.map((booking) => String(booking._id));
    const latestMessages = await OrderChatMessageModel.aggregate<{
      _id: unknown;
      message: {
        _id: unknown;
        bookingId: unknown;
        senderId: unknown;
        receiverId: unknown;
        content: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }>([
      {
        $match: {
          bookingId: {
            $in: bookingIds.map((bookingId) => bookingId)
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$bookingId',
          message: { $first: '$$ROOT' }
        }
      }
    ]);

    const latestMessageMap = new Map(
      latestMessages.map((entry) => [String(entry._id), entry.message])
    );

    const participantIds = new Set<string>();
    const venueIds: string[] = [];
    const serviceIds: string[] = [];
    const eventPlannerIds: string[] = [];

    for (const booking of bookings) {
      participantIds.add(String(booking.customerId));
      participantIds.add(String(booking.providerId));

      if (booking.targetType === 'venue') {
        venueIds.push(String(booking.targetId));
      } else if (booking.targetType === 'service') {
        serviceIds.push(String(booking.targetId));
      } else if (booking.targetType === 'event') {
        eventPlannerIds.push(String(booking.targetId));
      }
    }

    const [users, venues, services, eventPlanners] = await Promise.all([
      UserModel.find({
        _id: { $in: [...participantIds] }
      }).select('_id fullName email role'),
      venueIds.length > 0
        ? VenueProviderVenueModel.find({ _id: { $in: venueIds } }).select('_id information.venueName')
        : Promise.resolve([]),
      serviceIds.length > 0
        ? ServiceProviderServiceModel.find({ _id: { $in: serviceIds } }).select('_id information.serviceName')
        : Promise.resolve([]),
      eventPlannerIds.length > 0
        ? UserModel.find({ _id: { $in: eventPlannerIds } }).select('_id fullName')
        : Promise.resolve([])
    ]);

    const userMap = new Map(users.map((user) => [String(user._id), toParticipant(user)]));
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
      data: bookings.map((booking) => {
        const bookingId = String(booking._id);
        const customerId = String(booking.customerId);
        const providerId = String(booking.providerId);
        const counterpartId = actorId === customerId ? providerId : customerId;
        const counterpart = userMap.get(counterpartId);
        const lastMessage = latestMessageMap.get(bookingId);

        let targetName = 'Booking';
        if (booking.targetType === 'venue') {
          targetName = venueMap.get(String(booking.targetId)) ?? 'Venue';
        } else if (booking.targetType === 'service') {
          targetName = serviceMap.get(String(booking.targetId)) ?? 'Service';
        } else if (booking.targetType === 'event') {
          targetName = eventPlannerMap.get(String(booking.targetId)) ?? 'Event Planner';
        }

        return {
          booking: {
            _id: bookingId,
            targetType: booking.targetType,
            targetId: String(booking.targetId),
            targetName,
            status: booking.status,
            bookingDate: booking.bookingDate,
            customerId,
            providerId
          },
          counterpart: counterpart ?? null,
          latestMessage: lastMessage
            ? serializeMessage(lastMessage as unknown as IOrderChatMessage, actorId)
            : null
        };
      })
    };
  }
}
