import { Hono } from 'hono';
import { feedController } from '../controllers/feed.controller';

const feedRoutes = new Hono();

// Discovery feed is a public API endpoint to support highly scalable platform loading
feedRoutes.get('/', c => feedController.getFeed(c));

export default feedRoutes;
