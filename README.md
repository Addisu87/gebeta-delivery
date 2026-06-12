# Gebeta Delivery API

Backend API for Gebeta Delivery built with NestJS, TypeORM, PostgreSQL, Redis, BullMQ, WebSockets, and SMTP/SendGrid email providers.

## Core Features

- Modular domain architecture (users, auth, restaurants, orders, payments, notifications, etc.)
- Redis-backed job queues for orders, payments, notifications, and email
- Real-time notification delivery through WebSocket gateway (`/notifications`)
- Mailtrap/SMTP and SendGrid email provider support
- Global validation, logging, exception filtering, and caching

## Tech Stack

- Node.js 22
- NestJS 11
- TypeORM + PostgreSQL
- BullMQ + Redis
- Socket.IO WebSocket gateway
- pnpm

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables in `.env` (database, redis, jwt, email).

3. Run in development mode:

```bash
pnpm run start:dev
```

API runs on `http://localhost:3000` by default, with Swagger at `http://localhost:3000/api`.

4. Redis start

```bash
brew services start redis
```

## Email Configuration

For Mailtrap (recommended for local/dev):

```env
EMAIL_PROVIDER=mailtrap
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
SMTP_FROM=noreply@deliveryapp.com
SMTP_SECURE=false
```

For SendGrid:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=verified-sender@yourdomain.com
```

## Docker

Build and run with Docker Compose:

```bash
docker compose up --build
```

This starts:

- `app` (NestJS API)
- `postgres` (PostgreSQL 16)
- `redis` (Redis 7)

## CI/CD (GitHub Actions)

Workflow file: `.github/workflows/ci-cd.yml`

On pull requests and main pushes:

- Install dependencies with pnpm
- Build (`pnpm run build`)
- Lint (`pnpm run lint`)
- Test (`pnpm run test -- --runInBand`)

On `main` push only:

- Build and push Docker image to GHCR
  - `ghcr.io/<owner>/<repo>:latest`
  - `ghcr.io/<owner>/<repo>:<commit-sha>`

## Useful Commands

```bash
pnpm run build
pnpm run lint
pnpm run test
pnpm run test:e2e
pnpm run start:prod
```
