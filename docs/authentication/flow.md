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
  - Nodemailer sends an email containing the verification link.

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
