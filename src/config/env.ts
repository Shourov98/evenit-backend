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
  CLOUDINARY_CLOUD_NAME: str({ default: '' }),
  CLOUDINARY_API_KEY: str({ default: '' }),
  CLOUDINARY_API_SECRET: str({ default: '' }),
  CLOUDINARY_UPLOAD_FOLDER: str({ default: 'evenit' }),
  STRIPE_SECRET_KEY: str({ default: '' }),
  STRIPE_PUBLISHABLE_KEY: str({ default: '' }),
  STRIPE_WEBHOOK_SECRET: str({ default: '' }),
  CUSTOMER_SUBSCRIPTION_PRICE_ID: str({ default: '' }),
  SERVICE_PROVIDER_SUBSCRIPTION_PRICE_ID: str({ default: '' }),
  EVENT_PLANNER_SUBSCRIPTION_PRICE_ID: str({ default: '' }),
  VENUE_PROVIDER_SUBSCRIPTION_PRICE_ID: str({ default: '' }),
  CUSTOMER_SUBSCRIPTION_PAYMENT_LINK: str({ default: 'https://buy.stripe.com/test_28E8wR3zx21ZeNN6ALaR200' }),
  SERVICE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK: str({ default: 'https://buy.stripe.com/test_dRm28t3zx7mj6hh2kvaR205' }),
  EVENT_PLANNER_SUBSCRIPTION_PAYMENT_LINK: str({ default: 'https://buy.stripe.com/test_dRm28t3zx7mj6hh2kvaR205' }),
  VENUE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK: str({ default: 'https://buy.stripe.com/test_8x26oJ8TRgWT211gblaR206' }),
  PLATFORM_FEE_PERCENT: str({ default: '10' }),
  RESEND_API_KEY: str({ default: '' }),
  RESEND_FROM_EMAIL: str({ default: 'onboarding@resend.dev' }),
  ADMIN_NAME: str({ default: 'Admin' }),
  ADMIN_EMAIL: str({ default: '' }),
  ADMIN_PASSWORD: str({ default: '' }),
  OTP_EXPIRY_MINUTES: str({ default: '10' }),
  OTP_RESEND_COOLDOWN_SECONDS: str({ default: '30' })
});
