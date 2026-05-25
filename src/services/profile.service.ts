import { tripRepository } from '../repositories/trip.repository';
import { userRepository } from '../repositories/user.repository';

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
}

export const profileService = new ProfileService();
