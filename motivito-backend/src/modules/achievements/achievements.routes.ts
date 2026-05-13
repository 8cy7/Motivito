import { FastifyInstance } from 'fastify';
import { authenticate, requirePremium } from '../../middleware/auth.middleware';
import prisma from '../../config/database';

export async function achievementsRoutes(fastify: FastifyInstance) {
  const premiumAuth = { preHandler: [authenticate, requirePremium] };

  // All achievements for a child
  fastify.get('/:childId', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
      include: {
        badges: { orderBy: { earnedDate: 'desc' } },
        battlePassUnlocks: { orderBy: { level: 'asc' } },
        _count: { select: { tasks: { where: { approvalStatus: 'approved' } } } },
      },
    });

    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    return reply.send(child);
  });

  // Badges only
  fastify.get('/:childId/badges', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
    });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const badges = await prisma.badge.findMany({
      where: { childId },
      orderBy: { earnedDate: 'desc' },
    });

    return reply.send(badges);
  });
}
