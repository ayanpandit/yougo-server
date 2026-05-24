import { prisma } from '../db/prisma';

export class TripRepository {
  async findFeedTrips() {
    return prisma.trip.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: {
        id: true,
        generationId: true,
        coverImage: true,
        tripType: true,
        destination: true,
        totalDays: true,
        experienceType: true,
        perPersonCost: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const tripRepository = new TripRepository();
