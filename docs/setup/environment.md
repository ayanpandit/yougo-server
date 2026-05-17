# Environment Setup

The backend relies on strict environment variables. If a required variable is missing or malformed, the application will crash immediately upon startup (Fail-Fast principle).

## Zod Validation
We use Zod inside `src/config/env.ts` to parse and validate `process.env`.
This provides full TypeScript autocomplete for `env.VARIABLE_NAME` across the entire codebase.

## Required Variables

| Variable | Type | Description |
|---|---|---|
| `PORT` | number | The port the Hono server listens on (default: `8080`). |
| `NODE_ENV` | enum | `development`, `production`, or `test`. |
| `DATABASE_URL` | url | PostgreSQL connection string. |
| `JWT_SECRET` | string (min 10) | Cryptographic key for signing session tokens. |
| `FRONTEND_URL` | url | Allowed origin for CORS and CSRF. |
| `GMAIL_USER` | string | Your Gmail address (e.g. `support.yougo@gmail.com`). |
| `GMAIL_APP_PASS` | string | Your 16-character Google App Password (e.g. `abcd efgh ijkl mnop`). |

## Optional Variables

| Variable | Type | Description |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | string | Cloudinary cloud name for profile image uploads. |
| `CLOUDINARY_API_KEY` | string | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | string | Cloudinary API secret. |

## Local Setup
1. Copy `.env.example` to `.env`.
2. Fill in the required secrets.
3. Boot the application.
