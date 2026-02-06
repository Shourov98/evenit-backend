import { Document, Model, Schema, model, models } from 'mongoose';

export const OTP_PURPOSES = ['email_verification', 'password_reset'] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export interface IAuthOtp extends Document {
  userId: Schema.Types.ObjectId;
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  resendAvailableAt: Date;
  consumedAt?: Date;
}

const authOtpSchema = new Schema<IAuthOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    purpose: {
      type: String,
      enum: OTP_PURPOSES,
      required: true,
      index: true
    },
    codeHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    resendAvailableAt: {
      type: Date,
      required: true
    },
    consumedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const AuthOtpModel: Model<IAuthOtp> =
  (models.AuthOtp as Model<IAuthOtp>) || model<IAuthOtp>('AuthOtp', authOtpSchema);
