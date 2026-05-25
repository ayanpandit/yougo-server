# YouGO Backend API

This is the production-ready backend foundation for YouGO, built with Node.js, TypeScript, Hono, and PostgreSQL.

## Prerequisites
- Node.js (v20+)
- Docker & Docker Compose
- PostgreSQL (if running without Docker)

## Setup for Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and adjust the configuration.
   ```bash
   cp .env.example .env
   ```

3. **Start the Database**
   You can start the PostgreSQL database using Docker Compose:
   ```bash
   docker compose up db -d
   ```

4. **Initialize Prisma (Database Setup)**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:8000`.

## Scripts

- `npm run dev`: Start development server with hot-reload
- `npm run build`: Compile TypeScript to `dist`
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run typecheck`: Check for TypeScript errors
- `npm run db:generate`: Generate Prisma Client
- `npm run db:push`: Push Prisma schema to database
- `npm run db:studio`: Open Prisma Studio for DB management

## Docker Production Setup

To run the entire stack (API + Database) in Docker:

```bash
docker compose up -d --build
```

## Core Features

### Social & Follow System
- **Follow API Engine:**
  - `POST /api/v1/users/:userId/follow` - Authenticated endpoint to toggle following a user. Returns `{ following: true/false, followersCount: N }`. Prevents self-follows and guarantees uniqueness using composite keys.
  - `GET /api/v1/users/:userId/followers` - Public endpoint to retrieve a lightweight list of users following a profile (newest first).
  - `GET /api/v1/users/:userId/following` - Public endpoint to retrieve a lightweight list of users the profile is following (newest first).
- **Public Profile API:** `GET /api/v1/profile/:username` retrieves comprehensive profile data, including dynamic computation of `followersCount`, `followingCount`, and an context-aware `isFollowing` boolean via Optional Auth middleware.

### Trip Likes System
- `POST /api/v1/trips/:generationId/like` - Toggles the like status of a trip.
- `GET /api/v1/trips/:generationId/likes` - Fetches the strictly safe, public timeline of users who liked a trip.

### Optional Authentication
Smart middleware gracefully handles both authenticated and unauthenticated traffic for public feeds.
