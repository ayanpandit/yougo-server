import { Hono } from 'hono';
import { likeController } from '../controllers/like.controller';
import { requireAuth } from '../middleware/auth.middleware';

const likeRoutes = new Hono();

likeRoutes.post('/:generationId/like', requireAuth, c => likeController.toggleLike(c));
likeRoutes.get('/:generationId/likes', c => likeController.getTripLikes(c));

export default likeRoutes;
