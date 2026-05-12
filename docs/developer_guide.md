# YouGO Backend Developer Guide

## Overview
This repository contains the production-grade backend foundation for YouGO.

## Prerequisites
- Node.js 20+
- npm
- Docker and Docker Compose (optional for container workflow)

## Environment setup
1. Copy .env.example to .env
2. Update values for database credentials and CORS origins
3. Set Better Auth variables (BETTER_AUTH_SECRET, BETTER_AUTH_URL, Google OAuth)

## Local development
1. npm install
2. npm run dev

The API will be available at http://localhost:3000.

## Docker development
1. Copy .env.example to .env
2. docker compose up --build

The API will be available at http://localhost:3000 and PostgreSQL at port 5432.

## Database and Prisma
- Schema lives in prisma/schema.prisma
- Generate Prisma client: npm run db:generate
- Run local migrations: npm run db:migrate
- Open Prisma Studio: npm run db:studio

## Authentication (Better Auth)
- Auth handler is mounted at /api/auth/*
- Google OAuth redirect URL (local): http://localhost:3000/api/auth/callback/google
- Magic link emails currently log to the console in src/services/email.service.ts
- Update the email provider integration before production rollout
- Usernames are auto-generated from email if not provided during signup

When adding Better Auth plugins or changing auth-related schema fields:
1. npx auth@latest generate
2. npm run db:migrate

## Scripts
- dev: Hot reload server with tsx
- build: Compile TypeScript and resolve path aliases
- start: Run compiled server
- clean: Remove dist output
- typecheck: Type-only validation
- lint / lint:fix: ESLint checks and fixes
- format / format:check: Prettier format and check
- auth:generate: Generate Better Auth schema for Prisma
- db:generate / db:migrate / db:deploy / db:studio: Prisma tooling

## Project structure
- src/app: App composition and middleware
- src/routes: HTTP route definitions
- src/controllers: Request handlers
- src/services: Business logic
- src/repositories: Data access
- src/middleware: Custom middleware
- src/auth: Auth configuration and exports
- src/db: Database clients
- src/validators: Request validators
- src/websocket: Websocket handlers (placeholder)
- src/utils: Shared helpers
- src/config: Typed configuration
- src/types: Shared types
- src/constants: Shared constants
- src/lib: Low-level utilities (placeholder)

## Adding a new route
1. Create a controller in src/controllers
2. Add service and repository files as needed
3. Create a route in src/routes and mount it in src/routes/index.ts
4. Update docs/api_integration.md with the new endpoint

## Documentation maintenance
If you add or change scripts, environment variables, or endpoints, update this guide and docs/api_integration.md.
