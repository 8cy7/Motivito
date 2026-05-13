"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTasks = getTasks;
exports.getChildTasks = getChildTasks;
exports.getTask = getTask;
exports.createTask = createTask;
exports.bulkCreateTasks = bulkCreateTasks;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.completeTask = completeTask;
exports.approveTask = approveTask;
exports.rejectTask = rejectTask;
exports.getPendingApproval = getPendingApproval;
exports.getChildTaskStats = getChildTaskStats;
const database_1 = __importDefault(require("../../config/database"));
const gamification_1 = require("../../utils/gamification");
const notifications_1 = require("../../utils/notifications");
// =============================================
// Get tasks for a child
// =============================================
async function getTasks(parentId, childId) {
    // Verify child belongs to parent
    const child = await database_1.default.child.findFirst({ where: { id: childId, parentId } });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    return database_1.default.task.findMany({
        where: { childId, parentId, isActive: true },
        orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
    });
}
// =============================================
// Get tasks for the authenticated child (child JWT)
// =============================================
async function getChildTasks(childId) {
    return database_1.default.task.findMany({
        where: { childId, isActive: true },
        orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
    });
}
// =============================================
// Get task detail
// =============================================
async function getTask(taskId, parentId) {
    const task = await database_1.default.task.findFirst({ where: { id: taskId, parentId } });
    if (!task)
        throw { statusCode: 404, message: 'المهمة غير موجودة' };
    return task;
}
// =============================================
// Create task (parent)
// =============================================
async function createTask(parentId, data) {
    const child = await database_1.default.child.findFirst({ where: { id: data.childId, parentId } });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    const task = await database_1.default.task.create({
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
    await (0, notifications_1.sendNotificationToChild)('task_assigned', child.id, {
        gender: child.gender,
        taskTitle: task.title,
        taskId: task.id,
    });
    return task;
}
// =============================================
// Bulk create tasks
// =============================================
async function bulkCreateTasks(parentId, data) {
    // Verify all children belong to this parent
    const childIds = [...new Set(data.tasks.map((t) => t.childId))];
    const children = await database_1.default.child.findMany({
        where: { id: { in: childIds }, parentId },
    });
    if (children.length !== childIds.length) {
        throw { statusCode: 404, message: 'بعض الأطفال غير موجودين' };
    }
    const tasks = await database_1.default.$transaction(data.tasks.map((t) => database_1.default.task.create({
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
    })));
    // إشعار لكل طفل بمهامه الجديدة
    for (const task of tasks) {
        const child = children.find((c) => c.id === task.childId);
        if (child) {
            await (0, notifications_1.sendNotificationToChild)('task_assigned', child.id, {
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
async function updateTask(taskId, parentId, data) {
    await verifyTaskOwnership(taskId, parentId);
    return database_1.default.task.update({
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
async function deleteTask(taskId, parentId) {
    await verifyTaskOwnership(taskId, parentId);
    await database_1.default.task.delete({ where: { id: taskId } });
}
// =============================================
// Child completes a task (→ awaiting approval)
// =============================================
async function completeTask(taskId, childId, data) {
    const task = await database_1.default.task.findFirst({
        where: { id: taskId, childId, isActive: true },
    });
    if (!task)
        throw { statusCode: 404, message: 'المهمة غير موجودة' };
    if (task.isCompleted)
        throw { statusCode: 400, message: 'المهمة مكتملة مسبقاً' };
    const updated = await database_1.default.task.update({
        where: { id: taskId },
        data: {
            isCompleted: true,
            completedAt: new Date(),
            approvalStatus: 'completed',
            timeSpent: data.timeSpent,
        },
    });
    // Get child info for notification
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { name: true, parentId: true, gender: true },
    });
    if (child) {
        await (0, notifications_1.sendNotificationToParent)('task_completed', child.parentId, {
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
async function approveTask(taskId, parentId) {
    const task = await database_1.default.task.findFirst({
        where: { id: taskId, parentId },
    });
    if (!task)
        throw { statusCode: 404, message: 'المهمة غير موجودة' };
    if (task.approvalStatus !== 'completed') {
        throw { statusCode: 400, message: 'المهمة غير جاهزة للمراجعة' };
    }
    const child = await database_1.default.child.findUnique({ where: { id: task.childId } });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    // Calculate new XP and stars
    const newStars = child.stars + task.points;
    const newTotalStars = child.totalStars + task.points;
    const { level: newLevel, xp: newXP } = (0, gamification_1.calculateLevel)(child.xp + task.points, child.level);
    // Check for new badges and battle pass unlocks
    const newBadges = (0, gamification_1.checkNewBadges)(child.level, newLevel, child.gender);
    const newBattlePassUnlocks = (0, gamification_1.checkBattlePass)(child.level, newLevel, child.gender);
    // Execute all updates in a transaction
    await database_1.default.$transaction([
        database_1.default.child.update({
            where: { id: child.id },
            data: { level: newLevel, xp: newXP, stars: newStars, totalStars: newTotalStars },
        }),
        database_1.default.task.update({
            where: { id: taskId },
            data: { approvalStatus: 'approved', approvedAt: new Date() },
        }),
        ...newBadges.map((b) => database_1.default.badge.create({
            data: { childId: child.id, level: b.level, emoji: b.emoji, color: b.color },
        })),
        ...newBattlePassUnlocks.map((u) => database_1.default.battlePassUnlock.create({
            data: {
                childId: child.id,
                level: u.level,
                rewardType: u.rewardType,
                rewardData: u.rewardData,
            },
        })),
    ]);
    // Send notifications
    await (0, notifications_1.sendNotificationToChild)('task_approved', child.id, {
        taskTitle: task.title,
        points: task.points,
        taskId,
    });
    if (newLevel > child.level) {
        await (0, notifications_1.sendNotificationToChild)('level_up', child.id, { level: newLevel });
        await (0, notifications_1.sendNotificationToParent)('level_up', parentId, {
            childName: child.name,
            level: newLevel,
        });
    }
    for (const badge of newBadges) {
        await (0, notifications_1.sendNotificationToChild)('badge_earned', child.id, badge);
    }
    for (const unlock of newBattlePassUnlocks) {
        await (0, notifications_1.sendNotificationToChild)('battle_pass_unlock', child.id, unlock);
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
async function rejectTask(taskId, parentId, data) {
    const task = await database_1.default.task.findFirst({
        where: { id: taskId, parentId, approvalStatus: 'completed' },
    });
    if (!task)
        throw { statusCode: 404, message: 'المهمة غير موجودة أو غير قابلة للرفض' };
    await database_1.default.task.update({
        where: { id: taskId },
        data: {
            approvalStatus: 'rejected',
            rejectedAt: new Date(),
            rejectionReason: data.reason,
            isCompleted: false,
            completedAt: null,
        },
    });
    await (0, notifications_1.sendNotificationToChild)('task_rejected', task.childId, {
        taskTitle: task.title,
        reason: data.reason,
        taskId,
    });
    return { rejected: true };
}
// =============================================
// Get tasks pending approval (for parent dashboard)
// =============================================
async function getPendingApproval(parentId) {
    return database_1.default.task.findMany({
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
async function getChildTaskStats(childId) {
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { totalStars: true, lastChallengeClaimedAt: true },
    });
    // نعد فقط ما أُنجز بعد آخر استلام جائزة (تصفير الكاونترات)
    const since = child?.lastChallengeClaimedAt ?? undefined;
    const [groups, starsAgg] = await Promise.all([
        database_1.default.task.groupBy({
            by: ['difficulty'],
            where: {
                childId, isActive: true, isCompleted: true,
                ...(since ? { completedAt: { gte: since } } : {}),
            },
            _count: { id: true },
        }),
        database_1.default.task.aggregate({
            where: {
                childId, isActive: true, approvalStatus: 'approved',
                ...(since ? { approvedAt: { gte: since } } : {}),
            },
            _sum: { points: true },
        }),
    ]);
    const counts = { easy: 0, medium: 0, hard: 0 };
    for (const g of groups) {
        counts[g.difficulty] = g._count.id;
    }
    return {
        approvedEasy: counts.easy,
        approvedMedium: counts.medium,
        approvedHard: counts.hard,
        totalStars: since ? (starsAgg._sum.points ?? 0) : (child?.totalStars ?? 0),
    };
}
// =============================================
// Helper
// =============================================
async function verifyTaskOwnership(taskId, parentId) {
    const task = await database_1.default.task.findFirst({ where: { id: taskId, parentId } });
    if (!task)
        throw { statusCode: 404, message: 'المهمة غير موجودة' };
    return task;
}
//# sourceMappingURL=tasks.service.js.map