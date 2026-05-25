import { prisma } from '../db/prisma';
import { NotFoundError } from '../utils/errors';

export class LikeService {
  async toggleLike(userId: string, generationId: string) {
    // Look up the actual internal trip ID from generationId
    const trip = await prisma.trip.findUnique({
      where: { generationId },
      select: { id: true },
    });

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    const existingLike = await prisma.tripLike.findUnique({
      where: {
        userId_tripId: {
          userId,
          tripId: trip.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.tripLike.delete({
        where: { id: existingLike.id },
      });
    } else {
      // Like
      await prisma.tripLike.create({
        data: {
          userId,
          tripId: trip.id,
        },
      });
    }

    // Get fresh aggregate
    const likesCount = await prisma.tripLike.count({
      where: { tripId: trip.id },
    });

    return {
      isLiked: !existingLike, // If it existed, it's now deleted (unliked), otherwise it was created
      likesCount,
    };
  }
}

export const likeService = new LikeService();
