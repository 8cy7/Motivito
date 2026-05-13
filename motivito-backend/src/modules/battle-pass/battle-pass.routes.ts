import { FastifyInstance } from 'fastify';
import { authenticate, authenticateChild, requirePremium } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { getBattlePassProgress } from '../../utils/gamification';

export async function battlePassRoutes(fastify: FastifyInstance) {
  const premiumAuth = { preHandler: [authenticate, requirePremium] };
  const childAuth = { preHandler: [authenticateChild] };

  // Child: get own claimed battle pass levels
  fastify.get('/my-unlocks', childAuth, async (request, reply) => {
    const user = request.user as any;
    const unlocks = await prisma.battlePassUnlock.findMany({
      where: { childId: user.id },
      select: { level: true },
      orderBy: { level: 'asc' },
    });
    return reply.send({ claimedLevels: unlocks.map((u) => u.level) });
  });

  // Child: claim a battle pass reward
  fastify.post('/claim', childAuth, async (request, reply) => {
    const user = request.user as any;
    const { level } = request.body as { level: number };

    const child = await prisma.child.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, level: true, gender: true, parentId: true, unlockedEmojis: true },
    });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });
    if (child.level < level) return reply.status(400).send({ error: 'المستوى غير مكتمل بعد' });

    const allRewards = getBattlePassProgress(child.gender as 'boy' | 'girl');
    const reward = allRewards.find((r) => r.level === level);
    if (!reward) return reply.status(404).send({ error: 'المكافأة غير موجودة' });

    // Upsert to avoid duplicate claims
    const existing = await prisma.battlePassUnlock.findUnique({
      where: { childId_level: { childId: child.id, level } },
    });
    if (existing) return reply.send({ success: true, alreadyClaimed: true, unlockedEmojis: child.unlockedEmojis });

    await prisma.battlePassUnlock.create({
      data: {
        childId: child.id,
        level,
        rewardType: reward.type,
        rewardData: reward.data as any,
      },
    });

    let updatedEmojis = child.unlockedEmojis;

    // Emoji reward: unlock in child profile
    if (reward.type === 'emoji') {
      const emojiData = reward.data as { emoji: string; name: string };
      if (!updatedEmojis.includes(emojiData.emoji)) {
        updatedEmojis = [...updatedEmojis, emojiData.emoji];
        await prisma.child.update({
          where: { id: child.id },
          data: { unlockedEmojis: updatedEmojis },
        });
      }
    }

    // Message reward: queue notification for parent
    if (reward.type === 'message') {
      const msgData = reward.data as { text: string };
      await prisma.notification.create({
        data: {
          parentId: child.parentId,
          type: 'battle_pass_unlock',
          title: `رسالة من ${child.name} 💌`,
          body: msgData.text,
          data: { category: 'child_message', childName: child.name, text: msgData.text, level },
          isRead: false,
        },
      });
    }

    return reply.send({ success: true, unlockedEmojis: updatedEmojis });
  });

  // Get full battle pass status for a child
  fastify.get('/:childId', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
      include: { battlePassUnlocks: { orderBy: { level: 'asc' } } },
    });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const allRewards = getBattlePassProgress(child.gender);
    const unlockedLevels = new Set(child.battlePassUnlocks.map((u) => u.level));

    const battlePass = allRewards.map((reward) => ({
      level: reward.level,
      type: reward.type,
      data: reward.data,
      isUnlocked: unlockedLevels.has(reward.level),
      isReachable: child.level >= reward.level,
    }));

    return reply.send({
      child: { id: child.id, name: child.name, level: child.level },
      battlePass,
      totalUnlocked: child.battlePassUnlocks.length,
    });
  });

  // Get only unlocked rewards
  fastify.get('/:childId/unlocks', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
    });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const unlocks = await prisma.battlePassUnlock.findMany({
      where: { childId },
      orderBy: { level: 'asc' },
    });

    return reply.send(unlocks);
  });
}
