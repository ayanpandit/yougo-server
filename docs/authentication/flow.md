# Authentication Flow

YouGO uses a highly secure, traditional email/password authentication system built around HttpOnly Secure Cookies.

## 1. Registration Flow
- **Front-End View**: `/register`
  - Split-screen layout displaying beautiful custom scenery, the logo, and a clean structured sign-up input schema (Username, Email, Password).
- **Process**:
  - User submits `email`, `username`, and `password`.
  - Controller validates input via Zod `.strict()` schemas.
  - Service checks for uniqueness (email/username).
  - Password is hashed using `bcryptjs` with a cost factor of `12`.
  - User is created in the database with `isEmailVerified = false`.
  - A 64-character hex cryptographic token is generated.
  - Brevo's HTTP API (Port 443) sends an email containing the verification link.

## 2. Email Verification Flow
- User clicks the link containing the `token` parameter.
- System queries the User by `emailVerificationToken`.
- If valid, `isEmailVerified` is set to `true` and the token is nullified.

## 3. Login Flow
- **Front-End View**: `/login`
  - High-end centered credential input mirroring the split-screen architecture. Supports email & password forms + secure social authentication triggers (Google, Apple).
- **Process**:
  - User submits credentials.
  - Service validates email existence and compares hashes using `bcryptjs`.
  - Verifies that the email has been confirmed.
  - Verifies that the account is not currently locked (brute force protection).
  - A JWT is generated containing the user's `id` (`sub` claim), expiring in 7 days.
  - The JWT is sent back to the client inside an **HttpOnly, Secure, SameSite=Lax** cookie.

## 4. Protected Routes
- The client sends subsequent requests. The browser automatically attaches the HttpOnly cookie.
- `requireAuth` middleware extracts the JWT from the cookie.
- Validates the signature and expiration.
- Injects the `User` object into the Hono request context.

## 5. Security Measures
- **HttpOnly**: JavaScript cannot read the token, neutralizing XSS token theft.
- **CSRF Protection**: Because cookies are automatically sent, a CSRF middleware validates the `Origin` header to prevent forged cross-site requests.
- **Account Locking**: After successive failed attempts, the account is temporarily locked to prevent brute-force and dictionary attacks.
- **Password Reset Hashing**: Reset tokens are cryptographically generated but stored in the database as a SHA-256 hash. This prevents database leaks from compromising active reset links.
- **User Enumeration Prevention**: Password reset requests for non-existent emails return a generic successful response to prevent attackers from discovering registered emails.

## 6. Logout & Session Revocation Flow
- **Front-End View**: Triggered via sidebar or profile page action buttons.
- **Process**:
  - The client makes a `POST` request to `/auth/logout`.
  - The server decodes the token and calls the auth service to increment the user's `tokenVersion` (+1) in the database.
  - The server deletes the `jwt` HttpOnly cookie.
  - This immediately invalidates **all** JWTs previously issued to the user on **all devices** due to the middleware `tokenVersion` check.

## 7. Profile Update Flow
- **Front-End View**: `/profile` page toggles into edit mode to allow form submissions.
- **Process**:
  - The user enters optional metadata (Name, Bio, City, Country, Gender, Date of Birth, Travel Style, Interests, Languages).
  - Security fields (**Email** and **Password**) are completely locked out from modifications on the frontend, and ignored/rejected on the backend to prevent credential hijacking.
  - The Hono endpoint validates incoming properties using `updateProfileSchema` Zod validation.
  - If a new `username` is provided, it confirms username uniqueness and throws `ConflictError` if already in use.
  - Database is updated, and the new dynamic `user` context is refreshed on the frontend.

## 8. Password Reset Flow
- **Front-End View**: `/forgot-password` and `/reset-password`
  - `/forgot-password` prompts for an email and returns a generic success message regardless of email existence.
  - `/reset-password` displays a form for the new password if a valid, unexpired token is parsed from the URL parameter (`token`).
- **Process**:
  - **Request**:
    - The client sends a `POST` request to `/auth/forgot-password` with the user's `email`.
    - If the user exists, the server generates a cryptographically secure 64-character hex token, hashes it using SHA-256, and stores the hash and a 1-hour expiry time in the database.
    - An email is sent via Brevo HTTP API with the reset link containing the unhashed token: `${FRONTEND_URL}/reset-password?token=${token}`.
  - **Reset**:
    - The client sends a `POST` request to `/auth/reset-password` with the unhashed `token` and the new `password`.
    - The server hashes the unhashed token using SHA-256, then queries the database for a user with the matching `passwordResetToken`.
    - Validates that the token hasn't expired.
    - Hashes the new password using `bcryptjs` (salt rounds 12).
    - Updates `passwordHash`, sets token/expiry fields to `null`, and increments `tokenVersion` by 1.
    - Incrementing `tokenVersion` instantly invalidates all existing JWT sessions on all other devices, ensuring complete security.
    - Sends a confirmation email indicating that the password was successfully reset.
