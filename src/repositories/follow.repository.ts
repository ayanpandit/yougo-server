import { prisma } from '../db/prisma';

export class FollowRepository {
  async findUnique(followerId: string, followingId: string) {
    return prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async create(followerId: string, followingId: string) {
    return prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async delete(id: string) {
    return prisma.follow.delete({
      where: { id },
    });
  }

  async getFollowers(userId: string) {
    return prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          }
        }
      }
    });
  }

  async getFollowing(userId: string) {
    return prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          }
        }
      }
    });
  }
}

export const followRepository = new FollowRepository();
