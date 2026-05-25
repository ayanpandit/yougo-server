import { prisma } from '../db/prisma';

export class TripRepository {
  async findFeedTrips(currentUserId?: string) {
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
        _count: {
          select: { likes: true }
        },
        ...(currentUserId ? {
          likes: {
            where: { userId: currentUserId }
          }
        } : {})
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async findFeedTripsByUserId(userId: string, currentUserId?: string) {
    return prisma.trip.findMany({
      where: {
        userId,
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
        _count: {
          select: { likes: true }
        },
        ...(currentUserId ? {
          likes: {
            where: { userId: currentUserId }
          }
        } : {})
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const tripRepository = new TripRepository();
