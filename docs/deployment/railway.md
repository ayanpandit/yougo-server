# Railway Deployment Guide

This document explains how to deploy the YouGO backend to [Railway.app](https://railway.app), adhering to industry-standard configurations.

## Architecture

We use an explicit Infrastructure-as-Code approach via the `railway.json` file. This tells Railway:
1. To use **Nixpacks** as the primary language builder (standard for Node.js).
2. To run `npm run build` which safely generates the Prisma client *before* compiling TypeScript.
3. To run `npm run start:prod` to launch the app.
4. To ping `/health` as a healthcheck before rerouting traffic, ensuring zero-downtime deployment pipelines.

## Deployment Steps

1. Create a new project in Railway.
2. Provision a **PostgreSQL** database service within the Railway project.
3. Deploy this GitHub repository as a new service in the same project.
4. Configure the following Environment Variables in the backend service.

## Environment Variables

| Variable | Description |
|---|---|
| `NODE_ENV` | Must be set to `production` (enables cross-origin secure cookies). |
| `DATABASE_URL` | Connects to your Railway Postgres instance. Railway provides this automatically as `$DATABASE_URL` if linked. |
| `FRONTEND_URL` | Set to your Vercel/Netlify frontend URL (e.g., `https://yougo.vercel.app`). Used for strict CORS and CSRF protection. |
| `JWT_SECRET` | A secure, random 64-character string used to cryptographically sign session tokens. |
| `RESEND_API_KEY` | Your API key from [Resend](https://resend.com). Used for transactional email delivery (verification, password reset). |
| `EMAIL_FROM` | Sender identity string, e.g. `YouGO <noreply@yourdomain.com>`. Defaults to `YouGO <onboarding@resend.dev>` for testing. |
| `CLOUDINARY_CLOUD_NAME` | *(Optional)* Cloudinary cloud name for profile image uploads. |
| `CLOUDINARY_API_KEY` | *(Optional)* Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | *(Optional)* Cloudinary API secret. |

## Production Start Command
The `npm run start:prod` command automatically runs `npx prisma migrate deploy` before executing the server logic. This is critical for CI/CD environments as it ensures your production database schema is strictly synchronized with your codebase prior to receiving web traffic.
