import { Context } from 'hono';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { randomUUID } from 'crypto';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { manualTripService } from '../services/manual-trip.service';
import { cloudinaryService } from '../services/cloudinary.service';

export class TripController {
  async generate(c: Context) {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Unauthorized access');
    }

    const body = await c.req.json();
    if (!body || !body.trip_details) {
      throw new BadRequestError('Invalid generate payload. "trip_details" is required.');
    }

    const generationId = randomUUID();

    // 1. Create PENDING Trip record owned by the authenticated user
    const trip = await prisma.trip.create({
      data: {
        generationId,
        userId: user.id,
        status: 'PENDING',
        payload: body,
        type: 'AI_model',
      },
    });

    console.log(`[TripController] Created PENDING trip record ${trip.id} for user ${user.id}`);

    // 2. Call stateless AI brain service to enqueue generation worker job
    try {
      const response = await fetch(`${env.BRAIN_SERVICE_URL}/api/v1/generate/enqueue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationId,
          dto: body,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI service enqueuing failed: ${errorText}`);
      }
    } catch (error: any) {
      console.error('[TripController] Failed to dispatch job to AI service:', error);
      
      // Update trip to FAILED in database to capture early failure
      await prisma.trip.update({
        where: { generationId },
        data: {
          status: 'FAILED',
          error: error.message || 'Failed to dispatch generation job to AI service engine.',
        },
      });

      return c.json({
        status: 'error',
        message: 'Could not queue generation job',
        error: error.message
      }, 500);
    }

    // 3. Return the response matching the existing generation API format
    return c.json({
      status: 'success',
      message: 'Travel generation job successfully queued',
      data: {
        generationId,
        status: 'PENDING',
      },
    });
  }

  async getStatus(c: Context) {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Unauthorized access');
    }

    const id = c.req.param('id');
    if (!id) {
      throw new BadRequestError('Generation ID is required');
    }

    // Retrieve the trip and assert ownership (fallback to id check)
    let trip = await prisma.trip.findUnique({
      where: { generationId: id },
    });

    if (!trip) {
      trip = await prisma.trip.findUnique({
        where: { id },
      });
    }

    if (!trip) {
      throw new NotFoundError(`Generation job with ID "${id}" not found`);
    }

    // Secure ownership assertion: only require ownership for incomplete/draft trips
    if (trip.status !== 'COMPLETED' && trip.userId !== user.id) {
      throw new UnauthorizedError('Access Denied: You do not own this in-progress expedition.');
    }

    // Match exact telemetry logs format returned previously
    const stepsCompleted = Array.isArray(trip.metadata)
      ? trip.metadata
          .filter((o: any) => o && typeof o === 'object' && 'stepName' in o)
          .map((o: any) => ({
            stepName: o.stepName,
            validationPassed: o.validationPassed,
            error: o.error,
            createdAt: o.createdAt,
          }))
      : [];

    const item = {
      generationId: trip.generationId,
      status: trip.status,
      error: trip.error,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      stepsCompleted,
      payload: trip.payload,
      response: trip.response,
    };

    return c.json({
      status: 'success',
      data: [item],
    });
  }

  async createManual(c: Context) {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Unauthorized access');
    }

    const body = await c.req.json();
    if (!body) {
      throw new BadRequestError('Request body is required.');
    }

    // 1. Validate based on status
    if (body.status === 'COMPLETED') {
      manualTripService.validatePublish(body);
    } else {
      // For DRAFT: require at least a destination name to start
      if (!body.destination || body.destination.trim() === '') {
        throw new BadRequestError('Destination is required to save a draft.');
      }
    }

    // 2. Process and save the manual trip
    const trip = await manualTripService.saveManualTrip(user.id, body);

    return c.json({
      status: 'success',
      message: body.status === 'COMPLETED' ? 'Manual trip published successfully' : 'Draft saved successfully',
      data: {
        id: trip.id,
        generationId: trip.generationId,
        status: trip.status,
      }
    });
  }

  async getUserDrafts(c: Context) {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Unauthorized access');
    }

    const drafts = await prisma.trip.findMany({
      where: {
        userId: user.id,
        status: 'DRAFT',
        type: 'user'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return c.json({
      status: 'success',
      data: drafts
    });
  }

  async uploadTripImage(c: Context) {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Unauthorized access');
    }

    const body = await c.req.parseBody();
    const file = body.image;

    if (!file || !(file instanceof File)) {
      throw new BadRequestError('No image file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new BadRequestError('Uploaded file must be a valid image');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await cloudinaryService.uploadImage(buffer, file.type);

    return c.json({
      status: 'success',
      data: {
        url: imageUrl
      }
    });
  }
}

export const tripController = new TripController();
