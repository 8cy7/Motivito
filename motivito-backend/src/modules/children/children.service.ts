import { FastifyInstance } from 'fastify';
import prisma from '../../config/database';
import redis from '../../config/redis';
import { hashPin, comparePin } from '../../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import type {
  CreateChildInput,
  UpdateChildInput,
  ResetChildPinInput,
  SetupPinInput,
  ChangeChildPinInput,
  LinkDeviceInput,
} from './children.schema';

// sentinel: يعني الطفل لم يختر PIN بعد
const PIN_UNSET = 'UNSET';

// =============================================
// Get all children for a parent
// =============================================
export async function getChildren(parentId: string) {
  return prisma.child.findMany({
    where: { parentId },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      avatar: true,
      isAvatarImage: true,
      gender: true,
      color: true,
      isPinned: true,
      level: true,
      xp: true,
      stars: true,
      totalStars: true,
      unlockedEmojis: true,
      createdAt: true,
      _count: {
        select: {
          tasks: { where: { isActive: true, approvalStatus: 'pending', isCompleted: false } },
          badges: true,
        },
      },
    },
  });
}

// =============================================
// Get child's own data (child JWT)
// =============================================
export async function getChildSelf(childId: string) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      name: true,
      avatar: true,
      isAvatarImage: true,
      gender: true,
      color: true,
      level: true,
      xp: true,
      stars: true,
      totalStars: true,
      challengeLevel: true,
      parentId: true,
      parent: { select: { isPremium: true } },
    },
  });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };
  const { parent, ...childData } = child;
  return { ...childData, parentIsPremium: parent?.isPremium ?? false };
}

// =============================================
// Claim challenge reward → unlock next node
// =============================================
export async function claimChallenge(childId: string, challengeIndex: number) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { challengeLevel: true, xp: true, level: true },
  });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  if (challengeIndex !== child.challengeLevel) {
    throw { statusCode: 400, message: 'لا يمكن المطالبة بهذا التحدي الآن' };
  }

  const xpReward = 500 + challengeIndex * 200;
  let newLevel = child.level;
  let newXP = child.xp + xpReward;
  while (newXP >= (newLevel + 1) * 100) {
    newXP -= (newLevel + 1) * 100;
    newLevel++;
  }

  const updated = await prisma.child.update({
    where: { id: childId },
    data: {
      challengeLevel:         child.challengeLevel + 1,
      lastChallengeClaimedAt: new Date(),
      level:                  newLevel,
      xp:                     newXP,
    },
    select: { challengeLevel: true, level: true, xp: true },
  });

  return { success: true, challengeLevel: updated.challengeLevel, level: updated.level, xp: updated.xp };
}

// =============================================
// Get single child (verify ownership)
// =============================================
export async function getChild(childId: string, parentId: string) {
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
    include: {
      badges: { orderBy: { earnedDate: 'desc' } },
      _count: {
        select: {
          tasks: true,
          badges: true,
          battlePassUnlocks: true,
        },
      },
    },
  });

  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };
  return child;
}

// =============================================
// Create child
// =============================================
export async function createChild(parentId: string, data: CreateChildInput) {
  // إذا أدخل الأب PIN مؤقت → نشفّره، وإلا نضع UNSET ليختاره الطفل لاحقاً
  const pinHash = data.pin ? await hashPin(data.pin) : PIN_UNSET;

  return prisma.child.create({
    data: {
      parentId,
      name: data.name,
      avatar: data.avatar,
      gender: data.gender,
      color: data.color || '#4facfe',
      pinHash,
      isAvatarImage: data.isAvatarImage || false,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      gender: true,
      color: true,
      level: true,
      xp: true,
      stars: true,
      createdAt: true,
      // هل الطفل يحتاج إعداد PIN بعد؟
      pinHash: true,
    },
  }).then((child) => ({
    ...child,
    requiresPinSetup: child.pinHash === PIN_UNSET,
    pinHash: undefined, // لا نُعيد الـ hash للكلايانت
  }));
}

// =============================================
// Update child
// =============================================
export async function updateChild(childId: string, parentId: string, data: UpdateChildInput) {
  await verifyChildOwnership(childId, parentId);

  return prisma.child.update({
    where: { id: childId },
    data,
    select: {
      id: true,
      name: true,
      avatar: true,
      isAvatarImage: true,
      gender: true,
      color: true,
      isPinned: true,
      level: true,
      xp: true,
      stars: true,
    },
  });
}

// =============================================
// Delete child
// =============================================
export async function deleteChild(childId: string, parentId: string) {
  await verifyChildOwnership(childId, parentId);
  await prisma.child.delete({ where: { id: childId } });
}

// =============================================
// الأب يعيد ضبط PIN الطفل (صلاحية الأب كافية)
// =============================================
export async function resetChildPin(
  childId: string,
  parentId: string,
  data: ResetChildPinInput
) {
  await verifyChildOwnership(childId, parentId);
  const newPinHash = await hashPin(data.newPin);
  await prisma.child.update({ where: { id: childId }, data: { pinHash: newPinHash } });
}

// =============================================
// الطفل يُعيّن PIN لأول مرة بعد مسح QR
// =============================================
export async function setupChildPin(childId: string, data: SetupPinInput) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { pinHash: true },
  });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  if (child.pinHash !== PIN_UNSET) {
    throw { statusCode: 400, message: 'PIN محدد مسبقاً، استخدم تغيير PIN' };
  }

  const pinHash = await hashPin(data.pin);
  await prisma.child.update({ where: { id: childId }, data: { pinHash } });

  return { message: 'تم تعيين رمزك السري بنجاح', pinSetupComplete: true };
}

// =============================================
// الطفل يغيّر PIN الخاص فيه (يعرف القديم)
// =============================================
export async function changeChildPin(childId: string, data: ChangeChildPinInput) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { pinHash: true },
  });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  if (child.pinHash === PIN_UNSET) {
    throw { statusCode: 400, message: 'لم يتم تعيين PIN بعد' };
  }

  const valid = await comparePin(data.currentPin, child.pinHash);
  if (!valid) throw { statusCode: 400, message: 'الرمز الحالي غير صحيح' };

  const newPinHash = await hashPin(data.newPin);
  await prisma.child.update({ where: { id: childId }, data: { pinHash: newPinHash } });

  return { message: 'تم تغيير رمزك السري' };
}

// =============================================
// Toggle pinned
// =============================================
export async function togglePinChild(childId: string, parentId: string) {
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
    select: { isPinned: true },
  });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };

  return prisma.child.update({
    where: { id: childId },
    data: { isPinned: !child.isPinned },
    select: { id: true, isPinned: true },
  });
}

// =============================================
// Generate QR Code for device linking
// =============================================
export async function generateQRCode(childId: string, parentId: string) {
  await verifyChildOwnership(childId, parentId);

  const token = uuidv4();
  await redis.set(`qr:${token}`, childId, 'EX', 900); // 15 minutes

  const qrData = `motivito://link?token=${token}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData);

  return { token, qrData, qrCodeDataUrl, expiresIn: 900 };
}

// =============================================
// Link device via QR token
// =============================================
export async function linkDevice(fastify: FastifyInstance, data: LinkDeviceInput) {
  const childId = await redis.get(`qr:${data.token}`);
  if (!childId) {
    throw { statusCode: 400, message: 'رمز QR غير صالح أو منتهي الصلاحية' };
  }

  // Delete token immediately (single use)
  await redis.del(`qr:${data.token}`);

  // Update child FCM token
  const child = await prisma.child.update({
    where: { id: childId },
    data: {
      fcmToken: data.fcmToken || null,
      deviceToken: null,
      deviceTokenExp: null,
    },
    select: {
      id: true,
      parentId: true,
      name: true,
      avatar: true,
      level: true,
      xp: true,
      stars: true,
      gender: true,
      color: true,
      pinHash: true,
    },
  });

  const requiresPinSetup = child.pinHash === PIN_UNSET;

  // Issue JWT for child (مؤقت 1 ساعة إذا لم يُعيّن PIN بعد، وإلا 7 أيام)
  const accessToken = fastify.jwt.sign(
    { id: child.id, parentId: child.parentId, type: 'child' },
    { expiresIn: requiresPinSetup ? '1h' : '7d' }
  );

  const { pinHash: _omit, ...childData } = child;

  return {
    child: childData,
    accessToken,
    // ➜ إذا true: وجّه الطفل لصفحة "اختر رمزك السري"
    requiresPinSetup,
  };
}

// =============================================
// Update child FCM token
// =============================================
export async function updateChildFcmToken(childId: string, parentId: string, fcmToken: string) {
  await verifyChildOwnership(childId, parentId);
  await prisma.child.update({ where: { id: childId }, data: { fcmToken } });
}

// =============================================
// Update child avatar (after upload)
// =============================================
export async function updateChildAvatar(childId: string, parentId: string, avatarUrl: string) {
  await verifyChildOwnership(childId, parentId);
  return prisma.child.update({
    where: { id: childId },
    data: { avatar: avatarUrl, isAvatarImage: true },
    select: { id: true, avatar: true, isAvatarImage: true },
  });
}

// =============================================
// Helper: Verify child belongs to parent
// =============================================
async function verifyChildOwnership(childId: string, parentId: string) {
  const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
  if (!child) throw { statusCode: 404, message: 'الطفل غير موجود' };
  return child;
}

export async function saveChildFcmTokenSelf(childId: string, fcmToken: string) {
  await prisma.child.update({ where: { id: childId }, data: { fcmToken } });
}
