import { prisma } from '../db/prisma';

export class MessageRepository {
  async createMessage(conversationId: string, senderId: string, text: string) {
    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        text,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  async findConversationMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }
}

export const messageRepository = new MessageRepository();
