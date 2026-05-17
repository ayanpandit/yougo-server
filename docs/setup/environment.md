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
| `SMTP_HOST` | string | SMTP server host (e.g. `sandbox.smtp.mailtrap.io`). |
| `SMTP_PORT` | number | SMTP port (e.g. `2525`, `587`). |
| `SMTP_USER` | string | SMTP username. |
| `SMTP_PASS` | string | SMTP password. |
| `SMTP_FROM` | string | Verified sender email address (e.g. `noreply@yougo.com`). |

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
