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

### `Trip` (AI Brain Microservice)
Stores completely generated AI travel itineraries.
- **Data**: `payload` (input preferences), `response` (validated day-by-day JSON plans), `metadata` (step execution logs).
- **Architecture**: `yougo-server` is the singular owner of this schema. The `yougo_brain` AI microservice acts as a stateless client that reads and writes to this table directly via the centralized `DATABASE_URL`.

## Migrations Workflow
- **Development**: Use `npx prisma db push` to quickly sync the Prisma schema to the development database without creating migration files.
- **Production**: Use `npx prisma migrate dev` to generate SQL migration files, and `npx prisma migrate deploy` in the CI/CD pipeline to apply them.
