import prisma from '../../config/database';
import { calculateLevel, checkNewBadges, checkBattlePass } from '../../utils/gamification';
import { sendNotificationToParent, sendNotificationToChild } from '../../utils/notifications';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  CompleteTaskInput,
  RejectTaskInput,
  BulkCreateTasksInput,
} from './tasks.schema';

// =============================================
// Get tasks for a child
// =============================================
export async function getTasks(parentId: string, childId: string) {
  // Verify child belongs to parent
  const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  return prisma.task.findMany({
    where: { childId, parentId, isActive: true },
    orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
  });
}

// =============================================
// Get tasks for the authenticated child (child JWT)
// =============================================
export async function getChildTasks(childId: string) {
  return prisma.task.findMany({
    where: { childId, isActive: true },
    orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
  });
}

// =============================================
// Get task detail
// =============================================
export async function getTask(taskId: string, parentId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, parentId } });
  if (!task) throw { statusCode: 404, message: 'المهمة غير موجودة' };
  return task;
}

// =============================================
// Create task (parent)
// =============================================
export async function createTask(parentId: string, data: CreateTaskInput) {
  const child = await prisma.child.findFirst({ where: { id: data.childId, parentId } });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  const task = await prisma.task.create({
    data: {
      childId: data.childId,
      parentId,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      points: data.points,
      category: data.category,
      frequency: data.frequency,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  // إشعار للطفل بمهمة جديدة
  await sendNotificationToChild('task_assigned', child.id, {
    gender: child.gender,
    taskTitle: task.title,
    taskId: task.id,
  });

  return task;
}

// =============================================
// Bulk create tasks
// =============================================
export async function bulkCreateTasks(parentId: string, data: BulkCreateTasksInput) {
  // Verify all children belong to this parent
  const childIds = [...new Set(data.tasks.map((t) => t.childId))];
  const children = await prisma.child.findMany({
    where: { id: { in: childIds }, parentId },
  });
  if (children.length !== childIds.length) {
    throw { statusCode: 404, message: 'بعض الأطفال غير موجودين' };
  }

  const tasks = await prisma.$transaction(
    data.tasks.map((t) =>
      prisma.task.create({
        data: {
          childId: t.childId,
          parentId,
          title: t.title,
          description: t.description,
          difficulty: t.difficulty,
          points: t.points,
          category: t.category,
          frequency: t.frequency,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
        },
      })
    )
  );

  // إشعار لكل طفل بمهامه الجديدة
  for (const task of tasks) {
    const child = children.find((c) => c.id === task.childId);
    if (child) {
      await sendNotificationToChild('task_assigned', child.id, {
        gender: child.gender,
        taskTitle: task.title,
        taskId: task.id,
      });
    }
  }

  return tasks;
}

// =============================================
// Update task
// =============================================
export async function updateTask(taskId: string, parentId: string, data: UpdateTaskInput) {
  await verifyTaskOwnership(taskId, parentId);
  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
}

// =============================================
// Delete task
// =============================================
export async function deleteTask(taskId: string, parentId: string) {
  await verifyTaskOwnership(taskId, parentId);
  await prisma.task.delete({ where: { id: taskId } });
}

// =============================================
// Child completes a task (→ awaiting approval)
// =============================================
export async function completeTask(taskId: string, childId: string, data: CompleteTaskInput) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, childId, isActive: true },
  });
  if (!task) throw { statusCode: 404, message: 'المهمة غير موجودة' };
  if (task.isCompleted) throw { statusCode: 400, message: 'المهمة مكتملة مسبقاً' };

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      approvalStatus: 'completed',
      timeSpent: data.timeSpent,
    },
  });

  // Get child info for notification
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { name: true, parentId: true, gender: true },
  });
  if (child) {
    await sendNotificationToParent('task_completed', child.parentId, {
      childName: child.name,
      gender: child.gender,
      taskTitle: task.title,
      taskId,
    });
  }

  return updated;
}

// =============================================
// Parent approves task → grant XP + stars
// =============================================
export async function approveTask(taskId: string, parentId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, parentId },
  });
  if (!task) throw { statusCode: 404, message: 'المهمة غير موجودة' };
  if (task.approvalStatus !== 'completed') {
    throw { statusCode: 400, message: 'المهمة غير جاهزة للمراجعة' };
  }

  const child = await prisma.child.findUnique({ where: { id: task.childId } });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  // Calculate new XP and stars
  const newStars = child.stars + task.points;
  const newTotalStars = child.totalStars + task.points;
  const { level: newLevel, xp: newXP } = calculateLevel(
    child.xp + task.points,
    child.level
  );

  // Check for new badges and battle pass unlocks
  const newBadges = checkNewBadges(child.level, newLevel, child.gender);
  const newBattlePassUnlocks = checkBattlePass(child.level, newLevel, child.gender);

  // Execute all updates in a transaction
  await prisma.$transaction([
    prisma.child.update({
      where: { id: child.id },
      data: { level: newLevel, xp: newXP, stars: newStars, totalStars: newTotalStars },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { approvalStatus: 'approved', approvedAt: new Date() },
    }),
    ...newBadges.map((b) =>
      prisma.badge.create({
        data: { childId: child.id, level: b.level, emoji: b.emoji, color: b.color },
      })
    ),
    ...newBattlePassUnlocks.map((u) =>
      prisma.battlePassUnlock.create({
        data: {
          childId: child.id,
          level: u.level,
          rewardType: u.rewardType,
          rewardData: u.rewardData,
        },
      })
    ),
  ]);

  // Send notifications
  await sendNotificationToChild('task_approved', child.id, {
    taskTitle: task.title,
    points: task.points,
    taskId,
  });

  if (newLevel > child.level) {
    await sendNotificationToChild('level_up', child.id, { level: newLevel });
    await sendNotificationToParent('level_up', parentId, {
      childName: child.name,
      level: newLevel,
    });
  }

  for (const badge of newBadges) {
    await sendNotificationToChild('badge_earned', child.id, badge);
  }

  for (const unlock of newBattlePassUnlocks) {
    await sendNotificationToChild('battle_pass_unlock', child.id, unlock);
  }

  return {
    approved: true,
    pointsEarned: task.points,
    newLevel,
    newXP,
    newStars,
    leveledUp: newLevel > child.level,
    newBadges,
    newBattlePassUnlocks,
  };
}

// =============================================
// Parent rejects task
// =============================================
export async function rejectTask(
  taskId: string,
  parentId: string,
  data: RejectTaskInput
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, parentId, approvalStatus: 'completed' },
  });
  if (!task) throw { statusCode: 404, message: 'المهمة غير موجودة أو غير قابلة للرفض' };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      approvalStatus: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: data.reason,
      isCompleted: false,
      completedAt: null,
    },
  });

  await sendNotificationToChild('task_rejected', task.childId, {
    taskTitle: task.title,
    reason: data.reason,
    taskId,
  });

  return { rejected: true };
}

// =============================================
// Get tasks pending approval (for parent dashboard)
// =============================================
export async function getPendingApproval(parentId: string) {
  return prisma.task.findMany({
    where: { parentId, approvalStatus: 'completed' },
    include: {
      child: { select: { id: true, name: true, avatar: true, color: true } },
    },
    orderBy: { completedAt: 'asc' },
  });
}

// =============================================
// Get task stats for a child (challenge progress)
// =============================================
export async function getChildTaskStats(childId: string) {
  const child = await prisma.child.findUnique({
    where:  { id: childId },
    select: { totalStars: true, lastChallengeClaimedAt: true },
  });

  // نعد فقط ما أُنجز بعد آخر استلام جائزة (تصفير الكاونترات)
  const since = child?.lastChallengeClaimedAt ?? undefined;

  const [groups, starsAgg] = await Promise.all([
    prisma.task.groupBy({
      by:    ['difficulty'],
      where: {
        childId, isActive: true, isCompleted: true,
        ...(since ? { completedAt: { gte: since } } : {}),
      },
      _count: { id: true },
    }),
    prisma.task.aggregate({
      where: {
        childId, isActive: true, approvalStatus: 'approved',
        ...(since ? { approvedAt: { gte: since } } : {}),
      },
      _sum: { points: true },
    }),
  ]);

  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const g of groups) {
    counts[g.difficulty as keyof typeof counts] = g._count.id;
  }

  return {
    approvedEasy:   counts.easy,
    approvedMedium: counts.medium,
    approvedHard:   counts.hard,
    totalStars:     since ? (starsAgg._sum.points ?? 0) : (child?.totalStars ?? 0),
  };
}

// =============================================
// Helper
// =============================================
async function verifyTaskOwnership(taskId: string, parentId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, parentId } });
  if (!task) throw { statusCode: 404, message: 'المهمة غير موجودة' };
  return task;
}
