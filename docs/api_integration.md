# YouGO API Integration Guide

## Base URL
- Local: http://localhost:3000
- All endpoints are prefixed with /api

## Authentication
Authentication is powered by Better Auth with cookie-based sessions.
Auth endpoints are mounted under /api/auth/* and accept GET and POST requests.
When calling protected endpoints from a browser, send credentials (cookies).

## Common headers
- Content-Type: application/json
- x-request-id: Optional; if provided it is echoed back in responses

## Error response shape
Errors return JSON with a message and HTTP status code.

Example:
{
  "message": "Not Found"
}

## Endpoints

### GET|POST /api/auth/*
All Better Auth endpoints are served here (sign in, callbacks, sessions, etc.).
Refer to Better Auth docs for specific endpoint behavior and client usage.

### GET /api/health
Returns service health and dependency status.

Response (200):
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2026-05-12T08:30:00.000Z",
  "version": "0.1.0",
  "dependencies": {
    "database": "up"
  }
}

## Status codes
- 200: Success
- 404: Not found
- 500: Server error

## Protected route example

### GET /api/protected/me
Returns the authenticated user's session and user data.

Response (200):
{
  "user": {
    "id": "...",
    "email": "...",
    "username": "..."
  },
  "session": {
    "id": "...",
    "expiresAt": "..."
  }
}

Response (401):
{
  "message": "Unauthorized"
}

## Versioning
Endpoints are currently prefixed with /api. For future versioning, use /api/v1 and beyond.

## Websocket
Websocket integration is reserved under src/websocket. Document websocket routes here when added.

## Documentation maintenance
Update this doc whenever new endpoints or auth flows are added.
