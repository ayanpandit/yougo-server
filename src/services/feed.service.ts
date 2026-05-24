import { tripRepository } from '../repositories/trip.repository';

export class FeedService {
  async getFeed() {
    const trips = await tripRepository.findFeedTrips();

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
    }));
  }
}

export const feedService = new FeedService();
