import { prisma } from '../db/prisma';

export class ConversationRepository {
  async findDirectConversation(userAId: string, userBId: string) {
    const directKey = [userAId, userBId].sort().join('_');
    return prisma.conversation.findUnique({
      where: { directKey },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  async createDirectConversation(userAId: string, userBId: string) {
    const directKey = [userAId, userBId].sort().join('_');
    try {
      return await prisma.conversation.create({
        data: {
          directKey,
          participants: {
            create: [
              { userId: userAId },
              { userId: userBId },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });
    } catch (error: any) {
      // Handle unique constraint race condition gracefully by returning the existing conversation
      if (error.code === 'P2002') {
        const existing = await this.findDirectConversation(userAId, userBId);
        if (existing) return existing;
      }
      throw error;
    }
  }

  async findUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const count = await prisma.conversationParticipant.count({
      where: {
        conversationId,
        userId,
      },
    });
    return count > 0;
  }

  async updateConversationTimestamp(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }
}

export const conversationRepository = new ConversationRepository();
