# Folder Structure & Conventions

To maintain a clean, enterprise-grade architecture, the `src/` directory is strictly organized by responsibility.

## Directory Responsibilities

- `/app`: Bootstraps the application. Contains `app.ts` (Hono instance and global middleware).
- `/routes`: Defines API endpoints and assigns controllers.
- `/controllers`: Extracts HTTP request data, calls validation, and formats HTTP responses.
- `/services`: Contains pure business logic. Handles workflows, hashing, algorithms. Ignorant of HTTP.
- `/repositories`: Abstracts Database/Prisma operations. All DB queries belong here.
- `/validators`: Zod schemas for validating incoming request payloads.
- `/middleware`: Reusable Hono middleware (Authentication, Rate Limiting, Error Handling).
- `/db`: Database instantiation (`prisma.ts`).
- `/config`: Type-safe configuration and environment variables.
- `/utils`: Stateless utility functions and classes (e.g., `errors.ts`).
- `/types`: Global TypeScript interfaces and types.
- `/constants`: Hardcoded constants and configuration maps.
- `/lib`: Wrappers for external libraries or third-party SDKs.
- `/auth`: Specific modular auth utilities if needed (currently handled by services).
- `/websocket`: Real-time connection handlers.

## Strict Rules
1. **No Circular Dependencies**: Services can call Repositories. Controllers can call Services. The reverse is strictly prohibited.
2. **No Dead Code**: Remove unused functions and imports immediately.
3. **Naming Conventions**: Use `camelCase` for files (`auth.controller.ts`) and `PascalCase` for classes/interfaces (`AuthController`).
