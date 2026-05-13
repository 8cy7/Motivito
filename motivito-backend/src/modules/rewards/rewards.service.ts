import prisma from '../../config/database';
import { sendNotificationToParent, sendNotificationToChild } from '../../utils/notifications';
import type {
  CreateRewardInput,
  UpdateRewardInput,
  RewardRequestInput,
  RejectRewardRequestInput,
} from './rewards.schema';

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
export async function getRewardsForChild(childId: string) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true },
  });
  if (!child) return [];

  return prisma.reward.findMany({
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
export async function getRewards(parentId: string, childId?: string) {
  return prisma.reward.findMany({
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
export async function getRewardSuggestions(parentId: string, childId: string) {
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
    select: { gender: true },
  });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  return child.gender === 'boy' ? BOY_SUGGESTIONS : GIRL_SUGGESTIONS;
}

// =============================================
// Create reward
// =============================================
export async function createReward(parentId: string, data: CreateRewardInput) {
  if (data.childId) {
    const child = await prisma.child.findFirst({ where: { id: data.childId, parentId } });
    if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };
  }

  return prisma.reward.create({
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
export async function updateReward(
  rewardId: string,
  parentId: string,
  data: UpdateRewardInput
) {
  await verifyRewardOwnership(rewardId, parentId);
  return prisma.reward.update({ where: { id: rewardId }, data });
}

// =============================================
// Delete reward
// =============================================
export async function deleteReward(rewardId: string, parentId: string) {
  await verifyRewardOwnership(rewardId, parentId);
  await prisma.reward.update({
    where: { id: rewardId },
    data: { isActive: false },
  });
}

// =============================================
// Child requests a reward
// =============================================
export async function requestReward(childId: string, data: RewardRequestInput) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { id: true, name: true, stars: true, parentId: true, gender: true },
  });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  const reward = await prisma.reward.findFirst({
    where: {
      id: data.rewardId,
      isActive: true,
      parentId: child.parentId,
      OR: [{ childId }, { childId: null }],
    },
  });
  if (!reward) throw { statusCode: 404, message: 'الجائزة غير موجودة' };

  if (child.stars < reward.pointsCost) {
    throw { statusCode: 400, message: 'نجوم غير كافية', details: { required: reward.pointsCost, available: child.stars } };
  }

  // Deduct stars immediately when child requests
  const [, rewardRequest] = await prisma.$transaction([
    prisma.child.update({
      where: { id: childId },
      data: { stars: { decrement: reward.pointsCost } },
    }),
    prisma.rewardRequest.create({
      data: {
        childId,
        rewardId: reward.id,
        starsCost: reward.pointsCost,
      },
    }),
  ]);

  await sendNotificationToParent('reward_requested', child.parentId, {
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
export async function getPendingRequests(parentId: string) {
  const rewards = await prisma.reward.findMany({
    where: { parentId },
    select: { id: true },
  });
  const rewardIds = rewards.map((r) => r.id);

  return prisma.rewardRequest.findMany({
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
export async function deliverReward(requestId: string, parentId: string) {
  const request = await getRequestForParent(requestId, parentId);

  if (request.status !== 'pending') {
    throw { statusCode: 400, message: 'الطلب غير قابل للتسليم' };
  }

  // Stars already deducted at request time — just mark as delivered
  await prisma.rewardRequest.update({
    where: { id: requestId },
    data: { status: 'delivered', deliveredAt: new Date() },
  });

  await sendNotificationToChild('reward_delivered', request.childId, {
    rewardName: request.reward.name,
    requestId,
  });

  return { delivered: true };
}

// =============================================
// Parent rejects reward request
// =============================================
export async function rejectRewardRequest(
  requestId: string,
  parentId: string,
  data: RejectRewardRequestInput
) {
  const request = await getRequestForParent(requestId, parentId);

  if (request.status !== 'pending') {
    throw { statusCode: 400, message: 'الطلب غير قابل للرفض' };
  }

  // Refund stars since they were deducted at request time
  await prisma.$transaction([
    prisma.child.update({
      where: { id: request.childId },
      data: { stars: { increment: request.starsCost } },
    }),
    prisma.rewardRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', rejectedAt: new Date(), rejectionNote: data.note },
    }),
  ]);

  await sendNotificationToChild('reward_rejected', request.childId, {
    rewardName: request.reward.name,
  });

  return { rejected: true };
}

// =============================================
// Get reward requests history
// =============================================
export async function getRequestHistory(parentId: string, childId?: string) {
  const rewards = await prisma.reward.findMany({
    where: { parentId },
    select: { id: true },
  });
  const rewardIds = rewards.map((r) => r.id);

  return prisma.rewardRequest.findMany({
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
async function verifyRewardOwnership(rewardId: string, parentId: string) {
  const reward = await prisma.reward.findFirst({ where: { id: rewardId, parentId } });
  if (!reward) throw { statusCode: 404, message: 'الجائزة غير موجودة' };
  return reward;
}

async function getRequestForParent(requestId: string, parentId: string) {
  const rewards = await prisma.reward.findMany({
    where: { parentId },
    select: { id: true },
  });
  const rewardIds = rewards.map((r) => r.id);

  const request = await prisma.rewardRequest.findFirst({
    where: { id: requestId, rewardId: { in: rewardIds } },
    include: { reward: { select: { name: true } } },
  });

  if (!request) throw { statusCode: 404, message: 'الطلب غير موجود' };
  return request;
}
