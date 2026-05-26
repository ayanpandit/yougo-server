import { Context } from 'hono';
import { conversationService } from '../services/conversation.service';
import { BadRequestError } from '../utils/errors';

export class ConversationController {
  async getOrCreateDirectConversation(c: Context) {
    const user = c.get('user');
    const targetUserId = c.req.param('userId');

    if (!targetUserId) {
      throw new BadRequestError('Target user ID is required');
    }

    const result = await conversationService.getOrCreateDirectConversation(user.id, targetUserId);

    return c.json({
      status: 'success',
      data: result,
    });
  }

  async getUserConversations(c: Context) {
    const user = c.get('user');
    const result = await conversationService.getUserConversations(user.id);

    return c.json({
      status: 'success',
      data: result,
    });
  }

  async getConversationMessages(c: Context) {
    const user = c.get('user');
    const conversationId = c.req.param('conversationId');

    if (!conversationId) {
      throw new BadRequestError('Conversation ID is required');
    }

    const limitQuery = c.req.query('limit');
    const offsetQuery = c.req.query('offset');

    const limit = limitQuery ? parseInt(limitQuery, 10) : 50;
    const offset = offsetQuery ? parseInt(offsetQuery, 10) : 0;

    const result = await conversationService.getConversationMessages(
      conversationId,
      user.id,
      isNaN(limit) ? 50 : limit,
      isNaN(offset) ? 0 : offset
    );

    return c.json({
      status: 'success',
      data: result,
    });
  }

  async sendMessage(c: Context) {
    const user = c.get('user');
    const conversationId = c.req.param('conversationId');

    if (!conversationId) {
      throw new BadRequestError('Conversation ID is required');
    }

    const body = await c.req.json().catch(() => ({}));
    const { text } = body;

    if (!text || typeof text !== 'string') {
      throw new BadRequestError('Message text is required and must be a string');
    }

    const result = await conversationService.sendMessage(conversationId, user.id, text);

    return c.json({
      status: 'success',
      data: result,
    });
  }
}

export const conversationController = new ConversationController();
