import { FastifyInstance } from 'fastify';
import { authenticate, authenticateAny } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { z } from 'zod';



export async function notificationsRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticateAny] };

  // Get all notifications (paginated)
  fastify.get('/', auth, async (request, reply) => {
    const user = request.user as any;
    const { page = '1', limit = '20' } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { OR: [{ parentId: user.id }, { childId: user.id }] },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.notification.count({
        where: { OR: [{ parentId: user.id }, { childId: user.id }] },
      }),
    ]);

    return reply.send({ notifications, total, page: parseInt(page) });
  });

  // Get unread count
  fastify.get('/unread-count', auth, async (request, reply) => {
    const user = request.user as any;
    const count = await prisma.notification.count({
      where: {
        OR: [{ parentId: user.id }, { childId: user.id }],
        isRead: false,
      },
    });
    return reply.send({ count });
  });

  // Mark as read
  fastify.put('/:id/read', auth, async (request, reply) => {
    const user = request.user as any;
    const { id } = request.params as any;
    await prisma.notification.updateMany({
      where: {
        id,
        OR: [{ parentId: user.id }, { childId: user.id }],
      },
      data: { isRead: true },
    });
    return reply.send({ success: true });
  });

  // Mark all as read
  fastify.put('/read-all', auth, async (request, reply) => {
    const user = request.user as any;
    await prisma.notification.updateMany({
      where: {
        OR: [{ parentId: user.id }, { childId: user.id }],
        isRead: false,
      },
      data: { isRead: true },
    });
    return reply.send({ success: true });
  });

  // Get unread child message notifications for parent (battle pass messages)
  fastify.get('/parent-messages', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as any;
    const messages = await prisma.notification.findMany({
      where: {
        parentId: user.id,
        type: 'battle_pass_unlock',
        isRead: false,
      },
      orderBy: { createdAt: 'asc' },
    });
    // Filter to only child_message category
    const childMessages = messages.filter((n) => {
      const d = n.data as any;
      return d?.category === 'child_message';
    });
    return reply.send(childMessages);
  });

  // Register FCM token for parent
  fastify.post('/fcm-token', auth, async (request, reply) => {
    const user = request.user as any;
    const { fcmToken } = z.object({ fcmToken: z.string().min(1) }).parse(request.body);
    await prisma.parent.update({ where: { id: user.id }, data: { fcmToken } });
    console.log(`✅ APNs token saved for parent ${user.id}: ${fcmToken.substring(0, 10)}...`);
    return reply.send({ success: true });
  });

  // Delete notification
  fastify.delete('/:id', auth, async (request, reply) => {
    const user = request.user as any;
    const { id } = request.params as any;
    await prisma.notification.deleteMany({
      where: { id, OR: [{ parentId: user.id }, { childId: user.id }] },
    });
    return reply.status(204).send();
  });
}
