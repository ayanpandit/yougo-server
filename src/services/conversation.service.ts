import { conversationRepository } from '../repositories/conversation.repository';
import { messageRepository } from '../repositories/message.repository';
import { userRepository } from '../repositories/user.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';

export class ConversationService {
  async getOrCreateDirectConversation(senderId: string, targetUserId: string) {
    if (senderId === targetUserId) {
      throw new BadRequestError('You cannot message yourself');
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    // Try to find existing 1-to-1 conversation
    let conversation = await conversationRepository.findDirectConversation(senderId, targetUserId);

    if (!conversation) {
      // Create new direct conversation if not exists
      conversation = await conversationRepository.createDirectConversation(senderId, targetUserId);
    }

    // Format the response preview
    const otherParticipant = conversation.participants.find((p) => p.userId === targetUserId)?.user;

    return {
      conversationId: conversation.id,
      participant: otherParticipant || null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  async getUserConversations(userId: string) {
    const conversations = await conversationRepository.findUserConversations(userId);

    return conversations.map((conv) => {
      // Find the other participant in the 1-to-1 conversation
      const otherParticipant = conv.participants.find((p) => p.userId !== userId)?.user;
      const latestMessage = conv.messages[0] || null;

      return {
        conversationId: conv.id,
        updatedAt: conv.updatedAt,
        participant: otherParticipant || {
          id: 'deleted',
          username: 'deleted_user',
          name: 'Deleted User',
          image: null,
        },
        lastMessage: latestMessage
          ? {
              id: latestMessage.id,
              text: latestMessage.text,
              createdAt: latestMessage.createdAt,
              senderId: latestMessage.senderId,
            }
          : null,
      };
    });
  }

  async getConversationMessages(conversationId: string, userId: string, limit: number = 50, offset: number = 0) {
    // Security check: must be a participant of the conversation
    const isParticipant = await conversationRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenError('You do not have access to this conversation');
    }

    const messages = await messageRepository.findConversationMessages(conversationId, limit, offset);

    // DMs typically display chronologically (oldest to newest), but repositories return newest first for efficient pagination.
    // The client or layout can reverse them, but returning them sorted chronologically (asc) within this paginated set is standard.
    // Let's reverse the slice in the service so the paginated batch is chronological.
    return [...messages].reverse();
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    const sanitizedText = text.trim();
    if (!sanitizedText) {
      throw new BadRequestError('Message text cannot be empty');
    }

    // Security check: sender must be a participant of the conversation
    const isParticipant = await conversationRepository.isParticipant(conversationId, senderId);
    if (!isParticipant) {
      throw new ForbiddenError('You do not have permission to send messages to this conversation');
    }

    const message = await messageRepository.createMessage(conversationId, senderId, sanitizedText);

    // Update conversation updatedAt timestamp to bump it to the top of list
    await conversationRepository.updateConversationTimestamp(conversationId);

    return {
      messageId: message.id,
      text: message.text,
      createdAt: message.createdAt,
      sender: message.sender,
    };
  }
}

export const conversationService = new ConversationService();
