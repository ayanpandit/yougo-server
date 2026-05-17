# Security Practices

The YouGO backend is built with security as a primary concern, actively preventing the OWASP Top 10 vulnerabilities.

## Core Security Features

1. **Password Hashing (bcrypt)**
   - Plain text passwords are never stored. We use `bcryptjs` with a cost factor of `12` to ensure resistance against rainbow tables and brute-force cracking.

2. **Secure Session Management**
   - JWTs are generated and signed with a strong secret.
   - Tokens are delivered exclusively via `HttpOnly` cookies. This prevents any client-side JavaScript from accessing the token, neutralizing Cross-Site Scripting (XSS) token exfiltration.
   - Cookies are set to `Secure=true` in production (HTTPS only) and `SameSite=Lax`.

3. **CSRF Protection**
   - Because we use cookies for authentication, we use the `hono/csrf` middleware. This validates the `Origin` header against allowed origins, preventing Cross-Site Request Forgery attacks.

4. **Secure Headers**
   - We utilize `hono/secure-headers` to automatically set security-centric HTTP headers (e.g., `X-XSS-Protection`, `X-Frame-Options`, `Strict-Transport-Security`).

5. **Input Validation & Sanitization**
   - All incoming payloads are validated using Zod.
   - Schemas enforce `.strict()`, which automatically rejects payloads containing unknown or unexpected properties, mitigating prototype pollution and mass assignment attacks.

6. **Rate Limiting (Brute Force Protection)**
   - Basic rate limiting and account locking logic (`failedLoginAttempts`, `lockedUntil`) restrict the number of login attempts a user can make within a time frame.

7. **Error Masking**
   - Unhandled exceptions are caught by the global error handler and returned as generic "Internal Server Error" messages. Stack traces and database internals are never leaked to the client.

8. **Audit Logging**
   - The `AuditLog` table tracks significant actions, providing an immutable trail of security events.

9. **Stateless Session Revocation (Token Versioning)**
   - To securely support a global logout / revoke-all-sessions feature, the database stores a `tokenVersion` for each user.
   - This version is embedded in the JWT payload.
   - The auth middleware validates that the token version matches the database version on every request. If mismatched, the session is rejected. This provides immediate, secure global invalidation of active sessions across all devices when logout is triggered.
