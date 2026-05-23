# API Endpoints

This document outlines the available REST API endpoints for the YouGO backend.

## 🌍 Public Endpoints

### Discovery Feed
Fetches a highly optimized list of recently generated travel itineraries for the public social feed.
- **URL**: `/feed` (also available at `/api/v1/feed`)
- **Method**: `GET`
- **Auth Required**: No
- **Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "tripId": "uuid",
        "coverImage": "https://...",
        "tripType": "adventure",
        "destination": "Paris",
        "totalDays": 5,
        "experienceType": "couple",
        "perPersonCost": 50000,
        "createdAt": "2026-05-24T00:00:00.000Z",
        "creator": {
          "username": "wanderlust99",
          "image": "https://..."
        }
      }
    ]
  }
  ```

## 🔐 Protected Endpoints

### Generate AI Trip
Dispatches a new AI itinerary generation job.
- **URL**: `/api/v1/generate`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Body**: Trip generation payload parameters.

### Check Trip Generation Status
Retrieves the real-time execution telemetry and final JSON output of a trip.
- **URL**: `/api/v1/generate/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token). Must be the owner of the trip.
