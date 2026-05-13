"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRewardsForChild = getRewardsForChild;
exports.getRewards = getRewards;
exports.getRewardSuggestions = getRewardSuggestions;
exports.createReward = createReward;
exports.updateReward = updateReward;
exports.deleteReward = deleteReward;
exports.requestReward = requestReward;
exports.getPendingRequests = getPendingRequests;
exports.deliverReward = deliverReward;
exports.rejectRewardRequest = rejectRewardRequest;
exports.getRequestHistory = getRequestHistory;
const database_1 = __importDefault(require("../../config/database"));
const notifications_1 = require("../../utils/notifications");
// =============================================
// Default reward suggestions by gender
// =============================================
const BOY_SUGGESTIONS = [
    { name: 'ساعة ألعاب إضافية', emoji: '🎮', type: 'small', category: 'gaming', pointsCost: 50 },
    { name: 'وجبة مفضلة', emoji: '🍕', type: 'small', category: 'food', pointsCost: 30 },
    { name: 'لعبة جديدة', emoji: '🧸', type: 'medium', category: 'toy', pointsCost: 200 },
    { name: 'رحلة الملاهي', emoji: '🎡', type: 'large', category: 'outing', pointsCost: 500 },
    { name: 'كتاب مفضل', emoji: '📚', type: 'small', category: 'education', pointsCost: 40 },
];
const GIRL_SUGGESTIONS = [
    { name: 'طلاء أظافر', emoji: '💅', type: 'small', category: 'beauty', pointsCost: 30 },
    { name: 'وجبة مفضلة', emoji: '🍰', type: 'small', category: 'food', pointsCost: 30 },
    { name: 'لعبة جديدة', emoji: '🎀', type: 'medium', category: 'toy', pointsCost: 200 },
    { name: 'رحلة تسوق', emoji: '🛍️', type: 'large', category: 'outing', pointsCost: 500 },
    { name: 'كتاب قصص', emoji: '📖', type: 'small', category: 'education', pointsCost: 40 },
];
// =============================================
// Get rewards catalog for child (child-auth)
// =============================================
async function getRewardsForChild(childId) {
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { parentId: true },
    });
    if (!child)
        return [];
    return database_1.default.reward.findMany({
        where: {
            parentId: child.parentId,
            isActive: true,
            OR: [{ childId }, { childId: null }],
        },
        orderBy: { createdAt: 'desc' },
    });
}
// =============================================
// Get rewards catalog
// =============================================
async function getRewards(parentId, childId) {
    return database_1.default.reward.findMany({
        where: {
            parentId,
            isActive: true,
            ...(childId ? { OR: [{ childId }, { childId: null }] } : {}),
        },
        orderBy: { createdAt: 'desc' },
    });
}
// =============================================
// Get reward suggestions
// =============================================
async function getRewardSuggestions(parentId, childId) {
    const child = await database_1.default.child.findFirst({
        where: { id: childId, parentId },
        select: { gender: true },
    });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    return child.gender === 'boy' ? BOY_SUGGESTIONS : GIRL_SUGGESTIONS;
}
// =============================================
// Create reward
// =============================================
async function createReward(parentId, data) {
    if (data.childId) {
        const child = await database_1.default.child.findFirst({ where: { id: data.childId, parentId } });
        if (!child)
            throw { statusCode: 404, message: 'الطفل غير موجود' };
    }
    return database_1.default.reward.create({
        data: {
            parentId,
            childId: data.childId || null,
            name: data.name,
            emoji: data.emoji,
            pointsCost: data.pointsCost,
            type: data.type,
            category: data.category,
        },
    });
}
// =============================================
// Update reward
// =============================================
async function updateReward(rewardId, parentId, data) {
    await verifyRewardOwnership(rewardId, parentId);
    return database_1.default.reward.update({ where: { id: rewardId }, data });
}
// =============================================
// Delete reward
// =============================================
async function deleteReward(rewardId, parentId) {
    await verifyRewardOwnership(rewardId, parentId);
    await database_1.default.reward.update({
        where: { id: rewardId },
        data: { isActive: false },
    });
}
// =============================================
// Child requests a reward
// =============================================
async function requestReward(childId, data) {
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { id: true, name: true, stars: true, parentId: true, gender: true },
    });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    const reward = await database_1.default.reward.findFirst({
        where: {
            id: data.rewardId,
            isActive: true,
            parentId: child.parentId,
            OR: [{ childId }, { childId: null }],
        },
    });
    if (!reward)
        throw { statusCode: 404, message: 'الجائزة غير موجودة' };
    if (child.stars < reward.pointsCost) {
        throw { statusCode: 400, message: 'نجوم غير كافية', details: { required: reward.pointsCost, available: child.stars } };
    }
    // Deduct stars immediately when child requests
    const [, rewardRequest] = await database_1.default.$transaction([
        database_1.default.child.update({
            where: { id: childId },
            data: { stars: { decrement: reward.pointsCost } },
        }),
        database_1.default.rewardRequest.create({
            data: {
                childId,
                rewardId: reward.id,
                starsCost: reward.pointsCost,
            },
        }),
    ]);
    await (0, notifications_1.sendNotificationToParent)('reward_requested', child.parentId, {
        childName: child.name,
        gender: child.gender,
        rewardName: reward.name,
        requestId: rewardRequest.id,
    });
    return { ...rewardRequest, newStars: child.stars - reward.pointsCost };
}
// =============================================
// Get pending reward requests (for parent)
// =============================================
async function getPendingRequests(parentId) {
    const rewards = await database_1.default.reward.findMany({
        where: { parentId },
        select: { id: true },
    });
    const rewardIds = rewards.map((r) => r.id);
    return database_1.default.rewardRequest.findMany({
        where: { rewardId: { in: rewardIds }, status: 'pending' },
        include: {
            child: { select: { id: true, name: true, avatar: true, color: true, stars: true } },
            reward: { select: { id: true, name: true, emoji: true, pointsCost: true } },
        },
        orderBy: { requestedAt: 'asc' },
    });
}
// =============================================
// Parent delivers reward
// =============================================
async function deliverReward(requestId, parentId) {
    const request = await getRequestForParent(requestId, parentId);
    if (request.status !== 'pending') {
        throw { statusCode: 400, message: 'الطلب غير قابل للتسليم' };
    }
    // Stars already deducted at request time — just mark as delivered
    await database_1.default.rewardRequest.update({
        where: { id: requestId },
        data: { status: 'delivered', deliveredAt: new Date() },
    });
    await (0, notifications_1.sendNotificationToChild)('reward_delivered', request.childId, {
        rewardName: request.reward.name,
        requestId,
    });
    return { delivered: true };
}
// =============================================
// Parent rejects reward request
// =============================================
async function rejectRewardRequest(requestId, parentId, data) {
    const request = await getRequestForParent(requestId, parentId);
    if (request.status !== 'pending') {
        throw { statusCode: 400, message: 'الطلب غير قابل للرفض' };
    }
    // Refund stars since they were deducted at request time
    await database_1.default.$transaction([
        database_1.default.child.update({
            where: { id: request.childId },
            data: { stars: { increment: request.starsCost } },
        }),
        database_1.default.rewardRequest.update({
            where: { id: requestId },
            data: { status: 'rejected', rejectedAt: new Date(), rejectionNote: data.note },
        }),
    ]);
    await (0, notifications_1.sendNotificationToChild)('reward_rejected', request.childId, {
        rewardName: request.reward.name,
    });
    return { rejected: true };
}
// =============================================
// Get reward requests history
// =============================================
async function getRequestHistory(parentId, childId) {
    const rewards = await database_1.default.reward.findMany({
        where: { parentId },
        select: { id: true },
    });
    const rewardIds = rewards.map((r) => r.id);
    return database_1.default.rewardRequest.findMany({
        where: {
            rewardId: { in: rewardIds },
            ...(childId ? { childId } : {}),
        },
        include: {
            child: { select: { id: true, name: true, avatar: true } },
            reward: { select: { id: true, name: true, emoji: true } },
        },
        orderBy: { requestedAt: 'desc' },
        take: 50,
    });
}
// =============================================
// Helpers
// =============================================
async function verifyRewardOwnership(rewardId, parentId) {
    const reward = await database_1.default.reward.findFirst({ where: { id: rewardId, parentId } });
    if (!reward)
        throw { statusCode: 404, message: 'الجائزة غير موجودة' };
    return reward;
}
async function getRequestForParent(requestId, parentId) {
    const rewards = await database_1.default.reward.findMany({
        where: { parentId },
        select: { id: true },
    });
    const rewardIds = rewards.map((r) => r.id);
    const request = await database_1.default.rewardRequest.findFirst({
        where: { id: requestId, rewardId: { in: rewardIds } },
        include: { reward: { select: { name: true } } },
    });
    if (!request)
        throw { statusCode: 404, message: 'الطلب غير موجود' };
    return request;
}
//# sourceMappingURL=rewards.service.js.map