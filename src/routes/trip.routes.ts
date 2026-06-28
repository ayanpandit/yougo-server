import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware';
import { optionalAuth } from '../middleware/optional-auth.middleware';
import { tripController } from '../controllers/trip.controller';

const tripRoutes = new Hono();

// Both routes are protected by JWT/session validation middleware
tripRoutes.post('/', requireAuth, c => tripController.generate(c));
tripRoutes.post('/manual', requireAuth, c => tripController.createManual(c));
tripRoutes.post('/manual/upload-image', requireAuth, c => tripController.uploadTripImage(c));
tripRoutes.get('/manual/drafts', requireAuth, c => tripController.getUserDrafts(c));
tripRoutes.post('/:id/publish', requireAuth, c => tripController.publishTrip(c));
tripRoutes.get('/:id', optionalAuth, c => tripController.getStatus(c));
tripRoutes.delete('/:id', requireAuth, c => tripController.deleteTrip(c));

export default tripRoutes;
