import { Hono } from 'hono';
import { followController } from '../controllers/follow.controller';
import { requireAuth } from '../middleware/auth.middleware';

const followRoutes = new Hono();

followRoutes.post('/:userId/follow', requireAuth, c => followController.toggleFollow(c));
followRoutes.get('/:userId/followers', c => followController.getFollowers(c));
followRoutes.get('/:userId/following', c => followController.getFollowing(c));

export default followRoutes;
