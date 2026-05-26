import { Hono } from 'hono';
import { conversationController } from '../controllers/conversation.controller';
import { requireAuth } from '../middleware/auth.middleware';

const conversationRoutes = new Hono();

// Apply requireAuth middleware globally to all conversation endpoints
conversationRoutes.use('/*', requireAuth);

conversationRoutes.post('/direct/:userId', c => conversationController.getOrCreateDirectConversation(c));
conversationRoutes.get('/', c => conversationController.getUserConversations(c));
conversationRoutes.post('/media/upload', c => conversationController.uploadMedia(c));
conversationRoutes.get('/:conversationId/messages', c => conversationController.getConversationMessages(c));
conversationRoutes.post('/:conversationId/messages', c => conversationController.sendMessage(c));

export default conversationRoutes;
