# YouGO Server

Production-grade backend foundation for YouGO built with Node.js, TypeScript, Hono, Prisma, Better Auth, and PostgreSQL.

## Features
- Modular clean architecture layout
- Type-safe environment configuration with Zod
- Docker and Docker Compose workflow
- ESLint, Prettier, and path aliases
- Hot reload with tsx
- Better Auth with Google OAuth and magic link

## Quick start (local)
1. Copy .env.example to .env and update values
2. npm install
3. npm run dev

## Docker development
1. Copy .env.example to .env
2. docker compose up --build

## Authentication
- Better Auth endpoints are mounted under /api/auth/*
- Configure Google OAuth redirect URLs to:
	- http://localhost:3000/api/auth/callback/google
- Set BETTER_AUTH_SECRET and BETTER_AUTH_URL in .env
- Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for Google OAuth

## Scripts
- dev: Hot reload server
- build: Compile TypeScript and resolve path aliases
- start: Run compiled server
- clean: Remove dist output
- typecheck: Type-only validation
- lint / lint:fix: ESLint checks and fixes
- format / format:check: Prettier format and check
- auth:generate: Generate Better Auth schema for Prisma
- db:generate / db:migrate / db:deploy / db:studio: Prisma tooling

## Project structure
src/
	app/
	routes/
	controllers/
	services/
	repositories/
	middleware/
	auth/
	db/
	validators/
	websocket/
	utils/
	config/
	types/
	constants/
	lib/

Other folders:
- prisma/
- docker/
- scripts/
- docs/

## Documentation
- docs/developer_guide.md
- docs/api_integration.md