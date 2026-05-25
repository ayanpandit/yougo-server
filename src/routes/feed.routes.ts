import { Hono } from 'hono';
import { feedController } from '../controllers/feed.controller';
import { optionalAuth } from '../middleware/optional-auth.middleware';

const feedRoutes = new Hono();

// Discovery feed is a public API endpoint to support highly scalable platform loading
feedRoutes.get('/', optionalAuth, c => feedController.getFeed(c));

export default feedRoutes;
