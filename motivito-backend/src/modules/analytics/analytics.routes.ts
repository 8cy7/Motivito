import { FastifyInstance } from 'fastify';
import { authenticate, requirePremium } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { xpToNextLevel } from '../../utils/gamification';

export async function analyticsRoutes(fastify: FastifyInstance) {
  const premiumAuth = { preHandler: [authenticate, requirePremium] };

  // Overview (أسبوعي)
  fastify.get('/:childId/overview', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
      select: { id: true, name: true, level: true, xp: true, stars: true, totalStars: true, gender: true },
    });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tasks = await prisma.task.findMany({
      where: { childId, parentId: user.id, createdAt: { gte: weekAgo } },
    });

    const completed = tasks.filter((t) => t.approvalStatus === 'approved').length;
    const pending = tasks.filter((t) => t.approvalStatus === 'pending' && !t.isCompleted).length;
    const rejected = tasks.filter((t) => t.approvalStatus === 'rejected').length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return reply.send({
      child,
      weeklyStats: {
        total: tasks.length,
        completed,
        pending,
        rejected,
        completionRate,
        pointsEarned: tasks.filter((t) => t.approvalStatus === 'approved').reduce((sum, t) => sum + t.points, 0),
      },
      levelProgress: {
        current: child.level,
        xp: child.xp,
        xpToNext: xpToNextLevel(child.level),
        percentage: Math.round((child.xp / xpToNextLevel(child.level)) * 100),
      },
    });
  });

  // Daily pattern
  fastify.get('/:childId/daily-pattern', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({ where: { id: childId, parentId: user.id } });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tasks = await prisma.task.findMany({
      where: { childId, approvalStatus: 'approved', approvedAt: { gte: monthAgo } },
      select: { approvedAt: true },
    });

    // Group by day of week
    const dayPattern = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      count: tasks.filter((t) => t.approvedAt && new Date(t.approvedAt).getDay() === i).length,
    }));

    return reply.send({ dayPattern });
  });

  // Task preferences
  fastify.get('/:childId/task-preferences', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({ where: { id: childId, parentId: user.id } });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const tasks = await prisma.task.groupBy({
      by: ['difficulty'],
      where: { childId, approvalStatus: 'approved' },
      _count: { id: true },
    });

    return reply.send({ difficultyBreakdown: tasks });
  });

  // Level prediction
  fastify.get('/:childId/level-prediction', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
      select: { level: true, xp: true },
    });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyXP = await prisma.task.aggregate({
      where: { childId, approvalStatus: 'approved', approvedAt: { gte: weekAgo } },
      _sum: { points: true },
    });

    const avgDailyXP = (weeklyXP._sum.points || 0) / 7;
    const xpNeeded = xpToNextLevel(child.level) - child.xp;
    const daysToNextLevel = avgDailyXP > 0 ? Math.ceil(xpNeeded / avgDailyXP) : null;

    return reply.send({
      currentLevel: child.level,
      currentXP: child.xp,
      xpToNext: xpToNextLevel(child.level),
      avgDailyXP: Math.round(avgDailyXP),
      daysToNextLevel,
    });
  });

  // Monthly trend
  fastify.get('/:childId/monthly-trend', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({ where: { id: childId, parentId: user.id } });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);

      const count = await prisma.task.count({
        where: { childId, approvalStatus: 'approved', approvedAt: { gte: start, lt: end } },
      });
      weeks.push({ week: 4 - i, completedTasks: count });
    }

    return reply.send({ weeks });
  });

  // Badge progress
  fastify.get('/:childId/badge-progress', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
      include: { badges: true },
    });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    return reply.send({
      currentLevel: child.level,
      earnedBadges: child.badges,
      totalBadges: child.badges.length,
    });
  });

  // Streak
  fastify.get('/:childId/streak', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const { childId } = request.params as any;

    const child = await prisma.child.findFirst({ where: { id: childId, parentId: user.id } });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    // Get last 30 days of approved tasks
    const tasks = await prisma.task.findMany({
      where: {
        childId,
        approvalStatus: 'approved',
        approvedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { approvedAt: true },
      orderBy: { approvedAt: 'desc' },
    });

    // Calculate consecutive days
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const hasTask = tasks.some((t) => {
        if (!t.approvedAt) return false;
        const d = new Date(t.approvedAt);
        return d >= day && d < nextDay;
      });
      if (hasTask) streak++;
      else if (i > 0) break;
    }

    return reply.send({ streak });
  });

  // Compare siblings
  fastify.get('/compare', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const children = await prisma.child.findMany({
      where: { parentId: user.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        color: true,
        level: true,
        stars: true,
        totalStars: true,
        _count: { select: { badges: true } },
      },
      orderBy: { level: 'desc' },
    });
    return reply.send(children);
  });

  // Rankings
  fastify.get('/rankings', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const children = await prisma.child.findMany({
      where: { parentId: user.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        color: true,
        level: true,
        totalStars: true,
      },
      orderBy: [{ level: 'desc' }, { totalStars: 'desc' }],
    });
    return reply.send(children.map((c, i) => ({ ...c, rank: i + 1 })));
  });
}
