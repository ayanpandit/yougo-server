# Database Schema

YouGO utilizes **PostgreSQL** as the primary relational database, managed by the **Prisma ORM**.

## Configuration
- `prisma/schema.prisma` is the single source of truth for the database schema.
- We use the `prisma-client-js` generator.
- The connection URL is provided via the `DATABASE_URL` environment variable.

## Core Models

### `User`
Stores all primary user account information.
- **Authentication**: `passwordHash`, `isEmailVerified`, `emailVerificationToken`.
- **Security**: `failedLoginAttempts`, `lockedUntil`, `lastLoginIp`.
- **Profile Data**: `name`, `username`, `bio`, `gender`, `dateOfBirth`, `country`, `city`, `travelStyle`, `interests`, `languages`.
- **Metadata**: `createdAt`, `updatedAt`.

### `AuditLog`
Stores significant system and user actions for security monitoring and admin transparency.
- **Relations**: Linked to `User` (optional, for system actions).
- **Data**: `action` (e.g., "LOGIN_FAILED", "PASSWORD_CHANGED"), `details` (JSON payload), `ipAddress`.

## Migrations Workflow
- **Development**: Use `npm run db:push` to quickly sync the Prisma schema to the development database without creating migration files.
- **Production**: Use `npx prisma migrate dev` to generate SQL migration files, and `npx prisma migrate deploy` in the CI/CD pipeline to apply them.
