import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { env } from '../../config/env';

export const applySecurityMiddleware = (app: Express): void => {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try later.'
    }
  });

  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 100,
    delayMs: (hits) => Math.min(hits * 100, 3000)
  });

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true
    })
  );
  app.use(compression());
  app.use(hpp());
  app.use(mongoSanitize());
  app.use(speedLimiter);
  app.use(apiLimiter);
  app.use(express.json({ limit: '20kb' }));
  app.use(express.urlencoded({ extended: true, limit: '20kb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again later.'
  }
});
