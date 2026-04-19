import { Document, Model, Schema, Types, model, models } from 'mongoose';

export interface IOrderChatConversation extends Document {
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  status: 'active' | 'archived';
  activatedAt?: Date | null;
  lastMessageId?: Types.ObjectId | null;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderChatMessage extends Document {
  conversationId: Types.ObjectId;
  bookingId?: Types.ObjectId | null;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  type: 'text' | 'system';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderChatConversationSchema = new Schema<IOrderChatConversation>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true
    },
    activatedAt: {
      type: Date,
      default: null
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'OrderChatMessage',
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

orderChatConversationSchema.index({ customerId: 1, providerId: 1 }, { unique: true });

const orderChatMessageSchema = new Schema<IOrderChatMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrderChatConversation',
      required: true,
      index: true
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text'
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    }
  },
  { timestamps: true, versionKey: false }
);

orderChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
orderChatMessageSchema.index({ bookingId: 1, createdAt: -1 });
orderChatMessageSchema.index({ conversationId: 1, senderId: 1, createdAt: -1 });

export const OrderChatConversationModel: Model<IOrderChatConversation> =
  (models.OrderChatConversation as Model<IOrderChatConversation>) ||
  model<IOrderChatConversation>('OrderChatConversation', orderChatConversationSchema);

export const OrderChatMessageModel: Model<IOrderChatMessage> =
  (models.OrderChatMessage as Model<IOrderChatMessage>) ||
  model<IOrderChatMessage>('OrderChatMessage', orderChatMessageSchema);
