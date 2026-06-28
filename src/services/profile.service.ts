import { tripRepository } from '../repositories/trip.repository';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '../db/prisma';
import { cacheService } from './cache.service';

export interface ProfileTripItem {
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

export interface ProfileData {
  user: any;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export class ProfileService {
  private readonly PROFILE_TTL = 3600; // 1 hour for profiles

  async getProfileTrips(username: string, currentUserId?: string): Promise<ProfileTripItem[] | null> {
    const cacheKey = `yougo:profile:${username.toLowerCase()}:trips`;
    let tripsList = await cacheService.get<ProfileTripItem[]>(cacheKey);

    if (!tripsList) {
      const user = await userRepository.findByUsername(username);
      if (!user) {
        return null;
      }

      const trips = await tripRepository.findFeedTripsByUserId(user.id, currentUserId);
      tripsList = trips.map(trip => ({
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
        isLiked: false,
      }));

      await cacheService.set(cacheKey, tripsList, this.PROFILE_TTL);
    }

    // Defensive check to satisfy TypeScript compiler narrowing
    if (!tripsList) {
      return null;
    }

    if (currentUserId && tripsList.length > 0) {
      try {
        const userLikes = await prisma.tripLike.findMany({
          where: {
            userId: currentUserId,
            trip: {
              generationId: {
                in: tripsList.map(t => t.tripId),
              },
            },
          },
          select: {
            trip: { select: { generationId: true } },
          },
        });

        const likedTripIds = new Set(userLikes.map(like => like.trip.generationId));
        return tripsList.map(trip => ({
          ...trip,
          isLiked: likedTripIds.has(trip.tripId),
        }));
      } catch (err: any) {
        console.error('⚠️ [ProfileService] Failed to dynamically map likes for profile trips, returning public fallback:', err.message || err);
        return tripsList;
      }
    }

    return tripsList;
  }

  async getProfile(username: string, currentUserId?: string): Promise<ProfileData | null> {
    const cacheKey = `yougo:profile:${username.toLowerCase()}`;
    let profile = await cacheService.get<ProfileData>(cacheKey);

    if (!profile) {
      const user = await userRepository.findByUsername(username);
      if (!user) {
        return null;
      }

      const { passwordHash: _, emailVerificationToken: __, passwordResetToken: ___, ...safeUser } = user;

      const [followersCount, followingCount] = await Promise.all([
        prisma.follow.count({ where: { followingId: user.id } }),
        prisma.follow.count({ where: { followerId: user.id } }),
      ]);

      profile = {
        user: safeUser,
        followersCount,
        followingCount,
        isFollowing: false,
      };

      await cacheService.set(cacheKey, profile, this.PROFILE_TTL);
    }

    if (currentUserId && currentUserId !== profile.user.id) {
      try {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: profile.user.id,
            },
          },
        });
        return {
          ...profile,
          isFollowing: !!follow,
        };
      } catch (err: any) {
        console.error('⚠️ [ProfileService] Failed to dynamically map isFollowing, returning public fallback:', err.message || err);
        return profile;
      }
    }

    return profile;
  }
}

export const profileService = new ProfileService();
