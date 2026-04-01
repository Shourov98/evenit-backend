import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';
import { hydrateUserSubscription, UserModel } from '../../modules/auth/auth.model';

interface JwtPayload {
  userId: string;
  role?: string;
}

export type AuthenticatedUser = NonNullable<Express.Request['user']>;

export const authenticateToken = async (token: string): Promise<AuthenticatedUser> => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await UserModel.findById(decoded.userId).select('-password');

    if (!user) {
      throw new AppError(401, 'Unauthorized: user not found');
    }

    if (user.isBlocked) {
      throw new AppError(403, 'Your account has been blocked');
    }

    const hydratedSubscription = hydrateUserSubscription(user.role, user.subscription);
    if (JSON.stringify(user.subscription) !== JSON.stringify(hydratedSubscription)) {
      user.subscription = hydratedSubscription;
      await user.save();
    }

    return {
      userId: String(user._id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      serviceCategories: user.serviceCategories,
      isBlocked: user.isBlocked,
      profileImage: user.profileImage ?? null,
      subscription: user.subscription,
      onboarding: user.onboarding ?? null
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, 'Unauthorized: invalid token');
  }
};
