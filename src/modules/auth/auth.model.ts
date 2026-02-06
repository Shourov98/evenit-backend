import bcrypt from 'bcryptjs';
import { Document, Model, Schema, model, models } from 'mongoose';

export const USER_ROLES = [
  'super_admin',
  'admin',
  'service_provider',
  'venue_provider',
  'customer'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  serviceCategories: string[];
  isEmailVerified: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'customer'
    },
    serviceCategories: {
      type: [String],
      default: []
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const UserModel: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>('User', userSchema);
