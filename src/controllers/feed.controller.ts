import { Context } from 'hono';
import { feedService } from '../services/feed.service';

export class FeedController {
  async getFeed(c: Context) {
    const feed = await feedService.getFeed();

    return c.json({
      status: 'success',
      data: feed,
    });
  }
}

export const feedController = new FeedController();
