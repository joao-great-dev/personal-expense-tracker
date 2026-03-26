# Personal Expense Tracker (Monorepo)

Monorepo with:
- `apps/web`: React 18 + TypeScript + Vite UI
- `apps/api`: AWS Lambda + API Gateway REST API (Serverless Framework)
- `packages/shared`: shared Zod schemas/types used by both frontend + backend

## Architecture overview

- `apps/web`
  - Auth state stored in `localStorage` via Zustand
  - Data fetching/caching via React Query
  - Charts via Recharts
  - REST client calls the API Gateway HTTP API
- `apps/api`
  - JWT auth (email/password) issued by `POST /auth/signup` and `POST /auth/login`
  - DynamoDB tables:
    - Users (PK: `email`)
    - Categories (PK: `userId`, SK: `categoryId`)
    - Expenses (PK: `userId`, SK: `expenseId`) + GSI (`gsi1`) to support date-range queries
  - Endpoints for categories, expenses CRUD, and basic reporting:
    - `GET /reports/by-month`
    - `GET /reports/by-category`
- `packages/shared`
  - Zod schemas for request validation and shared domain types

## Key design decisions

- **DynamoDB query-first design**: the expenses GSI (`gsi1`) enables efficient filtering by date range for list + reporting.
- **Stateless backend**: JWT only (no sessions). The frontend keeps only the access token.
- **Schema validation at boundaries**: Zod validates request payloads in API handlers for consistent and helpful errors.
- **Type sharing**: shared schemas/types reduce drift between frontend and backend.

## Prerequisites

- Node.js `>=20`
- pnpm `>=9`
- AWS credentials configured locally (only needed for deployment)

## One-command setup

```bash
pnpm install

# Create env files (see below)

pnpm run build
pnpm run dev
```

## Environment variables

### API (`apps/api`)

Copy:
- `apps/api/.env.example` -> `apps/api/.env`

Required:
- `JWT_SECRET`: used to sign/verify access tokens
- `JWT_ISSUER`: token issuer
- `JWT_AUDIENCE`: token audience
- `ACCESS_TOKEN_TTL_SECONDS`: access token TTL in seconds

Optional:
- `CORS_ORIGIN`: allowed web origin for local dev (ex: `http://localhost:5173`)
- `DYNAMODB_ENDPOINT`: local DynamoDB endpoint (if you run one locally)

### Web (`apps/web`)

Copy:
- `apps/web/.env.example` -> `apps/web/.env`

Required:
- `VITE_API_BASE_URL`: API Gateway base URL
  - Local serverless-offline default: `http://localhost:3000`

If required variables are missing/invalid:
- the API fails fast with a clear error
- the frontend throws a clear error during startup

## Run locally (dev)

Two terminals:

```bash
pnpm --filter @pet/api dev
```

```bash
pnpm --filter @pet/web dev
```

Open:
- `http://localhost:5173`

## Tests / lint / typecheck

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm run build
```

## Deploy to AWS (outline)

### Deploy API

From `apps/api`:

```bash
pnpm --filter @pet/api run build
cd apps/api
serverless deploy --stage prod
```

Copy the HTTP API base URL from the Serverless deploy output.

### Deploy Web

Build the frontend:

```bash
pnpm --filter @pet/web build
```

Upload `apps/web/dist` to S3 and serve via CloudFront (free tier friendly).

Update `apps/web/.env`:
- `VITE_API_BASE_URL` -> your deployed API URL

## Troubleshooting

- **401 Unauthorized**: re-login; ensure `JWT_SECRET` matches between signup/login and the API runtime.
- **CORS issues**: set `apps/api/.env` `CORS_ORIGIN` to your web origin.
- **Build fails due to env**: ensure the API env file exists (and required JWT vars are present).

## Submission deliverables (please fill)

- GitHub Repository URL: (paste here)
- Live Application URL (frontend): (paste here)
- Live API Base URL (API Gateway): (paste here)

