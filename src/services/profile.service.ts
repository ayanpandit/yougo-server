import { tripRepository } from '../repositories/trip.repository';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '../db/prisma';

export class ProfileService {
  async getProfileTrips(username: string, currentUserId?: string) {
    const user = await userRepository.findByUsername(username);
    
    if (!user) {
      return null; // Signals to controller that user was not found
    }

    const trips = await tripRepository.findFeedTripsByUserId(user.id, currentUserId);

    return trips.map(trip => ({
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
      isLiked: currentUserId ? (trip as any).likes?.length > 0 : false,
    }));
  }

  async getProfile(username: string, currentUserId?: string) {
    const user = await userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

    const { passwordHash: _, emailVerificationToken: __, passwordResetToken: ___, ...safeUser } = user;

    // Get followers/following count using Prisma
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      user: safeUser,
      followersCount,
      followingCount,
      isFollowing,
    };
  }
}

export const profileService = new ProfileService();
