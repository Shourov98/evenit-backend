import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

const normalizeError = (error: unknown): AppError | Error => {
  const err = error as {
    name?: string;
    code?: number;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, { message: string }>;
    message?: string;
  };

  if (err?.code === 11000) {
    const duplicateFields = Object.keys(err.keyValue || {});
    const fieldList = duplicateFields.length ? duplicateFields.join(', ') : 'field';
    return new AppError(409, `Duplicate value detected for ${fieldList}. Use a different value and try again.`);
  }

  if (err?.name === 'ValidationError') {
    const first = err.errors ? Object.values(err.errors)[0]?.message : undefined;
    return new AppError(400, first || 'Request validation failed');
  }

  if (err?.name === 'JsonWebTokenError') {
    return new AppError(401, 'Authentication failed: the access token is invalid');
  }

  if (err?.name === 'TokenExpiredError') {
    return new AppError(401, 'Authentication failed: the access token has expired');
  }

  if (err?.name === 'MulterError') {
    const multerMessageByCode: Record<string, string> = {
      LIMIT_FILE_SIZE: 'Upload failed: file size exceeds the 10MB limit',
      LIMIT_FILE_COUNT: 'Upload failed: too many files were uploaded',
      LIMIT_UNEXPECTED_FILE: 'Upload failed: unexpected file field name in multipart form-data'
    };

    return new AppError(400, multerMessageByCode[err.message || ''] || `Upload failed: ${err.message || 'invalid multipart payload'}`);
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
