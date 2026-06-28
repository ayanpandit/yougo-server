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

### Step 3: Saving or Posting the Trip
When the AI generation completes, it is stored in the database with `isPublished: false` by default, meaning it is not visible on the public `/feed` endpoint. The creator has two options:
1. **Save Expedition**: Keep the trip private. It remains accessible to the owner via their private profile dashboard, but is excluded from the public feed.
2. **Post to Explore Feed**: Call the publish endpoint to set `isPublished: true`, making it public.
   - **Endpoint**: `POST /api/v1/generate/:generationId/publish`
   - **Auth Required**: ✅ Yes (Must be the creator)
   - **Response**:
     ```json
     {
       "status": "success",
       "message": "Expedition published successfully",
       "data": {
         "id": "database-uuid",
         "generationId": "unique-job-uuid",
         "isPublished": true
       }
     }
     ```
   - **Frontend Action**: Send a `POST` request to this endpoint and redirect the user to the Explore feed (`/explore`).

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

---

## 6. Manual Trip Creation & Image Uploads (NEW)

### 1. Cloudinary File Uploads
Allows manual trip creators to upload raw binaries directly to Cloudinary and retrieve secure image URLs for trip visual summaries.

- **Endpoint**: `POST /api/v1/generate/manual/upload-image`
- **Auth Required**: ✅ Yes
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `image`: Raw Image file binary.
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "url": "https://res.cloudinary.com/..."
    }
  }
  ```

### 2. Manual Trip Creation (Save Draft / Publish)
Allows full relational relational-free, flat manual trip inserts or draft saves matching identical canonical response schemas.

- **Endpoint**: `POST /api/v1/generate/manual`
- **Auth Required**: ✅ Yes
- **Payload Structure**:
  ```json
  {
    "generationId": "optional-uuid-to-overwrite-existing-draft",
    "status": "DRAFT", // or "COMPLETED" to publish
    "destination": "Manali",
    "tripType": "Round Trip",
    "totalDays": 2,
    "totalPersons": 2,
    "experienceType": "Adventure",
    "baseCurrency": "INR (₹)",
    "imageUrl": "https://res.cloudinary.com/...",
    "origin": "Ghaziabad",
    "startDate": "2026-06-15",
    "budgetINR": 45000,
    "luxuryLevel": "moderate",
    "travelStyle": "adventure",
    "foodPreference": "veg",
    "isRoundTrip": true,
    "travelMedium": {
      "bus": { "selected": false },
      "car": { "selected": true, "type": "suv", "ownership": "rented" },
      "bike": { "selected": false },
      "train": { "selected": false },
      "flights": { "selected": false },
      "mixed_best_suitable": false
    },
    "travelers": [
      { "sex": "M", "age": 21 },
      { "sex": "M", "age": 22 }
    ],
    "days": [
      {
        "day": 1,
        "title": "The Ascent",
        "date": "15/06/2026",
        "route": "Ghaziabad, Manali",
        "distance": "540 km",
        "travelTime": "12.5 hrs",
        "altitudeSeaLevel": "2050m",
        "dailyPacing": "Moderate",
        "experienceDescription": "Scenic hill drives.",
        "accommodation": {
          "hotelName": "Hotel Grand View",
          "whyRecommended": "Valleys views",
          "bookingPlatform": "Booking.com",
          "bookingLink": "https://www.booking.com/...",
          "pricePerPersonINR": 1600
        },
        "transportDetails": {
          "type": "car",
          "subType": "Mahindra Thar",
          "flightOrTrainNumber": "Not Applicable",
          "departureTime": "04:30 AM",
          "arrivalTime": "05:00 PM"
        },
        "predictedWeather": {
          "conditions": "Clear Skies",
          "temperatureLow": "12°C",
          "temperatureHigh": "22°C"
        },
        "dailyActivities": [
          { "name": "Hadimba temple", "detail": "Temple visit", "estimatedINR": 500 }
        ],
        "costBreakdown": {
          "transportBaseINR": 3500,
          "fuelINR": 4500,
          "tollsINR": 650,
          "accommodationINR": 1600,
          "activitiesINR": 500,
          "foodINR": { "breakfast": 300, "lunch": 700, "dinner": 1200 }
        }
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "db-record-id",
      "generationId": "uuid-for-drafts-overwrites",
      "status": "DRAFT",
      "destination": "Manali",
      "totalDays": 2,
      "perPersonCost": 22350
    }
  }
  ```

### 3. Load Active User Drafts
Fetches a list of all active drafts saved by the currently authenticated user.

- **Endpoint**: `GET /api/v1/generate/manual/drafts`
- **Auth Required**: ✅ Yes
- **Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "generationId": "uuid",
        "status": "DRAFT",
        "destination": "Manali",
        "totalDays": 2,
        "updatedAt": "2026-05-24T17:31:00.000Z",
        "payload": { ... } // Raw intake details
      }
    ]
  }
  ```

---

## 7. Social Graph & Follow System

### 1. Toggle Follow
Provides Instagram-style follow/unfollow functionality. If you are already following the user, hitting this endpoint will unfollow them.

- **Endpoint**: `POST /api/v1/users/:userId/follow`
- **Auth Required**: ✅ Yes
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "following": true,
      "followersCount": 120
    }
  }
  ```

### 2. Get Followers / Following
Fetches a list of profiles for the social graph.

- **Endpoint**: `GET /api/v1/users/:userId/followers` (and `/following`)
- **Auth Required**: ❌ No
- **Response Shape**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "uuid",
        "username": "wanderlust99",
        "name": "Wanderlust",
        "image": "https://res.cloudinary.com/..."
      }
    ]
  }
  ```

### 3. Public Profile Data
Fetches comprehensive profile details along with dynamic follow metrics.

- **Endpoint**: `GET /profile/:username`
- **Auth Required**: Optional (If sent, the backend computes `isFollowing` from your perspective)
- **Response Shape**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "uuid",
        "username": "wanderlust99",
        "name": "Wanderlust",
        "image": "https://...",
        "bio": "Travel enthusiest"
      },
      "followersCount": 120,
      "followingCount": 47,
      "isFollowing": false
    }
  }
  ```

---

## 8. Direct Messaging (DM) System

All direct messaging endpoints require full user authentication. Messages belong strictly to Conversation Containers, decoupling direct user-to-user links for scalable group chat architectures.

### 1. Get or Create Direct Conversation
Retrieves an existing direct 1-to-1 conversation between the authenticated user and another traveler, or initializes a brand new conversation if none exists.

- **Endpoint**: `POST /api/v1/conversations/direct/:userId`
- **Auth Required**: ✅ Yes
- **Response Shape**:
  ```json
  {
    "status": "success",
    "data": {
      "conversationId": "uuid",
      "participant": {
        "id": "uuid",
        "username": "travel_partner",
        "name": "Travel Partner",
        "image": "https://..."
      },
      "createdAt": "2026-05-26T12:00:00.000Z",
      "updatedAt": "2026-05-26T12:00:00.000Z"
    }
  }
  ```

### 2. List Conversations
Lists all conversations the authenticated user is currently participating in, loaded with lightweight latest message previews and metadata.

- **Endpoint**: `GET /api/v1/conversations`
- **Auth Required**: ✅ Yes
- **Response Shape**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "conversationId": "uuid",
        "updatedAt": "2026-05-26T12:05:00.000Z",
        "participant": {
          "id": "uuid",
          "username": "travel_partner",
          "name": "Travel Partner",
          "image": "https://..."
        },
        "lastMessage": {
          "id": "uuid",
          "text": "See you in Bali!",
          "createdAt": "2026-05-26T12:05:00.000Z",
          "senderId": "uuid"
        }
      }
    ]
  }
  ```

### 3. Get Conversation Messages
Loads conversation messages in chronological order, with built-in cursor-based or page-based offsets.

- **Endpoint**: `GET /api/v1/conversations/:conversationId/messages`
- **Auth Required**: ✅ Yes
- **Query Parameters**:
  - `limit`: defaults to `50`
  - `offset`: defaults to `0`
- **Response Shape**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "messageId": "uuid",
        "text": "Hey! Are you excited for the Bali trip?",
        "createdAt": "2026-05-26T12:00:00.000Z",
        "sender": {
          "id": "uuid",
          "username": "travel_partner",
          "name": "Travel Partner",
          "image": "https://..."
        }
      }
    ]
  }
  ```

### 4. Send Message
Sends a direct text message within the specified conversation and updates the conversation's active timestamp.

- **Endpoint**: `POST /api/v1/conversations/:conversationId/messages`
- **Auth Required**: ✅ Yes
- **Request Body**:
  ```json
  {
    "text": "Absolutely! I have already started packing."
  }
  ```
- **Response Shape**:
  ```json
  {
    "status": "success",
    "data": {
      "messageId": "uuid",
      "text": "Absolutely! I have already started packing.",
      "createdAt": "2026-05-26T12:06:00.000Z",
      "sender": {
        "id": "uuid",
        "username": "current_user",
        "name": "Current User",
        "image": "https://..."
      }
    }
  }
  ```

