# Frontend API Integration Guide

This document serves as the master reference for integrating the YouGO frontend with the YouGO backend API architecture. It covers setup, authentication workflows, and detailed payload schemas.

---

## 1. Environment Setup

### Base URL
All API requests should be directed to the backend server's base URL. In development, this is typically `http://localhost:8000`. 
Ensure your frontend has a global configuration or HTTP client wrapper (like Axios or native Fetch) configured with this base URL.

```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

---

## 2. Authentication & Authorization

YouGO uses **JWT (JSON Web Tokens)** alongside secure HTTP-only cookies and standard `Bearer` tokens for authentication.

### Login Flow
When a user logs in, the backend sets an HTTP-only cookie AND returns the user data.

- **Endpoint**: `POST /auth/login`
- **Payload**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "uuid",
        "username": "wanderlust99",
        "email": "user@example.com",
        "isEmailVerified": true
      }
    }
  }
  ```
- **Frontend Action**: The frontend should store the `user` object in a global state (e.g., Redux, Zustand, or Context). **Do not attempt to extract the JWT manually**, as it is securely managed by the browser's cookie jar or attached via middleware if manually required.

### Making Authenticated Requests
For protected routes (like creating a trip), the `credentials: 'include'` flag MUST be set in your fetch requests so the browser automatically attaches the authentication cookie.

```javascript
fetch(`${API_BASE_URL}/api/v1/generate`, {
  method: 'POST',
  credentials: 'include', // CRITICAL for auth
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

*(Note: If using Bearer tokens instead of cookies depending on specific API revisions, attach `Authorization: Bearer <TOKEN>` in the headers).*

---

## 3. Public Endpoints

### The Discovery Feed
Fetches the highly optimized feed of all completed travel itineraries globally.

- **Endpoint**: `GET /feed` (or `GET /api/v1/feed`)
- **Auth Required**: ❌ No
- **Usage**: Call this immediately on the Home or Discover page to render the social grid.
- **Response Shape**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "tripId": "uuid",
        "coverImage": "https://unsplash.com/...",
        "tripType": "adventure",
        "destination": "Bali, Indonesia",
        "totalDays": 5,
        "experienceType": "solo",
        "perPersonCost": 45000,
        "createdAt": "2026-05-24T00:00:00.000Z",
        "creator": {
          "username": "travel_guru",
          "image": "https://..."
        }
      }
    ]
  }
  ```

---

## 4. Protected Endpoints (AI Trip Generation)

### Step 1: Submitting a Trip Request
This endpoint enqueues a heavy AI generation task and immediately returns a tracking `generationId`.

- **Endpoint**: `POST /api/v1/generate`
- **Auth Required**: ✅ Yes
- **Payload Structure**:
  ```json
  {
    "trip_details": {
      "origin": "Bengaluru",
      "destination": "Rameswaram",
      "startDate": "2026-06-30",
      "days": 4,
      "budgetINR": 45000,
      "isRoundTrip": true
    },
    "party_composition": {
      "totalPersons": 2,
      "travelers": [
        { "sex": "M", "age": 21 },
        { "sex": "F", "age": 22 }
      ]
    },
    "preferences": {
      "food_preference": "veg",
      "travel_style": "adventure",
      "luxury_level": "moderate"
    },
    "travel_medium": {
      "mixed_best_suitable": false,
      "bike": { "selected": true, "type": "sports", "ownership": "rented" }
    }
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Travel generation job successfully queued",
    "data": {
      "generationId": "unique-job-uuid",
      "status": "PENDING"
    }
  }
  ```

### Step 2: Polling for Status & Results
Because AI generation takes 10-30 seconds, the frontend should implement a polling mechanism (e.g., `setInterval` every 2-3 seconds) to check the status using the `generationId`.

- **Endpoint**: `GET /api/v1/generate/:generationId`
- **Auth Required**: ✅ Yes (Must be the creator)
- **Response while Processing**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "generationId": "unique-job-uuid",
        "status": "PROCESSING",
        "stepsCompleted": [
          {
            "stepName": "places",
            "validationPassed": true,
            "createdAt": "2026-05-24T..."
          }
        ],
        "response": null
      }
    ]
  }
  ```
- **Frontend Action**: Render a loading screen. You can use the `stepsCompleted` array to power a dynamic progress bar (e.g., "Finding places...", "Planning route...").

- **Response when Completed**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "generationId": "unique-job-uuid",
        "status": "COMPLETED",
        "stepsCompleted": [ ... ],
        "response": {
          "summary": { ... },
          "itinerary": [ ... ],
          "totalCostSummary": { ... }
        }
      }
    ]
  }
  ```
- **Frontend Action**: Stop polling. Navigate the user to the detailed trip view page and pass the complete `response` object.

---

## 5. Error Handling Convention

Always wrap API calls in `try/catch` blocks and inspect the `status` field.
The backend will return standard HTTP status codes:
- `400 Bad Request`: Usually invalid input formats. Read the `message` or `errors` array.
- `401 Unauthorized`: Not logged in, or token expired. Redirect to `/login`.
- `404 Not Found`: The requested resource (e.g., generationId) does not exist.
- `500 Internal Server Error`: Backend crash or third-party API failure.

Example handling:
```javascript
const res = await fetch('/api/v1/generate', { ... });
const result = await res.json();

if (!res.ok) {
  toast.error(result.message || 'An unexpected error occurred');
  return;
}

// Proceed with success
const generationId = result.data.generationId;
```
