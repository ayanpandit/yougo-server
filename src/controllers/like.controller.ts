import { Context } from 'hono';
import { likeService } from '../services/like.service';
import { UnauthorizedError } from '../utils/errors';

export class LikeController {
  async toggleLike(c: Context) {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('You must be logged in to like a trip.');
    }

    const generationId = c.req.param('generationId');
    if (!generationId) {
      throw new UnauthorizedError('Generation ID is required.');
    }

    const result = await likeService.toggleLike(user.id, generationId);

    return c.json({
      status: 'success',
      data: result,
    });
  }

  async getTripLikes(c: Context) {
    const generationId = c.req.param('generationId');
    if (!generationId) {
      throw new UnauthorizedError('Generation ID is required.');
    }

    const likes = await likeService.getTripLikes(generationId);

    return c.json({
      status: 'success',
      data: likes,
    });
  }
}

export const likeController = new LikeController();
