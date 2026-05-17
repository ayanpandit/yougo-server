# Docker Workflow

The YouGO backend is fully containerized to ensure absolute consistency across development, testing, and production environments.

## Development

In development, we use Docker Compose primarily to run dependencies (like PostgreSQL) while running the Node.js API locally with hot-reloading for maximum developer velocity.

### Commands
- Start Database: `docker compose up db -d`
- Stop Database: `docker compose down`
- Start API Locally: `npm run dev`

*We mount volumes to persist database data inside `pgdata`.*

## Production

For production, we use a highly optimized, multi-stage `Dockerfile`.

### Dockerfile Stages
1. **base**: Uses `node:20-alpine`, installs `openssl` (required for Prisma).
2. **dependencies**: Installs all `npm` dependencies including `devDependencies` to allow for building. Runs `npx prisma generate`.
3. **build**: Copies the source and compiles TypeScript via `npm run build`.
4. **production**: Installs strictly production dependencies (`npm ci --omit=dev`), regenerates the Prisma client, copies the `/dist` output from the `build` stage, and exposes port `8000`.

### Running Production Full Stack
To spin up both the API and the DB in production-like isolation:
```bash
docker compose up -d --build
```
