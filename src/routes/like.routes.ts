import { Hono } from 'hono';
import { likeController } from '../controllers/like.controller';
import { requireAuth } from '../middleware/auth.middleware';

const likeRoutes = new Hono();

likeRoutes.post('/:generationId/like', requireAuth, c => likeController.toggleLike(c));

export default likeRoutes;
