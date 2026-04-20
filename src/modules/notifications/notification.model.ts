import { Document, Model, Schema, model, models } from 'mongoose';

export const NOTIFICATION_CATEGORIES = ['admin', 'booking', 'subscription', 'message'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_TYPES = [
  'venue_request_created',
  'service_request_created',
  'venue_request_decision',
  'service_request_decision',
  'booking_request_created',
  'booking_status_changed',
  'booking_reminder',
  'subscription_expiring',
  'chat_message'
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  recipientId: Schema.Types.ObjectId;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  actionEndpoint: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date | null;
  dedupeKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORIES,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    actionEndpoint: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    entityType: {
      type: String,
      trim: true,
      maxlength: 80
    },
    entityId: {
      type: String,
      trim: true,
      maxlength: 120
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    dedupeKey: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    }
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel: Model<INotification> =
  (models.Notification as Model<INotification>) || model<INotification>('Notification', notificationSchema);
