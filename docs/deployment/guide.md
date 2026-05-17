# Deployment Guide

Deploying the YouGO backend is streamlined via Docker.

## Prerequisites
- A Linux VPS (Ubuntu/Debian recommended).
- Docker and Docker Compose installed.
- A domain name pointing to the VPS IP.
- Nginx or Traefik installed for Reverse Proxy and SSL termination.

## Step-by-Step Deployment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/yougo.git
   cd yougo/yougo-server
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   ```
   Set `NODE_ENV=production`, configure the PostgreSQL connection, specify the `FRONTEND_URL` (for CORS/CSRF), and input strong secrets.

3. **Deploy Container Stack**
   ```bash
   docker compose up -d --build
   ```
   This builds the optimized production Node.js image and spins up the PostgreSQL container.

4. **Run Database Migrations**
   ```bash
   docker compose exec api npx prisma migrate deploy
   ```

5. **Reverse Proxy (Nginx Example)**
   Configure Nginx to route traffic to port `8000`. Ensure SSL is configured via Certbot so that cookies can be sent securely (`Secure=true`).
