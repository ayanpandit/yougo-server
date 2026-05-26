import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../db/prisma';

// Memory presence and socket tracking maps
export const onlineUsers = new Set<string>();
const userSockets = new Map<string, Set<string>>();
let ioInstance: SocketIOServer | null = null;

export function getActiveSocketsForUser(userId: string): string[] {
  const sockets = userSockets.get(userId);
  return sockets ? Array.from(sockets) : [];
}

export function broadcastToConversationRoom(conversationId: string, event: string, payload: any) {
  if (ioInstance) {
    ioInstance.to(`chat_${conversationId}`).emit(event, payload);
  }
}

export function initSocketGateway(httpServer: any) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  ioInstance = io;

  // Handshake Connection Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication failed: Token required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (!decoded.userId) {
        return next(new Error('Authentication failed: Invalid payload'));
      }

      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      console.error('[SocketGateway] Authentication error:', err);
      next(new Error('Authentication failed: Token is invalid or expired'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;

    // Presence registration
    onlineUsers.add(userId);
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    console.log(`[SocketGateway] Client connected: user=${userId}, socket=${socket.id}. Active users: ${onlineUsers.size}`);

    // Broadcast online status to all sockets
    io.emit('presence:update', { userId, status: 'online' });

    // 1. Room Subscription Room Routing
    socket.on('room:join', async ({ conversationId }: { conversationId: string }) => {
      try {
        if (!conversationId) return;

        // Security check: Validate conversation membership
        const participant = await prisma.conversationParticipant.findFirst({
          where: { conversationId, userId }
        });

        if (!participant) {
          console.warn(`[SocketGateway] Unauthorized room join attempt by user=${userId} for conversation=${conversationId}`);
          socket.emit('error', { message: 'Unauthorized room join' });
          return;
        }

        const roomName = `chat_${conversationId}`;
        socket.join(roomName);
        console.log(`[SocketGateway] User ${userId} joined room ${roomName}`);
      } catch (err) {
        console.error('[SocketGateway] Error handling room join:', err);
      }
    });

    socket.on('room:leave', ({ conversationId }: { conversationId: string }) => {
      if (!conversationId) return;
      const roomName = `chat_${conversationId}`;
      socket.leave(roomName);
      console.log(`[SocketGateway] User ${userId} left room ${roomName}`);
    });

    // 2. Typing Indicators
    socket.on('typing:start', ({ conversationId }: { conversationId: string }) => {
      if (!conversationId) return;
      socket.to(`chat_${conversationId}`).emit('typing:start', { conversationId, userId });
    });

    socket.on('typing:stop', ({ conversationId }: { conversationId: string }) => {
      if (!conversationId) return;
      socket.to(`chat_${conversationId}`).emit('typing:stop', { conversationId, userId });
    });

    // 3. Seen Receipt Notifications
    socket.on('message:seen', async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      try {
        if (!conversationId || !messageId) return;

        // Security validation
        const participant = await prisma.conversationParticipant.findFirst({
          where: { conversationId, userId }
        });
        if (!participant) return;

        // Update database seen receipt
        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: { seenAt: new Date() },
          include: {
            sender: {
              select: { id: true, username: true, name: true, image: true }
            }
          }
        });

        // Sync seen status back to the message sender's sockets
        socket.to(`chat_${conversationId}`).emit('message:seen:sync', {
          conversationId,
          messageId,
          seenAt: updatedMessage.seenAt
        });
      } catch (err) {
        console.error('[SocketGateway] Error updating seen receipt:', err);
      }
    });

    // 4. WebRTC Signaling engine relay events
    socket.on('call:initiate', async ({ 
      conversationId, 
      targetUserId, 
      type 
    }: { 
      conversationId: string; 
      targetUserId: string; 
      type: 'voice' | 'video' 
    }) => {
      try {
        if (!conversationId || !targetUserId) return;

        // Verify authorized callers
        const isParticipant = await prisma.conversationParticipant.findFirst({
          where: { conversationId, userId }
        });
        if (!isParticipant) return;

        // Check target online sockets
        const targetSocketIds = getActiveSocketsForUser(targetUserId);
        if (targetSocketIds.length === 0) {
          socket.emit('call:failed', { reason: 'User is offline' });
          return;
        }

        // Fetch caller identity
        const caller = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, name: true, image: true }
        });

        // Route call invitation payload to active sockets of target participant
        targetSocketIds.forEach((sid) => {
          io.to(sid).emit('call:invite', {
            conversationId,
            caller,
            type
          });
        });
      } catch (err) {
        console.error('[SocketGateway] Call initiate error:', err);
      }
    });

    socket.on('call:accept', ({ conversationId, callerId }: { conversationId: string; callerId: string }) => {
      const callerSockets = getActiveSocketsForUser(callerId);
      callerSockets.forEach((sid) => {
        io.to(sid).emit('call:accepted', { conversationId, accepterId: userId });
      });
    });

    socket.on('call:reject', ({ conversationId, callerId }: { conversationId: string; callerId: string }) => {
      const callerSockets = getActiveSocketsForUser(callerId);
      callerSockets.forEach((sid) => {
        io.to(sid).emit('call:rejected', { conversationId, rejecterId: userId });
      });
    });

    socket.on('call:signal', ({ 
      targetUserId, 
      signal 
    }: { 
      targetUserId: string; 
      signal: any 
    }) => {
      const targetSockets = getActiveSocketsForUser(targetUserId);
      targetSockets.forEach((sid) => {
        io.to(sid).emit('call:signal', {
          senderUserId: userId,
          signal
        });
      });
    });

    socket.on('call:end', ({ targetUserId, conversationId }: { targetUserId: string; conversationId: string }) => {
      const targetSockets = getActiveSocketsForUser(targetUserId);
      targetSockets.forEach((sid) => {
        io.to(sid).emit('call:ended', { conversationId, endedBy: userId });
      });
    });

    // Handle Disconnections
    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          onlineUsers.delete(userId);
          // Broadcast offline state
          io.emit('presence:update', { userId, status: 'offline' });
        }
      }
      console.log(`[SocketGateway] Client disconnected: socket=${socket.id}. Active users: ${onlineUsers.size}`);
    });
  });

  return io;
}
