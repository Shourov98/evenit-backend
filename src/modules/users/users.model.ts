import { Document, Model, Schema, model, models } from 'mongoose';

export interface IUsers extends Document {
  name: string;
}

const usersSchema = new Schema<IUsers>(
  {
    name: { type: String, required: true, trim: true }
  },
  { timestamps: true, versionKey: false }
);

export const UsersModel: Model<IUsers> =
  (models.Users as Model<IUsers>) || model<IUsers>('Users', usersSchema);
