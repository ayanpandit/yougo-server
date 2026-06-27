import { tripRepository } from '../repositories/trip.repository';
import { cacheService } from './cache.service';
import { prisma } from '../db/prisma';

export interface FeedTripItem {
  tripId: string;
  coverImage: string | null;
  tripType: string | null;
  destination: string | null;
  totalDays: number | null;
  experienceType: string | null;
  perPersonCost: number | null;
  createdAt: Date | string;
  creator: {
    username: string;
    image: string | null;
  };
  likesCount: number;
  isLiked: boolean;
}

export class FeedService {
  private readonly CACHE_KEY = 'yougo:feed:public';
  private readonly CACHE_TTL = 300; // 5 minutes

  async getFeed(currentUserId?: string): Promise<FeedTripItem[]> {
    // 1. Attempt to fetch public feed from Redis cache
    let feedTrips = await cacheService.get<FeedTripItem[]>(this.CACHE_KEY);

    if (!feedTrips) {
      // 2. Cache Miss: Fetch completed trips from DB (public representation)
      const trips = await tripRepository.findFeedTrips();

      feedTrips = trips.map(trip => ({
        tripId: trip.generationId,
        coverImage: trip.coverImage,
        tripType: trip.tripType,
        destination: trip.destination,
        totalDays: trip.totalDays,
        experienceType: trip.experienceType,
        perPersonCost: trip.perPersonCost,
        createdAt: trip.createdAt,
        creator: {
          username: trip.user.username,
          image: trip.user.image,
        },
        likesCount: trip._count.likes,
        isLiked: false, // Default to false for public cache
      }));

      // 3. Write public feed list to cache
      await cacheService.set(this.CACHE_KEY, feedTrips, this.CACHE_TTL);
    }

    // Defensive check to satisfy TypeScript compiler narrowing
    if (!feedTrips) {
      return [];
    }

    // 4. If current user is authenticated, map personalized like states dynamically in memory
    if (currentUserId && feedTrips.length > 0) {
      try {
        const userLikes = await prisma.tripLike.findMany({
          where: {
            userId: currentUserId,
            trip: {
              generationId: {
                in: feedTrips.map(t => t.tripId),
              },
            },
          },
          select: {
            trip: {
              select: { generationId: true },
            },
          },
        });

        const likedTripIds = new Set(userLikes.map(like => like.trip.generationId));

        return feedTrips.map(trip => ({
          ...trip,
          isLiked: likedTripIds.has(trip.tripId),
        }));
      } catch (err: any) {
        console.error('⚠️ [FeedService] Failed to dynamically map user likes, falling back to public feed:', err.message || err);
        return feedTrips;
      }
    }

    return feedTrips;
  }
}

export const feedService = new FeedService();
