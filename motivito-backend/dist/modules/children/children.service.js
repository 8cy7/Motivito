"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildren = getChildren;
exports.getChildSelf = getChildSelf;
exports.claimChallenge = claimChallenge;
exports.getChild = getChild;
exports.createChild = createChild;
exports.updateChild = updateChild;
exports.deleteChild = deleteChild;
exports.resetChildPin = resetChildPin;
exports.setupChildPin = setupChildPin;
exports.changeChildPin = changeChildPin;
exports.togglePinChild = togglePinChild;
exports.generateQRCode = generateQRCode;
exports.linkDevice = linkDevice;
exports.updateChildFcmToken = updateChildFcmToken;
exports.updateChildAvatar = updateChildAvatar;
exports.saveChildFcmTokenSelf = saveChildFcmTokenSelf;
const database_1 = __importDefault(require("../../config/database"));
const redis_1 = __importDefault(require("../../config/redis"));
const hash_1 = require("../../utils/hash");
const uuid_1 = require("uuid");
const qrcode_1 = __importDefault(require("qrcode"));
// sentinel: يعني الطفل لم يختر PIN بعد
const PIN_UNSET = 'UNSET';
// =============================================
// Get all children for a parent
// =============================================
async function getChildren(parentId) {
    return database_1.default.child.findMany({
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
async function getChildSelf(childId) {
    const child = await database_1.default.child.findUnique({
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
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    const { parent, ...childData } = child;
    return { ...childData, parentIsPremium: parent?.isPremium ?? false };
}
// =============================================
// Claim challenge reward → unlock next node
// =============================================
async function claimChallenge(childId, challengeIndex) {
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { challengeLevel: true },
    });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    // يجب أن يكون هذا التحدي هو الحالي تماماً (لا يمكن تخطي تحديات)
    if (challengeIndex !== child.challengeLevel) {
        throw { statusCode: 400, message: 'لا يمكن المطالبة بهذا التحدي الآن' };
    }
    const updated = await database_1.default.child.update({
        where: { id: childId },
        data: {
            challengeLevel: child.challengeLevel + 1,
            lastChallengeClaimedAt: new Date(), // نصفّر الكاونترات من هذه اللحظة
        },
        select: { challengeLevel: true },
    });
    return { success: true, challengeLevel: updated.challengeLevel };
}
// =============================================
// Get single child (verify ownership)
// =============================================
async function getChild(childId, parentId) {
    const child = await database_1.default.child.findFirst({
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
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    return child;
}
// =============================================
// Create child
// =============================================
async function createChild(parentId, data) {
    // إذا أدخل الأب PIN مؤقت → نشفّره، وإلا نضع UNSET ليختاره الطفل لاحقاً
    const pinHash = data.pin ? await (0, hash_1.hashPin)(data.pin) : PIN_UNSET;
    return database_1.default.child.create({
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
async function updateChild(childId, parentId, data) {
    await verifyChildOwnership(childId, parentId);
    return database_1.default.child.update({
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
async function deleteChild(childId, parentId) {
    await verifyChildOwnership(childId, parentId);
    await database_1.default.child.delete({ where: { id: childId } });
}
// =============================================
// الأب يعيد ضبط PIN الطفل (صلاحية الأب كافية)
// =============================================
async function resetChildPin(childId, parentId, data) {
    await verifyChildOwnership(childId, parentId);
    const newPinHash = await (0, hash_1.hashPin)(data.newPin);
    await database_1.default.child.update({ where: { id: childId }, data: { pinHash: newPinHash } });
}
// =============================================
// الطفل يُعيّن PIN لأول مرة بعد مسح QR
// =============================================
async function setupChildPin(childId, data) {
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { pinHash: true },
    });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    if (child.pinHash !== PIN_UNSET) {
        throw { statusCode: 400, message: 'PIN محدد مسبقاً، استخدم تغيير PIN' };
    }
    const pinHash = await (0, hash_1.hashPin)(data.pin);
    await database_1.default.child.update({ where: { id: childId }, data: { pinHash } });
    return { message: 'تم تعيين رمزك السري بنجاح', pinSetupComplete: true };
}
// =============================================
// الطفل يغيّر PIN الخاص فيه (يعرف القديم)
// =============================================
async function changeChildPin(childId, data) {
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { pinHash: true },
    });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    if (child.pinHash === PIN_UNSET) {
        throw { statusCode: 400, message: 'لم يتم تعيين PIN بعد' };
    }
    const valid = await (0, hash_1.comparePin)(data.currentPin, child.pinHash);
    if (!valid)
        throw { statusCode: 400, message: 'الرمز الحالي غير صحيح' };
    const newPinHash = await (0, hash_1.hashPin)(data.newPin);
    await database_1.default.child.update({ where: { id: childId }, data: { pinHash: newPinHash } });
    return { message: 'تم تغيير رمزك السري' };
}
// =============================================
// Toggle pinned
// =============================================
async function togglePinChild(childId, parentId) {
    const child = await database_1.default.child.findFirst({
        where: { id: childId, parentId },
        select: { isPinned: true },
    });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    return database_1.default.child.update({
        where: { id: childId },
        data: { isPinned: !child.isPinned },
        select: { id: true, isPinned: true },
    });
}
// =============================================
// Generate QR Code for device linking
// =============================================
async function generateQRCode(childId, parentId) {
    await verifyChildOwnership(childId, parentId);
    const token = (0, uuid_1.v4)();
    await redis_1.default.set(`qr:${token}`, childId, 'EX', 900); // 15 minutes
    const qrData = `motivito://link?token=${token}`;
    const qrCodeDataUrl = await qrcode_1.default.toDataURL(qrData);
    return { token, qrData, qrCodeDataUrl, expiresIn: 900 };
}
// =============================================
// Link device via QR token
// =============================================
async function linkDevice(fastify, data) {
    const childId = await redis_1.default.get(`qr:${data.token}`);
    if (!childId) {
        throw { statusCode: 400, message: 'رمز QR غير صالح أو منتهي الصلاحية' };
    }
    // Delete token immediately (single use)
    await redis_1.default.del(`qr:${data.token}`);
    // Update child FCM token
    const child = await database_1.default.child.update({
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
    const accessToken = fastify.jwt.sign({ id: child.id, parentId: child.parentId, type: 'child' }, { expiresIn: requiresPinSetup ? '1h' : '7d' });
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
async function updateChildFcmToken(childId, parentId, fcmToken) {
    await verifyChildOwnership(childId, parentId);
    await database_1.default.child.update({ where: { id: childId }, data: { fcmToken } });
}
// =============================================
// Update child avatar (after upload)
// =============================================
async function updateChildAvatar(childId, parentId, avatarUrl) {
    await verifyChildOwnership(childId, parentId);
    return database_1.default.child.update({
        where: { id: childId },
        data: { avatar: avatarUrl, isAvatarImage: true },
        select: { id: true, avatar: true, isAvatarImage: true },
    });
}
// =============================================
// Helper: Verify child belongs to parent
// =============================================
async function verifyChildOwnership(childId, parentId) {
    const child = await database_1.default.child.findFirst({ where: { id: childId, parentId } });
    if (!child)
        throw { statusCode: 404, message: 'الطفل غير موجود' };
    return child;
}
async function saveChildFcmTokenSelf(childId, fcmToken) {
    await database_1.default.child.update({ where: { id: childId }, data: { fcmToken } });
}
//# sourceMappingURL=children.service.js.map