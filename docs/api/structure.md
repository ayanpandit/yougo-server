# API Structure & Conventions

## RESTful Design
The YouGO API follows strict RESTful conventions.
- Resources are pluralized (e.g., `/users`, `/trips`).
- Methods dictate the action: `GET` (read), `POST` (create), `PATCH` (partial update), `DELETE` (remove).

## Standardized JSON Response
All endpoints return a consistent JSON structure to ensure predictable parsing on the frontend.

### Success Response
```json
{
  "status": "success",
  "message": "Optional success message",
  "data": {
    "user": { ... }
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Human readable error description"
}
```

### Validation Error Response (Zod)
```json
{
  "status": "fail",
  "message": "Validation failed",
  "errors": [
    {
      "path": ["email"],
      "message": "Invalid email address"
    }
  ]
}
```

## Validation Flow
1. Incoming payloads are parsed as JSON via Hono.
2. The payload is passed into a Zod schema using `.parse()`.
3. The schema uses `.strict()` to ensure no arbitrary properties are passed into the system.
4. If validation fails, a `ZodError` is thrown.
5. The global `errorHandler` middleware catches the `ZodError` and formats it into the 400 Bad Request response shown above.

## Error Handling
Never throw raw Errors containing stack traces or sensitive internal states. Use the centralized `AppError` subclasses from `src/utils/errors.ts`:
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
