import dotenv from 'dotenv';
import { cleanEnv, port, str } from 'envalid';

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: port({ default: 5000 }),
  MONGO_URI: str({ default: 'mongodb://127.0.0.1:27017/saqib-express' }),
  JWT_SECRET: str({ default: 'change_me_in_production' }),
  JWT_EXPIRES_IN: str({ default: '7d' }),
  CORS_ORIGIN: str({ default: '*' }),
  RESEND_API_KEY: str({ default: '' }),
  RESEND_FROM_EMAIL: str({ default: 'onboarding@resend.dev' }),
  OTP_EXPIRY_MINUTES: str({ default: '10' }),
  OTP_RESEND_COOLDOWN_SECONDS: str({ default: '30' })
});
