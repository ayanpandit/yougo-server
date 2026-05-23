import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware';
import { tripController } from '../controllers/trip.controller';

const tripRoutes = new Hono();

// Both routes are protected by JWT/session validation middleware
tripRoutes.post('/', requireAuth, c => tripController.generate(c));
tripRoutes.get('/:id', requireAuth, c => tripController.getStatus(c));

export default tripRoutes;
