import { Hono } from 'hono';
import { profileController } from '../controllers/profile.controller';
import { optionalAuth } from '../middleware/optional-auth.middleware';

const profileRoutes = new Hono();

// Fetch lightweight trips posted by a specific user profile
profileRoutes.get('/:username/trips', optionalAuth, c => profileController.getProfileTrips(c));

export default profileRoutes;
