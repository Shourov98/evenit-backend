import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export const parseMultipartJsonBody =
  (fieldName = 'payload') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const rawValue = req.body?.[fieldName];

    if (typeof rawValue !== 'string') {
      return next();
    }

    try {
      req.body = JSON.parse(rawValue) as Record<string, unknown>;
      return next();
    } catch (_error) {
      return next(new AppError(400, `${fieldName} must be valid JSON`));
    }
  };
