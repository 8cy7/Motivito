import { FastifyInstance } from 'fastify';
import prisma from '../../config/database';
import redis from '../../config/redis';
import { hashPassword, comparePassword, hashPin, comparePin } from '../../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import type {
  RegisterInput,
  LoginInput,
  LoginPinInput,
  ChildLoginInput,
  RefreshInput,
} from './auth.schema';

// =============================================
// Register Parent
// =============================================
export async function registerParent(fastify: FastifyInstance, data: RegisterInput) {
  const existing = await prisma.parent.findUnique({ where: { email: data.email } });
  if (existing) {
    throw { statusCode: 409, message: 'البريد الإلكتروني مسجل مسبقاً' };
  }

  const passwordHash = await hashPassword(data.password);
  const parentPinHash = await hashPin(data.parentPin);

  const parent = await prisma.parent.create({
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
export async function loginParent(fastify: FastifyInstance, data: LoginInput) {
  const parent = await prisma.parent.findUnique({ where: { email: data.email } });
  if (!parent) {
    throw { statusCode: 401, message: 'بيانات الدخول غير صحيحة' };
  }

  const valid = await comparePassword(data.password, parent.passwordHash);
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
export async function loginParentPin(fastify: FastifyInstance, data: LoginPinInput) {
  const parent = await prisma.parent.findUnique({ where: { email: data.email } });
  if (!parent) {
    throw { statusCode: 401, message: 'بيانات الدخول غير صحيحة' };
  }

  const valid = await comparePin(data.parentPin, parent.parentPinHash);
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
export async function loginChild(fastify: FastifyInstance, data: ChildLoginInput) {
  const child = await prisma.child.findUnique({
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

  const valid = await comparePin(data.pin, child.pinHash);
  if (!valid) {
    throw { statusCode: 401, message: 'الرمز السري غير صحيح' };
  }

  const accessToken = fastify.jwt.sign(
    { id: child.id, parentId: child.parentId, type: 'child' },
    { expiresIn: '7d' }
  );

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
export async function refreshAccessToken(fastify: FastifyInstance, data: RefreshInput) {
  let payload: any;
  try {
    payload = fastify.jwt.verify(data.refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    } as any);
  } catch {
    throw { statusCode: 401, message: 'Refresh token غير صالح' };
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken: data.refreshToken },
    include: { parent: { select: { id: true, email: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    throw { statusCode: 401, message: 'الجلسة منتهية' };
  }

  const accessToken = fastify.jwt.sign(
    { id: session.parent.id, email: session.parent.email, type: 'parent' },
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  return { accessToken };
}

// =============================================
// Logout
// =============================================
export async function logoutParent(refreshToken: string) {
  await prisma.session.deleteMany({ where: { refreshToken } });
}

// =============================================
// Get current parent
// =============================================
export async function getMe(parentId: string) {
  return prisma.parent.findUnique({
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
async function createSession(fastify: FastifyInstance, parentId: string) {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    select: { id: true, email: true },
  });
  if (!parent) throw { statusCode: 404, message: 'الوالد غير موجود' };

  const session = await prisma.session.create({
    data: {
      parentId,
      refreshToken: uuidv4(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const accessToken = fastify.jwt.sign(
    { id: parent.id, email: parent.email, type: 'parent' },
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  return { accessToken, refreshToken: session.refreshToken };
}

export async function saveParentFcmToken(parentId: string, fcmToken: string) {
  await prisma.parent.update({ where: { id: parentId }, data: { fcmToken } });
}
