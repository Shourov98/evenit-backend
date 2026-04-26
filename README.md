# EvenIt Backend

Express + TypeScript backend for the EvenIt event marketplace. It provides authentication, provider onboarding, public catalog endpoints, subscriptions, bookings, uploads, site-content management, and realtime booking chat.

## Tech Stack

- Express 4
- TypeScript
- MongoDB + Mongoose
- Zod validation
- JWT auth
- Socket.IO
- Stripe
- Cloudinary
- Resend
- Swagger / OpenAPI

## Features

- Email OTP verification and password reset
- Role-based auth for `customer`, `service_provider`, `event_planner`, `venue_provider`, `admin`, and `super_admin`
- Provider onboarding with multipart file uploads
- Public listing and detail endpoints for services, venues, and event planners
- Service and venue management APIs
- Booking lifecycle APIs
- Stripe subscription lifecycle endpoints
- Profile image and gallery uploads
- Admin approval flows
- Realtime order chat over Socket.IO
- Swagger docs at `/docs`

## Requirements

- Node.js 20+
- pnpm 9+
- MongoDB 7+ locally, or Docker for the bundled stack

## Install And Run

Install dependencies:

```bash
pnpm install
```

Create env file:

```bash
cp .env.example .env
```

Run in development:

```bash
pnpm run dev
```

Build and run production output:

```bash
pnpm run build
pnpm start
```

Run tests:

```bash
pnpm test
```

Generate a new module skeleton:

```bash
pnpm run module:generate -- product
```

## Local URLs

- API root: `http://localhost:5000`
- Health check: `http://localhost:5000/health`
- Swagger docs: `http://localhost:5000/docs`
- Payment test page: `http://localhost:5000/payment-test`

## Docker

Run the bundled production-style stack:

```bash
docker compose up --build -d
```

Services:

- Nginx proxy: `http://localhost`
- API through Nginx: `http://localhost`
- Swagger docs through Nginx: `http://localhost/docs`
- MongoDB: `mongodb://localhost:27017`

Stop containers:

```bash
docker compose down
```

Remove containers and Mongo volume:

```bash
docker compose down -v
```

## Environment

Copy [`.env.example`](/home/shourov/Documents/work_projects/evenit/evenit-backend/.env.example:1) and adjust values as needed.

Runtime variables currently supported:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/saqib-express
JWT_SECRET=replace_with_very_long_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=evenit
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
CUSTOMER_SUBSCRIPTION_PRICE_ID=
SERVICE_PROVIDER_SUBSCRIPTION_PRICE_ID=
EVENT_PLANNER_SUBSCRIPTION_PRICE_ID=
VENUE_PROVIDER_SUBSCRIPTION_PRICE_ID=
CUSTOMER_SUBSCRIPTION_PAYMENT_LINK=
SERVICE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK=
EVENT_PLANNER_SUBSCRIPTION_PAYMENT_LINK=
VENUE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK=
PLATFORM_FEE_PERCENT=10
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
# Legacy fallback vars still supported:
ADMIN_NAME=Admin
ADMIN_EMAIL=
ADMIN_PASSWORD=
OTP_EXPIRY_MINUTES=10
OTP_RESEND_COOLDOWN_SECONDS=30
```

Notes:

- Empty Stripe values disable or partially limit Stripe-backed flows.
- Empty Resend configuration causes OTP delivery to fall back to terminal logging.
- `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` are used by the startup super-admin seed flow.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are still accepted as legacy fallbacks.

## API Surface

Mounted route groups:

- `GET /`
- `GET /health`
- `/api/v1/auth`
- `/api/v1/bookings`
- `/api/v1/event-planners`
- `/api/v1/order-chats`
- `/api/v1/public`
- `/api/v1/service-provider`
- `/api/v1/site-content`
- `/api/v1/subscriptions`
- `/api/v1/uploads`
- `/api/v1/users`
- `/api/v1/venue-provider`
- `/api/v1/admin`
- `GET /docs`
- `GET /payment-test`

## Important Endpoints

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

Onboarding and profile:

- `POST /api/v1/auth/onboarding/service-provider`
- `POST /api/v1/auth/onboarding/event-planner`
- `POST /api/v1/auth/onboarding/venue-provider`
- `PATCH /api/v1/auth/profile/customer`
- `PATCH /api/v1/auth/profile/service-provider`
- `PATCH /api/v1/auth/profile/event-planner`
- `PATCH /api/v1/auth/profile/venue-provider`

Public catalog:

- `GET /api/v1/public/services`
- `GET /api/v1/public/services/:serviceId`
- `GET /api/v1/public/venues`
- `GET /api/v1/public/venues/:venueId`
- `GET /api/v1/public/event-planners`
- `GET /api/v1/public/event-planners/:eventPlannerId`
- `GET /api/v1/public/stripe-config`

Service provider:

- `POST /api/v1/service-provider/services`
- `GET /api/v1/service-provider/my-services`
- `GET /api/v1/service-provider/services/:serviceId`
- `PATCH /api/v1/service-provider/services/:serviceId`
- `DELETE /api/v1/service-provider/services/:serviceId`
- `GET /api/v1/service-provider/services/:serviceId/availability`
- `PATCH /api/v1/service-provider/services/:serviceId/availability`
- `DELETE /api/v1/service-provider/services/:serviceId/availability`

Venue provider:

- `POST /api/v1/venue-provider/venues`
- `GET /api/v1/venue-provider/my-venues`
- `GET /api/v1/venue-provider/venues/:venueId`
- `PATCH /api/v1/venue-provider/venues/:venueId`
- `DELETE /api/v1/venue-provider/venues/:venueId`
- `GET /api/v1/venue-provider/venues/:venueId/availability`
- `PATCH /api/v1/venue-provider/venues/:venueId/availability`
- `DELETE /api/v1/venue-provider/venues/:venueId/availability`

Event planner:

- `GET /api/v1/event-planners`
- `GET /api/v1/event-planners/:eventPlannerId`
- `GET /api/v1/event-planners/me/availability`
- `PATCH /api/v1/event-planners/me/availability`
- `DELETE /api/v1/event-planners/me/availability`

Bookings:

- `POST /api/v1/bookings`
- `POST /api/v1/bookings/services/:serviceId`
- `POST /api/v1/bookings/venues/:venueId`
- `POST /api/v1/bookings/event-planners/:eventPlannerId`
- `GET /api/v1/bookings/my`
- `GET /api/v1/bookings/provider`
- `GET /api/v1/bookings/:bookingId`
- `PATCH /api/v1/bookings/:bookingId/approve`
- `PATCH /api/v1/bookings/:bookingId/reject`
- `PATCH /api/v1/bookings/:bookingId/cancel`

Subscriptions:

- `POST /api/v1/subscriptions/create`
- `POST /api/v1/subscriptions/stop-recurring`
- `POST /api/v1/subscriptions/resume-recurring`
- `GET /api/v1/subscriptions/payment-link`
- `GET /api/v1/subscriptions/status`
- `POST /api/v1/subscriptions/webhook`

Uploads:

- `POST /api/v1/uploads/images`
- `POST /api/v1/uploads/profile-image`
- `POST /api/v1/uploads/venue-images`

Other:

- `GET /api/v1/site-content`
- `GET /api/v1/site-content/:section`
- `POST /api/v1/site-content/:section`
- `POST /api/v1/users`
- `GET /api/v1/users`
- `GET /api/v1/users/:userId/profile`

Admin:

- Admin approval and management routes are mounted under `/api/v1/admin`.
- Use Swagger docs for the complete current contract.

## Auth And Roles

- Public signup roles: `customer`, `service_provider`, `event_planner`, `venue_provider`
- Protected roles: `admin`, `super_admin`
- Login requires verified email
- OTP resend is cooldown-limited
- Most write endpoints require a bearer token

## File Upload Conventions

Onboarding requests:

- Send as `multipart/form-data`
- Put the JSON payload in the `payload` field
- Send verification files in `nationalIdOrTradeLicenseFiles`

General image uploads:

- Supported fields include `image`, `images`, `file`, and `files`
- Profile image upload expects `image`

## Realtime Chat

Socket.IO is initialized on the same HTTP server as the API. Booking chat HTTP routes live under `/api/v1/order-chats`, and realtime events are registered during server startup.

## Project Structure

```text
src/
  app/
  common/
  config/
  modules/
  socket/
  server.ts
scripts/
public/
nginx/
docker-compose.yml
```
