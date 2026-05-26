import { Context } from 'hono';
import { conversationService } from '../services/conversation.service';
import { BadRequestError } from '../utils/errors';
import { cloudinaryService } from '../services/cloudinary.service';

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
    const { text, type, mediaUrl, mediaPublicId } = body;

    const messageType = type || 'TEXT';

    if (messageType === 'TEXT' && (!text || typeof text !== 'string')) {
      throw new BadRequestError('Message text is required and must be a string for TEXT messages');
    }

    const result = await conversationService.sendMessage(
      conversationId,
      user.id,
      text,
      messageType,
      mediaUrl,
      mediaPublicId
    );

    return c.json({
      status: 'success',
      data: result,
    });
  }

  async uploadMedia(c: Context) {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!file || !(file instanceof File)) {
      throw new BadRequestError('No media file provided');
    }

    // Determine type and validate size
    let messageType = 'FILE';
    const mimeType = file.type;
    const size = file.size;

    if (mimeType.startsWith('image/')) {
      messageType = 'IMAGE';
      if (size > 10 * 1024 * 1024) {
        throw new BadRequestError('Image size cannot exceed 10MB');
      }
    } else if (mimeType.startsWith('video/')) {
      messageType = 'VIDEO';
      if (size > 50 * 1024 * 1024) {
        throw new BadRequestError('Video size cannot exceed 50MB');
      }
    } else if (mimeType.startsWith('audio/')) {
      messageType = 'AUDIO';
      if (size > 10 * 1024 * 1024) {
        throw new BadRequestError('Audio size cannot exceed 10MB');
      }
    } else {
      // General doc files
      if (size > 50 * 1024 * 1024) {
        throw new BadRequestError('File size cannot exceed 50MB');
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await cloudinaryService.uploadFile(buffer, mimeType, 'yougo_chat_media');

    return c.json({
      status: 'success',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        type: messageType,
        fileName: file.name
      }
    });
  }
}

export const conversationController = new ConversationController();
