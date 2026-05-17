# Architecture Overview

The YouGO backend follows a strict Clean Architecture pattern to ensure modularity, scalability, and ease of testing.

## Core Layers

1. **Routes Layer (`src/routes`)**
   - Defines the API endpoints and HTTP methods.
   - Delegates request handling to the Controller layer.
   - Implements route-level middleware (e.g., authentication, rate limiting).
   - **Rule**: NO business logic is allowed here.

2. **Controller Layer (`src/controllers`)**
   - Extracts and parses data from the HTTP request (`hono` context).
   - Validates data using the Validators.
   - Calls the corresponding Service methods.
   - Formats the HTTP response.
   - **Rule**: NO direct database access or heavy logic allowed here.

3. **Service Layer (`src/services`)**
   - Contains all the core business logic.
   - Handles complex operations, multi-step workflows, and external service calls (like email sending).
   - Consumes the Repository layer to access data.
   - **Rule**: Must be independent of the HTTP context (should not know about `hono/Context`).

4. **Repository Layer (`src/repositories`)**
   - Abstracts all database queries.
   - Wraps the Prisma Client.
   - **Rule**: Should only return structured data and handle simple to complex data aggregation, shielding the Service layer from ORM-specific details.

## Request Lifecycle
1. Request arrives at `src/index.ts` -> `@hono/node-server`.
2. Passed into `src/app/app.ts` where global middleware (CORS, CSRF, Secure Headers, Logger) processes it.
3. Routed to the specific group (e.g., `/auth` -> `auth.routes.ts`).
4. Reaches the Controller, parsed, and validated.
5. Passed to the Service for business rules.
6. Service queries the Repository for data.
7. Response traverses back up and is sent to the client.
