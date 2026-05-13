"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerParent = registerParent;
exports.loginParent = loginParent;
exports.loginParentPin = loginParentPin;
exports.loginChild = loginChild;
exports.refreshAccessToken = refreshAccessToken;
exports.logoutParent = logoutParent;
exports.getMe = getMe;
exports.saveParentFcmToken = saveParentFcmToken;
const database_1 = __importDefault(require("../../config/database"));
const hash_1 = require("../../utils/hash");
const uuid_1 = require("uuid");
// =============================================
// Register Parent
// =============================================
async function registerParent(fastify, data) {
    const existing = await database_1.default.parent.findUnique({ where: { email: data.email } });
    if (existing) {
        throw { statusCode: 409, message: 'البريد الإلكتروني مسجل مسبقاً' };
    }
    const passwordHash = await (0, hash_1.hashPassword)(data.password);
    const parentPinHash = await (0, hash_1.hashPin)(data.parentPin);
    const parent = await database_1.default.parent.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
            parentPinHash,
            phone: data.phone,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isPremium: true,
            language: true,
            createdAt: true,
        },
    });
    const tokens = await createSession(fastify, parent.id);
    return { parent, ...tokens };
}
// =============================================
// Login with Email + Password
// =============================================
async function loginParent(fastify, data) {
    const parent = await database_1.default.parent.findUnique({ where: { email: data.email } });
    if (!parent) {
        throw { statusCode: 401, message: 'بيانات الدخول غير صحيحة' };
    }
    const valid = await (0, hash_1.comparePassword)(data.password, parent.passwordHash);
    if (!valid) {
        throw { statusCode: 401, message: 'بيانات الدخول غير صحيحة' };
    }
    const tokens = await createSession(fastify, parent.id);
    return {
        parent: {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            phone: parent.phone,
            isPremium: parent.isPremium,
            language: parent.language,
        },
        ...tokens,
    };
}
// =============================================
// Login with PIN
// =============================================
async function loginParentPin(fastify, data) {
    const parent = await database_1.default.parent.findUnique({ where: { email: data.email } });
    if (!parent) {
        throw { statusCode: 401, message: 'بيانات الدخول غير صحيحة' };
    }
    const valid = await (0, hash_1.comparePin)(data.parentPin, parent.parentPinHash);
    if (!valid) {
        throw { statusCode: 401, message: 'PIN غير صحيح' };
    }
    const tokens = await createSession(fastify, parent.id);
    return {
        parent: {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            isPremium: parent.isPremium,
            language: parent.language,
        },
        ...tokens,
    };
}
// =============================================
// Child Login with PIN
// =============================================
async function loginChild(fastify, data) {
    const child = await database_1.default.child.findUnique({
        where: { id: data.childId },
        select: { id: true, parentId: true, name: true, avatar: true, pinHash: true, level: true, xp: true, stars: true, gender: true, color: true },
    });
    if (!child) {
        throw { statusCode: 401, message: 'الطفل غير موجود' };
    }
    // الطفل لم يُعيّن رمزه بعد → يجب مسح QR أولاً
    if (child.pinHash === 'UNSET') {
        throw { statusCode: 403, message: 'يجب مسح رمز QR لإعداد جهازك أولاً', code: 'PIN_NOT_SET' };
    }
    const valid = await (0, hash_1.comparePin)(data.pin, child.pinHash);
    if (!valid) {
        throw { statusCode: 401, message: 'الرمز السري غير صحيح' };
    }
    const accessToken = fastify.jwt.sign({ id: child.id, parentId: child.parentId, type: 'child' }, { expiresIn: '7d' });
    return {
        child: {
            id: child.id,
            parentId: child.parentId,
            name: child.name,
            avatar: child.avatar,
            gender: child.gender,
            color: child.color,
            level: child.level,
            xp: child.xp,
            stars: child.stars,
        },
        accessToken,
    };
}
// =============================================
// Refresh Token
// =============================================
async function refreshAccessToken(fastify, data) {
    let payload;
    try {
        payload = fastify.jwt.verify(data.refreshToken, {
            secret: process.env.JWT_REFRESH_SECRET,
        });
    }
    catch {
        throw { statusCode: 401, message: 'Refresh token غير صالح' };
    }
    const session = await database_1.default.session.findUnique({
        where: { refreshToken: data.refreshToken },
        include: { parent: { select: { id: true, email: true } } },
    });
    if (!session || session.expiresAt < new Date()) {
        throw { statusCode: 401, message: 'الجلسة منتهية' };
    }
    const accessToken = fastify.jwt.sign({ id: session.parent.id, email: session.parent.email, type: 'parent' }, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    return { accessToken };
}
// =============================================
// Logout
// =============================================
async function logoutParent(refreshToken) {
    await database_1.default.session.deleteMany({ where: { refreshToken } });
}
// =============================================
// Get current parent
// =============================================
async function getMe(parentId) {
    return database_1.default.parent.findUnique({
        where: { id: parentId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isPremium: true,
            premiumExpiresAt: true,
            language: true,
            createdAt: true,
            _count: { select: { children: true } },
        },
    });
}
// =============================================
// Helper: Create Session & Return Tokens
// =============================================
async function createSession(fastify, parentId) {
    const parent = await database_1.default.parent.findUnique({
        where: { id: parentId },
        select: { id: true, email: true },
    });
    if (!parent)
        throw { statusCode: 404, message: 'الوالد غير موجود' };
    const session = await database_1.default.session.create({
        data: {
            parentId,
            refreshToken: (0, uuid_1.v4)(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });
    const accessToken = fastify.jwt.sign({ id: parent.id, email: parent.email, type: 'parent' }, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    return { accessToken, refreshToken: session.refreshToken };
}
async function saveParentFcmToken(parentId, fcmToken) {
    await database_1.default.parent.update({ where: { id: parentId }, data: { fcmToken } });
}
//# sourceMappingURL=auth.service.js.map