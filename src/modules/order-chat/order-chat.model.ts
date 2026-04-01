import { Document, Model, Schema, Types, model, models } from 'mongoose';

export interface IOrderChatMessage extends Document {
  bookingId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderChatMessageSchema = new Schema<IOrderChatMessage>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
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
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    }
  },
  { timestamps: true, versionKey: false }
);

orderChatMessageSchema.index({ bookingId: 1, createdAt: -1 });
orderChatMessageSchema.index({ bookingId: 1, senderId: 1, createdAt: -1 });

export const OrderChatMessageModel: Model<IOrderChatMessage> =
  (models.OrderChatMessage as Model<IOrderChatMessage>) ||
  model<IOrderChatMessage>('OrderChatMessage', orderChatMessageSchema);

