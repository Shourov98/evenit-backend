# Modular Express Backend (TypeScript)

High-standard Express backend starter with TypeScript and module-first architecture.

## Included

- TypeScript + strict config
- Modular folder structure (`module/model/controller/service/route/schema/test`)
- JWT auth (`fullName`, `email`, `password`)
- Email OTP verification with Resend
- Forgot password via OTP (30s resend cooldown)
- OTP falls back to terminal output if email delivery is not configured or fails
- MongoDB (Mongoose) setup
- Global error handling
- Validation middleware (`zod`)
- Security middleware stack
- Rate limiting + slowdown protection (DDoS baseline)
- OpenAPI docs (`/docs`)
- Module generator script

## Structure

```text
src/
  app/
    app.ts
    openapi.ts
    routes.ts
  config/
    database.ts
    env.ts
  common/
    errors/
      AppError.ts
    middlewares/
      auth.middleware.ts
      error.middleware.ts
      security.middleware.ts
      validate.middleware.ts
    types/
      express.d.ts
    utils/
      catchAsync.ts
      jwt.ts
  modules/
    auth/
      auth.controller.ts
      auth.model.ts
      auth.route.ts
      auth.schema.ts
      auth.service.ts
      auth.test.ts
  server.ts
scripts/
  generate-module.ts
```

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create env:

```bash
cp .env.example .env
```

3. Run dev:

```bash
pnpm run dev
```

4. Build + start production:

```bash
pnpm run build
pnpm start
```

## Docker

Run full stack (app + MongoDB + Nginx):

```bash
docker compose up --build -d
```

Services:

- API behind Nginx: `http://localhost`
- Swagger docs: `http://localhost/docs`
- MongoDB: `localhost:27017`

Stop stack:

```bash
docker compose down
```

Reset database volume:

```bash
docker compose down -v
```

## Environment

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
CUSTOMER_SUBSCRIPTION_PAYMENT_LINK=https://buy.stripe.com/test_28E8wR3zx21ZeNN6ALaR200
SERVICE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK=https://buy.stripe.com/test_dRm28t3zx7mj6hh2kvaR205
EVENT_PLANNER_SUBSCRIPTION_PAYMENT_LINK=https://buy.stripe.com/test_dRm28t3zx7mj6hh2kvaR205
VENUE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK=https://buy.stripe.com/test_8x26oJ8TRgWT211gblaR206
PLATFORM_FEE_PERCENT=10
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
OTP_EXPIRY_MINUTES=10
OTP_RESEND_COOLDOWN_SECONDS=30
```

## Module Generator

Create any new module with all required base files:

```bash
pnpm run module:generate -- product
# or
pnpm run module:generate --name=product
```

This creates:

- `src/modules/product/product.model.ts`
- `src/modules/product/product.schema.ts`
- `src/modules/product/product.service.ts`
- `src/modules/product/product.controller.ts`
- `src/modules/product/product.route.ts`
- `src/modules/product/product.test.ts`

Then mount router in `src/app/routes.ts`.

## API Endpoints

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/onboarding/service-provider` (Bearer token)
- `POST /api/v1/auth/onboarding/event-planner` (Bearer token)
- `POST /api/v1/auth/onboarding/venue-provider` (Bearer token)
- `GET /api/v1/auth/me` (Bearer token)
- `POST /api/v1/bookings` (Bearer token, customer)
- `GET /api/v1/bookings/my` (Bearer token, customer)
- `GET /api/v1/bookings/provider` (Bearer token, provider roles)
- `GET /api/v1/bookings/:bookingId` (Bearer token, booking owner/provider/admin)
- `PATCH /api/v1/bookings/:bookingId/approve` (Bearer token, provider roles)
- `PATCH /api/v1/bookings/:bookingId/reject` (Bearer token, provider roles)
- `PATCH /api/v1/bookings/:bookingId/cancel` (Bearer token, customer)
- `POST /api/v1/service-provider/services` (Bearer token, service_provider)
- `GET /api/v1/service-provider/my-services` (Bearer token, service_provider)
- `PATCH /api/v1/service-provider/services/:serviceId` (Bearer token, service_provider)
- `DELETE /api/v1/service-provider/services/:serviceId` (Bearer token, service_provider)
- `GET /api/v1/service-provider/services` (public published services)
- `GET /api/v1/service-provider/services/:serviceId` (public published service by id)
- `POST /api/v1/uploads/venue-images` (Bearer token, multipart form-data)
- `POST /api/v1/venue-provider/venues` (Bearer token, venue_provider)
- `GET /api/v1/venue-provider/my-venues` (Bearer token, venue_provider)
- `PATCH /api/v1/venue-provider/venues/:venueId` (Bearer token, venue_provider)
- `DELETE /api/v1/venue-provider/venues/:venueId` (Bearer token, venue_provider)
- `GET /api/v1/venue-provider/venues` (public published venues)
- `GET /api/v1/venue-provider/venues/:venueId` (public published venue by id)
- `PATCH /api/v1/admin/services/:serviceId/approve` (Bearer token, admin/super_admin)
- `PATCH /api/v1/admin/services/:serviceId/reject` (Bearer token, admin/super_admin)
- `PATCH /api/v1/admin/venues/:venueId/approve` (Bearer token, admin/super_admin)
- `PATCH /api/v1/admin/venues/:venueId/reject` (Bearer token, admin/super_admin)
- `GET /docs`
- `GET /payment-test`
- `GET /api/v1/subscriptions/status` (Bearer token)
- `GET /api/v1/subscriptions/payment-link` (Bearer token)
- `POST /api/v1/subscriptions/webhook` (Stripe webhook)

## Auth + Role Design

- Signup fields: `fullName`, `email`, `password`, `role`, optional `serviceCategories`.
- `fullName` must include at least 2 words (first + last name).
- Public signup roles allowed: `customer`, `service_provider`, `event_planner`, `venue_provider`.
- Restricted roles `admin` and `super_admin` should be created only through protected admin-only flows.
- `serviceCategories` is optional for all public signup roles.
- Login is blocked until email OTP verification is completed.
- OTP request is unlimited but enforced with a 30-second cooldown per purpose.

## Provider Onboarding API

Endpoint:

- `POST /api/v1/auth/onboarding/service-provider` (Bearer token required)
- `POST /api/v1/auth/onboarding/event-planner` (Bearer token required)
- `POST /api/v1/auth/onboarding/venue-provider` (Bearer token required)

Role-specific required fields:

- Service provider onboarding: `_id`, `name`, `email`, `profileInfo`, `services`
- `profileInfo`: `nidOrTradeLicenseNumber`, `serviceName`, `serviceCategory` (single value), optional `serviceDescription`, `coverageArea[]`, `verification`
- Service provider `profileInfo.verification`: `businessType`, optional `companyName`, `nationalIdOrTradeLicenseFiles[]`
- `stripeAccountId` is not accepted in service provider onboarding payload.
- Event planner onboarding: `_id`, `fullName`, `email`, `profileInfo`
- Event planner `profileInfo`: `nidOrTradeLicenseNumber`, `name`, optional `description`, `coverageArea[]`, `address`, `verification`
- Event planner `profileInfo.verification`: `businessType`, optional `companyName`, `nationalIdOrTradeLicenseFiles[]`
- Venue provider onboarding: `_id`, `fullName`, `email`, `profileInfo`
- Venue provider `profileInfo`: `nidOrTradeLicenseNumber`, optional `nationalIdOrTradeLicenseFiles[]`, `businessName`, `businessType`, optional `legalBusinessName`, optional `registrationNo`, `businessMail`, `businessPhoneNo`

Note:

- Send onboarding requests as `multipart/form-data`.
- Put the structured JSON body inside a `payload` text field.
- Attach selected image/PDF files using the `nationalIdOrTradeLicenseFiles` file field. The backend uploads them and stores the hosted URLs in the onboarding payload.
- Payment info / bank card fields are not accepted in onboarding payload.
- `stripeAccountId` is not accepted in service provider, event planner, or venue provider onboarding payloads.

## Service Provider Service API

Base path:

- `/api/v1/service-provider/services`

Fields supported:

- `information`: `serviceName`, `category`, `description`, `serviceArea[]`, `tags[]`
- `pricing`: `amount`, `pricingType` (`fixed|hourly|daily|package`), `currency`, optional `discount`
- `settings`: `amenities` (boolean map), optional `capacity`
- `media`: `galleryImages` (max 10), optional `videoUrl`
- `availabilityOverrides`: date-level states (`available|pending|booked`)

Calendar behavior:

- Any date not listed in `availabilityOverrides` should be considered `available` by default.

## Venue Image Upload API

Venue creation and service creation already support direct `multipart/form-data` uploads. The frontend can send image files to the create endpoints, and the backend uploads those files and stores the resulting URLs in `media.galleryImages`.

Use the separate upload endpoint only when you need standalone venue image uploads before venue creation or update.

Endpoint:

- `POST /api/v1/uploads/venue-images` (Bearer token required)

Request:

- `multipart/form-data`
- field name: `images`
- max files: `10`
- allowed mime types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- max size per file: `10MB`

Response items include:

- `url`
- `publicId`
- `format`
- `width`
- `height`
- `bytes`
- `originalName`

## Booking Flow

The booking module supports a shared booking resource for venue and service bookings. Event bookings are intentionally blocked until a real event entity exists in the system.

Current flow:

1. Customer creates a booking with `targetType`, `targetId`, `bookingDate`, and one or more `timeSlots`.
2. The selected slots are reserved immediately in `pending` status, so overlapping requests are rejected.
3. The provider approves or rejects the booking.
4. Approved bookings are confirmed without a second booking-level payment step because booking access is covered by subscription.

Booking statuses:

- `pending`
- `approved`
- `rejected`
- `confirmed`
- `cancelled`
- `completed`

Payment statuses:

- `covered_by_subscription`

Important:

- Every user has a subscription record.
- New users default to `not_subscribed` with role-based pricing:
- `customer`: `customer_plan`, `GBP 5/month`
- `event_planner`: `event_planner_plan`, `GBP 20/month`
- `service_provider`: `service_provider_plan`, `GBP 5/month`
- `venue_provider`: `venue_provider_plan`, `GBP 500/year`
- Bookings are covered by subscription; there is no booking payment flow.

## Payment Test Page

Use the built-in test page at:

- `GET /payment-test`

Requirements:

- `STRIPE_WEBHOOK_SECRET` must be set so Stripe can authenticate webhook events.
- Use Stripe test mode keys and a dummy card such as `4242 4242 4242 4242`.

Test flow:

1. Register a test user or log in with an existing verified user.
2. If OTP email delivery is not configured, read the OTP from the server terminal and verify it on the page.
3. Open the hosted Stripe subscription checkout link.
4. Complete the payment on Stripe's hosted checkout page.
5. Refresh the profile after Stripe redirects back or the webhook completes.

## Stripe Payment Link Sync

Use this flow for Stripe-hosted recurring subscriptions:

1. Frontend calls `GET /api/v1/subscriptions/payment-link` with the authenticated user's token.
2. The backend returns the role-specific Stripe Checkout URL with `client_reference_id` and locked email attached.
3. Frontend redirects the user to that Stripe URL.
4. Stripe sends events to `POST /api/v1/subscriptions/webhook`.
5. The backend updates the user to `subscribed`, so `GET /api/v1/subscriptions/status` returns `isSubscribed: true`.

Required setup:

- Configure a Stripe webhook endpoint pointing to `/api/v1/subscriptions/webhook`
- Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
- Keep the Stripe payment links and webhook endpoint in Stripe test mode while testing

## Global Pagination

List endpoints use a shared pagination utility (`src/common/utils/pagination.ts`) and support:

- `page` (default: `1`)
- `limit` (default: `10`, max: `100`)
- `sortBy` (default: `createdAt`)
- `sortOrder` (`asc` or `desc`, default: `desc`)

Paginated response format:

- `meta`: `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`
- `data`: array of records

## Approval Workflow

- Any newly created or updated service/venue is stored with `publishStatus: pending`.
- Only `admin` or `super_admin` can approve/reject publishing.
- On approval, the record is updated as:
  - `publishStatus: published`
  - `approvedBy: { "name": "<admin_or_super_admin_name>", "email": "<admin_or_super_admin_email>" }`
  - `approvedAt: <timestamp>`
- On rejection, the record is updated with `publishStatus: rejected`.

## Apidog Collection

Use the OpenAPI file at:

- `apidog.openapi.json`
- `apidog.collection.json` (recommended for Apidog request collection with prefilled sample bodies)

Import in Apidog:

1. Open Apidog.
2. Create or open a project.
3. Choose `Import` -> `OpenAPI/Swagger`.
4. Select `apidog.openapi.json` or `apidog.collection.json`.

## Test

```bash
pnpm test
```

## CI/CD

GitHub Actions workflow: `.github/workflows/ci-cd.yml`

- CI runs on pull requests and pushes to `main`.
- CI steps: install dependencies, build TypeScript, run tests.
- CD runs on push to `main`.
- CD steps: build Docker image and push to `ghcr.io/<owner>/<repo>` with `latest` and `sha` tags.
