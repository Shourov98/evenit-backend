import { Types } from 'mongoose';
import { OrderChatService } from './order-chat.service';
import {
  OrderChatConversationModel,
  OrderChatMessageModel
} from './order-chat.model';

jest.mock('../../socket/presence', () => ({
  getUserPresence: jest.fn(() => ({
    isOnline: false,
    lastSeenAt: null
  }))
}));

jest.mock('../auth/auth.model', () => ({
  UserModel: {
    find: jest.fn(),
    findById: jest.fn()
  }
}));

jest.mock('../bookings/booking.model', () => ({
  BookingModel: {
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

jest.mock('../service-provider/service-provider.model', () => ({
  ServiceProviderServiceModel: {
    find: jest.fn()
  }
}));

jest.mock('../venue-provider/venue-provider.model', () => ({
  VenueProviderVenueModel: {
    find: jest.fn()
  }
}));

jest.mock('./order-chat.model', () => ({
  OrderChatConversationModel: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn()
  },
  OrderChatMessageModel: {
    exists: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn()
  }
}));

describe('OrderChatService conversation activation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reuses the existing pair conversation and backfills booking.conversationId', async () => {
    const existingConversationId = new Types.ObjectId();
    const booking = {
      _id: new Types.ObjectId(),
      customerId: new Types.ObjectId(),
      providerId: new Types.ObjectId(),
      status: 'pending',
      conversationId: null,
      save: jest.fn().mockResolvedValue(undefined)
    } as any;

    (OrderChatConversationModel.findOne as jest.Mock).mockResolvedValue({
      _id: existingConversationId
    });

    const result = await OrderChatService.getOrAssignConversationIdForBooking(booking);

    expect(String(result)).toBe(String(existingConversationId));
    expect(String(booking.conversationId)).toBe(String(existingConversationId));
    expect(booking.save).toHaveBeenCalledTimes(1);
  });

  it('activates a confirmed booking conversation and creates one system message only once', async () => {
    const conversationId = new Types.ObjectId();
    const systemMessageId = new Types.ObjectId();
    const booking = {
      _id: new Types.ObjectId(),
      customerId: new Types.ObjectId(),
      providerId: new Types.ObjectId(),
      status: 'confirmed',
      conversationId: null,
      save: jest.fn().mockResolvedValue(undefined)
    } as any;

    const conversationDoc = {
      _id: conversationId,
      save: jest.fn().mockResolvedValue(undefined)
    };

    (OrderChatConversationModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
      conversationDoc
    );
    (OrderChatMessageModel.exists as jest.Mock).mockResolvedValue(false);
    (OrderChatMessageModel.create as jest.Mock).mockResolvedValue({
      _id: systemMessageId,
      createdAt: new Date('2026-04-20T10:00:00.000Z')
    });

    const result = await OrderChatService.activateConversationForBooking(booking);

    expect(String(result)).toBe(String(conversationId));
    expect(String(booking.conversationId)).toBe(String(conversationId));
    expect(OrderChatMessageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId,
        bookingId: booking._id,
        type: 'system'
      })
    );
    expect(conversationDoc.save).toHaveBeenCalledTimes(1);
  });
});
