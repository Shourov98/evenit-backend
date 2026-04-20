import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { buildPaginationMeta, PaginationOptions } from '../../common/utils/pagination';
import { getSocketServer } from '../../socket';
import { UserModel, UserRole } from '../auth/auth.model';
import { BookingModel } from '../bookings/booking.model';
import { NotificationCategory, NotificationModel, NotificationType } from './notification.model';

type NotificationCreateInput = {
  recipientId: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  actionEndpoint: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
};

type NotificationListFilters = {
  isRead?: boolean;
  category?: NotificationCategory;
};

const ensureObjectId = (value: string, label: string): void => {
  if (!isValidObjectId(value)) {
    throw new AppError(400, `Invalid ${label}`);
  }
};

const toUtcDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

const addUtcDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const addBillingCycle = (value: Date, cycle: 'monthly' | 'yearly'): Date => {
  const next = new Date(value);

  if (cycle === 'yearly') {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
    return next;
  }

  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
};

const serializeNotification = (notification: any) => {
  const raw = typeof notification?.toObject === 'function' ? notification.toObject() : notification;

  return {
    ...raw,
    _id: String(raw._id),
    recipientId: String(raw.recipientId)
  };
};

const getUserSocketRoom = (userId: string): string => `user:${userId}`;

export class NotificationService {
  private static emitNotification(recipientId: string, notification: Record<string, unknown>) {
    const io = getSocketServer();
    if (!io) {
      return;
    }

    io.to(getUserSocketRoom(recipientId)).emit('notification:new', {
      success: true,
      data: notification
    });
  }

  private static async upsertNotification(input: NotificationCreateInput) {
    ensureObjectId(input.recipientId, 'recipientId');

    if (!input.dedupeKey) {
      const notification = await NotificationModel.create(input);
      return { notification, created: true };
    }

    const existing = await NotificationModel.findOne({ dedupeKey: input.dedupeKey });
    if (existing) {
      return { notification: existing, created: false };
    }

    const notification = await NotificationModel.create(input);
    return { notification, created: true };
  }

  static async createNotification(input: NotificationCreateInput) {
    const { notification, created } = await this.upsertNotification(input);
    if (created) {
      this.emitNotification(input.recipientId, serializeNotification(notification));
    }
    return notification;
  }

  static async createNotifications(inputs: NotificationCreateInput[]) {
    const results = [] as any[];

    for (const input of inputs) {
      const { notification, created } = await this.upsertNotification(input);
      results.push(notification);
      if (created) {
        this.emitNotification(input.recipientId, serializeNotification(notification));
      }
    }

    return results;
  }

  static async notifyAdminsOfNewVenueRequest(params: {
    venueId: string;
    venueName: string;
    ownerId: string;
    ownerName: string;
  }) {
    const admins = await UserModel.find({
      role: { $in: ['admin', 'super_admin'] },
      isBlocked: false
    }).select('_id');

    await this.createNotifications(
      admins.map((admin) => ({
        recipientId: String(admin._id),
        category: 'admin',
        type: 'venue_request_created',
        title: 'New venue request',
        message: `${params.ownerName} submitted venue "${params.venueName}" for review.`,
        actionEndpoint: `/api/v1/admin/venues/${params.venueId}`,
        entityType: 'venue',
        entityId: params.venueId,
        metadata: {
          ownerId: params.ownerId,
          ownerName: params.ownerName
        },
        dedupeKey: `venue-request-created:${String(admin._id)}:${params.venueId}`
      }))
    );
  }

  static async notifyAdminsOfNewServiceRequest(params: {
    serviceId: string;
    serviceName: string;
    ownerId: string;
    ownerName: string;
  }) {
    const admins = await UserModel.find({
      role: { $in: ['admin', 'super_admin'] },
      isBlocked: false
    }).select('_id');

    await this.createNotifications(
      admins.map((admin) => ({
        recipientId: String(admin._id),
        category: 'admin',
        type: 'service_request_created',
        title: 'New service request',
        message: `${params.ownerName} submitted service "${params.serviceName}" for review.`,
        actionEndpoint: `/api/v1/admin/services/${params.serviceId}`,
        entityType: 'service',
        entityId: params.serviceId,
        metadata: {
          ownerId: params.ownerId,
          ownerName: params.ownerName
        },
        dedupeKey: `service-request-created:${String(admin._id)}:${params.serviceId}`
      }))
    );
  }

  static async notifyVenueDecision(params: {
    venueId: string;
    venueName: string;
    ownerId: string;
    decision: 'approved' | 'rejected';
    actorId?: string;
    actorName: string;
    actorRole?: UserRole;
  }) {
    const notifications: NotificationCreateInput[] = [
      {
        recipientId: params.ownerId,
        category: 'admin',
        type: 'venue_request_decision',
        title: `Venue ${params.decision}`,
        message: `Your venue "${params.venueName}" was ${params.decision} by ${params.actorName}.`,
        actionEndpoint: `/api/v1/venue-provider/venues/${params.venueId}`,
        entityType: 'venue',
        entityId: params.venueId,
        metadata: {
          decision: params.decision,
          actorId: params.actorId,
          actorName: params.actorName
        },
        dedupeKey: `venue-decision:${params.ownerId}:${params.venueId}:${params.decision}`
      }
    ];

    if (params.actorRole === 'admin') {
      const superAdmins = await UserModel.find({
        role: 'super_admin',
        isBlocked: false,
        ...(params.actorId ? { _id: { $ne: params.actorId } } : {})
      }).select('_id');

      notifications.push(
        ...superAdmins.map((user) => ({
          recipientId: String(user._id),
          category: 'admin' as const,
          type: 'venue_request_decision' as const,
          title: `Venue ${params.decision} by admin`,
          message: `${params.actorName} ${params.decision} venue "${params.venueName}".`,
          actionEndpoint: `/api/v1/admin/venues/${params.venueId}`,
          entityType: 'venue',
          entityId: params.venueId,
          metadata: {
            decision: params.decision,
            actorId: params.actorId,
            actorName: params.actorName
          },
          dedupeKey: `super-admin-venue-decision:${String(user._id)}:${params.venueId}:${params.decision}`
        }))
      );
    }

    await this.createNotifications(notifications);
  }

  static async notifyServiceDecision(params: {
    serviceId: string;
    serviceName: string;
    ownerId: string;
    decision: 'approved' | 'rejected';
    actorId?: string;
    actorName: string;
    actorRole?: UserRole;
  }) {
    const notifications: NotificationCreateInput[] = [
      {
        recipientId: params.ownerId,
        category: 'admin',
        type: 'service_request_decision',
        title: `Service ${params.decision}`,
        message: `Your service "${params.serviceName}" was ${params.decision} by ${params.actorName}.`,
        actionEndpoint: `/api/v1/service-provider/services/${params.serviceId}`,
        entityType: 'service',
        entityId: params.serviceId,
        metadata: {
          decision: params.decision,
          actorId: params.actorId,
          actorName: params.actorName
        },
        dedupeKey: `service-decision:${params.ownerId}:${params.serviceId}:${params.decision}`
      }
    ];

    if (params.actorRole === 'admin') {
      const superAdmins = await UserModel.find({
        role: 'super_admin',
        isBlocked: false,
        ...(params.actorId ? { _id: { $ne: params.actorId } } : {})
      }).select('_id');

      notifications.push(
        ...superAdmins.map((user) => ({
          recipientId: String(user._id),
          category: 'admin' as const,
          type: 'service_request_decision' as const,
          title: `Service ${params.decision} by admin`,
          message: `${params.actorName} ${params.decision} service "${params.serviceName}".`,
          actionEndpoint: `/api/v1/admin/services/${params.serviceId}`,
          entityType: 'service',
          entityId: params.serviceId,
          metadata: {
            decision: params.decision,
            actorId: params.actorId,
            actorName: params.actorName
          },
          dedupeKey: `super-admin-service-decision:${String(user._id)}:${params.serviceId}:${params.decision}`
        }))
      );
    }

    await this.createNotifications(notifications);
  }

  static async notifyBookingRequestCreated(params: {
    bookingId: string;
    providerId: string;
    customerName: string;
    targetLabel: string;
    targetType: string;
    targetId: string;
    bookingDate: string;
  }) {
    await this.createNotification({
      recipientId: params.providerId,
      category: 'booking',
      type: 'booking_request_created',
      title: 'New booking request',
      message: `${params.customerName} requested a booking for ${params.targetLabel} on ${params.bookingDate}.`,
      actionEndpoint: `/api/v1/bookings/${params.bookingId}`,
      entityType: params.targetType,
      entityId: params.targetId,
      metadata: {
        bookingId: params.bookingId,
        bookingDate: params.bookingDate
      },
      dedupeKey: `booking-request:${params.providerId}:${params.bookingId}`
    });
  }

  static async notifyBookingStatusChanged(params: {
    bookingId: string;
    customerId: string;
    providerName: string;
    targetLabel: string;
    targetType: string;
    targetId: string;
    status: 'confirmed' | 'rejected';
    bookingDate: string;
  }) {
    const title = params.status === 'confirmed' ? 'Booking accepted' : 'Booking rejected';
    const message =
      params.status === 'confirmed'
        ? `${params.providerName} accepted your booking for ${params.targetLabel} on ${params.bookingDate}.`
        : `${params.providerName} rejected your booking for ${params.targetLabel} on ${params.bookingDate}.`;

    await this.createNotification({
      recipientId: params.customerId,
      category: 'booking',
      type: 'booking_status_changed',
      title,
      message,
      actionEndpoint: `/api/v1/bookings/${params.bookingId}`,
      entityType: params.targetType,
      entityId: params.targetId,
      metadata: {
        bookingId: params.bookingId,
        status: params.status,
        bookingDate: params.bookingDate
      },
      dedupeKey: `booking-status:${params.customerId}:${params.bookingId}:${params.status}`
    });
  }

  static async notifyChatMessage(params: {
    recipientId: string;
    senderId: string;
    senderName: string;
    conversationId: string;
    bookingId?: string | null;
    preview: string;
  }) {
    await this.createNotification({
      recipientId: params.recipientId,
      category: 'message',
      type: 'chat_message',
      title: 'New message',
      message: `${params.senderName} sent you a message: ${params.preview}`,
      actionEndpoint: `/api/v1/order-chats/conversations/${params.conversationId}/messages`,
      entityType: 'conversation',
      entityId: params.conversationId,
      metadata: {
        bookingId: params.bookingId,
        senderId: params.senderId
      },
      dedupeKey: undefined
    });
  }

  private static async ensureUpcomingBookingReminders(userId: string) {
    const tomorrow = toUtcDateOnly(addUtcDays(new Date(), 1));
    const bookings = await BookingModel.find({
      status: 'confirmed',
      bookingDate: tomorrow,
      $or: [{ customerId: userId }, { providerId: userId }]
    }).select('_id bookingDate customerId providerId targetType targetId');

    if (bookings.length === 0) {
      return;
    }

    await this.createNotifications(
      bookings.map((booking) => {
        const recipientIsCustomer = String(booking.customerId) === userId;

        return {
          recipientId: userId,
          category: 'booking' as const,
          type: 'booking_reminder' as const,
          title: 'Booking tomorrow',
          message: recipientIsCustomer
            ? `Your confirmed booking is scheduled for tomorrow (${booking.bookingDate}).`
            : `You have a confirmed booking scheduled for tomorrow (${booking.bookingDate}).`,
          actionEndpoint: `/api/v1/bookings/${String(booking._id)}`,
          entityType: booking.targetType,
          entityId: String(booking.targetId),
          metadata: {
            bookingId: String(booking._id),
            bookingDate: booking.bookingDate
          },
          dedupeKey: `booking-reminder:${userId}:${String(booking._id)}:${booking.bookingDate}`
        };
      })
    );
  }

  private static async ensureSubscriptionExpiryReminder(userId: string) {
    const user = await UserModel.findById(userId).select('role subscription isBlocked');
    if (
      !user ||
      user.isBlocked ||
      !['customer', 'service_provider', 'event_planner', 'venue_provider'].includes(user.role) ||
      user.subscription?.status !== 'subscribed'
    ) {
      return;
    }

    const paidAnchor = user.subscription.payment?.paidAt ?? user.subscription.activatedAt;
    if (!paidAnchor || !user.subscription.payment?.billingCycle) {
      return;
    }

    const expiryDate = addBillingCycle(new Date(paidAnchor), user.subscription.payment.billingCycle);
    const tomorrow = toUtcDateOnly(addUtcDays(new Date(), 1));
    const expiryDateString = toUtcDateOnly(expiryDate);

    if (expiryDateString !== tomorrow) {
      return;
    }

    await this.createNotification({
      recipientId: userId,
      category: 'subscription',
      type: 'subscription_expiring',
      title: 'Subscription expires tomorrow',
      message: `Your subscription is scheduled to expire on ${expiryDateString}.`,
      actionEndpoint: '/api/v1/subscriptions/status',
      entityType: 'subscription',
      entityId: userId,
      metadata: {
        expiresAt: expiryDate.toISOString(),
        billingCycle: user.subscription.payment.billingCycle
      },
      dedupeKey: `subscription-expiring:${userId}:${expiryDateString}`
    });
  }

  static async ensureAutomatedNotificationsForUser(userId: string) {
    ensureObjectId(userId, 'userId');
    await Promise.all([
      this.ensureUpcomingBookingReminders(userId),
      this.ensureSubscriptionExpiryReminder(userId)
    ]);
  }

  static async getMyNotifications(userId: string, pagination: PaginationOptions, filters?: NotificationListFilters) {
    await this.ensureAutomatedNotificationsForUser(userId);

    const filter = {
      recipientId: userId,
      ...(typeof filters?.isRead === 'boolean' ? { isRead: filters.isRead } : {}),
      ...(filters?.category ? { category: filters.category } : {})
    };

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit),
      NotificationModel.countDocuments(filter)
    ]);

    return {
      meta: buildPaginationMeta(total, pagination),
      data: notifications.map((notification) => serializeNotification(notification))
    };
  }

  static async getUnreadCount(userId: string) {
    await this.ensureAutomatedNotificationsForUser(userId);
    const unreadCount = await NotificationModel.countDocuments({
      recipientId: userId,
      isRead: false
    });

    return { unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string) {
    ensureObjectId(notificationId, 'notificationId');
    ensureObjectId(userId, 'userId');

    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: userId
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    return serializeNotification(notification);
  }

  static async markAllAsRead(userId: string) {
    ensureObjectId(userId, 'userId');

    await NotificationModel.updateMany(
      {
        recipientId: userId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return { success: true };
  }
}
