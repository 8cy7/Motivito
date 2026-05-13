"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = getMyProfile;
exports.sendRequest = sendRequest;
exports.getIncomingRequests = getIncomingRequests;
exports.acceptRequest = acceptRequest;
exports.rejectRequest = rejectRequest;
exports.getFriends = getFriends;
exports.removeFriend = removeFriend;
const database_1 = __importDefault(require("../../config/database"));
// ─── Generate unique MOTI-XXXX code ──────────────────────────────────────────
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `MOTI-${code}`;
}
async function getOrCreateFriendCode(childId) {
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { friendCode: true },
    });
    if (child?.friendCode)
        return child.friendCode;
    // Try up to 10 times to get a unique code
    for (let i = 0; i < 10; i++) {
        const code = generateCode();
        const exists = await database_1.default.child.findUnique({ where: { friendCode: code } });
        if (!exists) {
            await database_1.default.child.update({ where: { id: childId }, data: { friendCode: code } });
            return code;
        }
    }
    throw new Error('Could not generate unique friend code');
}
// ─── GET /api/friends/me ──────────────────────────────────────────────────────
async function getMyProfile(childId) {
    const code = await getOrCreateFriendCode(childId);
    return { friendCode: code };
}
// ─── POST /api/friends/request  { friendCode } ───────────────────────────────
async function sendRequest(senderId, friendCode) {
    const receiver = await database_1.default.child.findUnique({
        where: { friendCode },
        select: { id: true, name: true, friendCode: true },
    });
    if (!receiver) {
        return { error: 'not_found', message: 'لم يتم العثور على هذا الـ ID' };
    }
    if (receiver.id === senderId) {
        return { error: 'self', message: 'لا تقدر تضيف نفسك' };
    }
    // Check if already friends (accepted request in either direction)
    const existing = await database_1.default.friendRequest.findFirst({
        where: {
            OR: [
                { senderId, receiverId: receiver.id },
                { senderId: receiver.id, receiverId: senderId },
            ],
        },
    });
    if (existing) {
        if (existing.status === 'accepted') {
            return { error: 'already_friends', message: 'أنتما أصدقاء مسبقاً' };
        }
        if (existing.status === 'pending') {
            return { error: 'pending', message: 'طلب الصداقة في انتظار القبول' };
        }
        // rejected → allow re-request by updating
        await database_1.default.friendRequest.update({
            where: { id: existing.id },
            data: { status: 'pending', senderId, receiverId: receiver.id },
        });
        return { success: true, receiverName: receiver.name };
    }
    await database_1.default.friendRequest.create({
        data: { senderId, receiverId: receiver.id },
    });
    return { success: true, receiverName: receiver.name };
}
// ─── GET /api/friends/requests/incoming ──────────────────────────────────────
async function getIncomingRequests(childId) {
    const requests = await database_1.default.friendRequest.findMany({
        where: { receiverId: childId, status: 'pending' },
        include: {
            sender: { select: { id: true, name: true, gender: true, friendCode: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    return requests.map(r => ({
        requestId: r.id,
        sender: {
            id: r.sender.id,
            name: r.sender.name,
            gender: r.sender.gender,
            friendCode: r.sender.friendCode,
        },
    }));
}
// ─── POST /api/friends/requests/:id/accept ───────────────────────────────────
async function acceptRequest(requestId, childId) {
    const req = await database_1.default.friendRequest.findUnique({ where: { id: requestId } });
    if (!req || req.receiverId !== childId) {
        return { error: 'not_found', message: 'الطلب غير موجود' };
    }
    if (req.status !== 'pending') {
        return { error: 'invalid_status', message: 'الطلب ليس في حالة انتظار' };
    }
    await database_1.default.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
    });
    return { success: true };
}
// ─── POST /api/friends/requests/:id/reject ───────────────────────────────────
async function rejectRequest(requestId, childId) {
    const req = await database_1.default.friendRequest.findUnique({ where: { id: requestId } });
    if (!req || req.receiverId !== childId) {
        return { error: 'not_found', message: 'الطلب غير موجود' };
    }
    await database_1.default.friendRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' },
    });
    return { success: true };
}
// ─── GET /api/friends ─────────────────────────────────────────────────────────
async function getFriends(childId) {
    const accepted = await database_1.default.friendRequest.findMany({
        where: {
            status: 'accepted',
            OR: [{ senderId: childId }, { receiverId: childId }],
        },
        include: {
            sender: { select: { id: true, name: true, gender: true, friendCode: true, challengeLevel: true, level: true } },
            receiver: { select: { id: true, name: true, gender: true, friendCode: true, challengeLevel: true, level: true } },
        },
    });
    return accepted.map(r => {
        const friend = r.senderId === childId ? r.receiver : r.sender;
        return {
            id: friend.id,
            name: friend.name,
            gender: friend.gender,
            friendCode: friend.friendCode,
            challengeLevel: friend.challengeLevel,
            level: friend.level,
        };
    });
}
// ─── DELETE /api/friends/:friendId ───────────────────────────────────────────
async function removeFriend(childId, friendId) {
    await database_1.default.friendRequest.deleteMany({
        where: {
            status: 'accepted',
            OR: [
                { senderId: childId, receiverId: friendId },
                { senderId: friendId, receiverId: childId },
            ],
        },
    });
    return { success: true };
}
//# sourceMappingURL=friends.service.js.map