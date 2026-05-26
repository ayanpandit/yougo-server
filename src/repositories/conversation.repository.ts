import { prisma } from '../db/prisma';

export class ConversationRepository {
  async findDirectConversation(userAId: string, userBId: string) {
    // Finds a conversation containing both participants, with exactly 2 participants total.
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: userAId },
        },
        AND: {
          participants: {
            some: { userId: userBId },
          },
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

    // Filter to ensure it is strictly 1-to-1 (exactly 2 participants)
    return conversations.find((c) => c.participants.length === 2) || null;
  }

  async createDirectConversation(userAId: string, userBId: string) {
    return prisma.conversation.create({
      data: {
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
