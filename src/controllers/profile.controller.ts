import { Context } from 'hono';
import { profileService } from '../services/profile.service';
import { HTTPException } from 'hono/http-exception';

export class ProfileController {
  async getProfileTrips(c: Context) {
    const username = c.req.param('username');
    
    if (!username) {
      throw new HTTPException(400, { message: 'Username is required' });
    }

    const user = c.get('user');
    const trips = await profileService.getProfileTrips(username, user?.id);

    if (trips === null) {
      throw new HTTPException(404, { message: 'Profile not found' });
    }

    return c.json({
      status: 'success',
      data: trips,
    });
  }

  async getProfile(c: Context) {
    const username = c.req.param('username');
    
    if (!username) {
      throw new HTTPException(400, { message: 'Username is required' });
    }

    const user = c.get('user');
    const profile = await profileService.getProfile(username, user?.id);

    if (profile === null) {
      throw new HTTPException(404, { message: 'Profile not found' });
    }

    return c.json({
      status: 'success',
      data: profile,
    });
  }
}

export const profileController = new ProfileController();
