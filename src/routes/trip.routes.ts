import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware';
import { tripController } from '../controllers/trip.controller';

const tripRoutes = new Hono();

// Both routes are protected by JWT/session validation middleware
tripRoutes.post('/', requireAuth, c => tripController.generate(c));
tripRoutes.post('/manual', requireAuth, c => tripController.createManual(c));
tripRoutes.post('/manual/upload-image', requireAuth, c => tripController.uploadTripImage(c));
tripRoutes.get('/manual/drafts', requireAuth, c => tripController.getUserDrafts(c));
tripRoutes.get('/:id', requireAuth, c => tripController.getStatus(c));

export default tripRoutes;
