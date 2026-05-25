import { followRepository } from '../repositories/follow.repository';
import { userRepository } from '../repositories/user.repository';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { prisma } from '../db/prisma';

export class FollowService {
  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestError('You cannot follow yourself');
    }

    const followingUser = await userRepository.findById(followingId);
    if (!followingUser) {
      throw new NotFoundError('User to follow not found');
    }

    const existingFollow = await followRepository.findUnique(followerId, followingId);

    let isFollowing = false;

    if (existingFollow) {
      await followRepository.delete(existingFollow.id);
      isFollowing = false;
    } else {
      await followRepository.create(followerId, followingId);
      isFollowing = true;
    }

    const followersCount = await prisma.follow.count({
      where: { followingId },
    });

    return {
      following: isFollowing,
      followersCount,
    };
  }

  async getFollowers(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const followers = await followRepository.getFollowers(userId);
    return followers.map((f) => f.follower);
  }

  async getFollowing(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const following = await followRepository.getFollowing(userId);
    return following.map((f) => f.following);
  }
}

export const followService = new FollowService();
