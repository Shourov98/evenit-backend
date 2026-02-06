import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { UserRole } from '../../modules/auth/auth.model';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'Forbidden: insufficient role permission'));
    }

    return next();
  };
};
