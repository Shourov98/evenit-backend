import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { AppError } from '../errors/AppError';

export const validate = (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      const issue = result.error.issues[0];
      return next(new AppError(400, issue?.message || 'Invalid request payload'));
    }

    req.body = result.data.body;
    return next();
  };
