import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';
import { UserModel } from '../../modules/auth/auth.model';

interface JwtPayload {
  userId: string;
  role?: string;
}

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized: missing token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await UserModel.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new AppError(401, 'Unauthorized: user not found'));
    }

    req.user = {
      userId: String(user._id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      serviceCategories: user.serviceCategories,
      onboarding: user.onboarding ?? null
    };

    return next();
  } catch (_error) {
    return next(new AppError(401, 'Unauthorized: invalid token'));
  }
};
