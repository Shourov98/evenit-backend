import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

const normalizeError = (error: unknown): AppError | Error => {
  const err = error as { name?: string; code?: number; errors?: Record<string, { message: string }> };

  if (err?.code === 11000) {
    return new AppError(409, 'Duplicate value detected');
  }

  if (err?.name === 'ValidationError') {
    const first = err.errors ? Object.values(err.errors)[0]?.message : undefined;
    return new AppError(400, first || 'Validation failed');
  }

  if (err?.name === 'JsonWebTokenError') {
    return new AppError(401, 'Unauthorized: invalid token');
  }

  if (err?.name === 'TokenExpiredError') {
    return new AppError(401, 'Unauthorized: token expired');
  }

  return error as Error;
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  const parsed = normalizeError(error);
  const appError = parsed instanceof AppError ? parsed : new AppError(500, 'Internal Server Error', false);

  if (process.env.NODE_ENV === 'production' && !appError.isOperational) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }

  return res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: parsed.stack
    })
  });
};
