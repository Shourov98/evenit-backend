import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { hydrateUserSubscription, UserModel } from '../auth/auth.model';
import { UsersModel } from './users.model';

export class UsersService {
  static async create(payload: { name: string }) {
    return UsersModel.create(payload);
  }

  static async getAll() {
    return UsersModel.find().sort({ createdAt: -1 });
  }

  static async getProfile(userId: string) {
    if (!isValidObjectId(userId)) {
      throw new AppError(400, 'Invalid userId');
    }

    const user = await UserModel.findById(userId).select('-password');
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const hydratedSubscription = hydrateUserSubscription(user.role, user.subscription);
    if (JSON.stringify(user.subscription) !== JSON.stringify(hydratedSubscription)) {
      user.subscription = hydratedSubscription;
      await user.save();
    }

    return user;
  }
}
