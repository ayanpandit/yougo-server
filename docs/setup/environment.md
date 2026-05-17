# Environment Setup

The backend relies on strict environment variables. If a required variable is missing or malformed, the application will crash immediately upon startup (Fail-Fast principle).

## Zod Validation
We use Zod inside `src/config/env.ts` to parse and validate `process.env`.
This provides full TypeScript autocomplete for `env.VARIABLE_NAME` across the entire codebase.

## Required Variables

- `PORT` (number): The port the Hono server listens on.
- `NODE_ENV` (development | production | test): Environment context.
- `DATABASE_URL` (url): PostgreSQL connection string.
- `JWT_SECRET` (string, min 10 chars): Cryptographic key for signing tokens.
- `FRONTEND_URL` (url): Allowed origin for CORS and CSRF.
- `SMTP_HOST` (string): SMTP server host (e.g., Mailtrap, AWS SES).
- `SMTP_PORT` (number): SMTP port.
- `SMTP_USER` (string): SMTP username.
- `SMTP_PASS` (string): SMTP password.
- `SMTP_FROM` (email): Sender email address.

## Local Setup
1. Copy `.env.example` to `.env`.
2. Fill in the required secrets (e.g., a strong `JWT_SECRET`).
3. Boot the application.
