import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { authenticateToken } from '../utils/auth-user';

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized: missing token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = await authenticateToken(token);

    return next();
  } catch (_error) {
    return next(new AppError(401, 'Unauthorized: invalid token'));
  }
};
