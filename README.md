# Modular Express Backend (TypeScript)

High-standard Express backend starter with TypeScript and module-first architecture.

## Included

- TypeScript + strict config
- Modular folder structure (`module/model/controller/service/route/schema/test`)
- JWT auth (`fullName`, `email`, `password`)
- Email OTP verification with Resend
- Forgot password via OTP (30s resend cooldown)
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
- `GET /api/v1/auth/me` (Bearer token)
- `GET /docs`

## Auth + Role Design

- Signup fields: `fullName`, `email`, `password`, `role`, `serviceCategories`.
- `fullName` must include at least 2 words (first + last name).
- Public signup roles allowed: `customer`, `service_provider`, `venue_provider`.
- Restricted roles `admin` and `super_admin` should be created only through protected admin-only flows.
- `serviceCategories` is required when role is `service_provider`.
- Login is blocked until email OTP verification is completed.
- OTP request is unlimited but enforced with a 30-second cooldown per purpose.

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
