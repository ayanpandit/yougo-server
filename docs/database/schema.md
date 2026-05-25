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
- **Social Graph**: Tracks followers and followings via relations to the `Follow` table.
- **Metadata**: `createdAt`, `updatedAt`.

### `Follow`
A self-referencing relationship mapping table for the social graph.
- **Data**: `followerId`, `followingId`, `createdAt`.
- **Constraints**: Compound unique constraint on `(followerId, followingId)` to prevent duplicate social links, optimized with individual indices.

### `AuditLog`
Stores significant system and user actions for security monitoring and admin transparency.
- **Relations**: Linked to `User` (optional, for system actions).
- **Data**: `action` (e.g., "LOGIN_FAILED", "PASSWORD_CHANGED"), `details` (JSON payload), `ipAddress`.

### `Trip` (AI Brain Microservice)
Stores completely generated AI travel itineraries.
- **Data**: `payload` (input preferences), `response` (validated day-by-day JSON plans), `metadata` (step execution logs).
- **Feed Extraction**: To enable high-performance social feeds, summary fields are extracted into top-level primitive columns (`coverImage`, `tripType`, `totalDays`, `destination`, `baseCurrency`, `totalPersons`, `experienceType`, `perPersonCost`) avoiding heavy JSON parsing on list endpoints.
- **Ownership**: Every trip belongs to an authenticated user (`userId` relation to `User`).
- **Architecture**: `yougo-server` orchestrates trip creation and ownership. The `yougo_brain` AI microservice acts as a stateless generation engine that processes jobs and updates this table via the centralized `DATABASE_URL`.

## Migrations Workflow
- **Development**: Use `npx prisma db push` to quickly sync the Prisma schema to the development database without creating migration files.
- **Production**: Use `npx prisma migrate dev` to generate SQL migration files, and `npx prisma migrate deploy` in the CI/CD pipeline to apply them.
