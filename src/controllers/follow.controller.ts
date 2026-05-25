import { Context } from 'hono';
import { followService } from '../services/follow.service';
import { BadRequestError } from '../utils/errors';

export class FollowController {
  async toggleFollow(c: Context) {
    const user = c.get('user');
    const followingId = c.req.param('userId');

    if (!followingId) {
      throw new BadRequestError('User ID is required');
    }

    const result = await followService.toggleFollow(user.id, followingId);

    return c.json({
      status: 'success',
      data: result,
    });
  }

  async getFollowers(c: Context) {
    const userId = c.req.param('userId');

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const followers = await followService.getFollowers(userId);

    return c.json({
      status: 'success',
      data: followers,
    });
  }

  async getFollowing(c: Context) {
    const userId = c.req.param('userId');

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const following = await followService.getFollowing(userId);

    return c.json({
      status: 'success',
      data: following,
    });
  }
}

export const followController = new FollowController();
