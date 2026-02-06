import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export const signJwt = (payload: object): string => {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
};
