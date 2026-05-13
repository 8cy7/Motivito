import { FastifyRequest, FastifyReply } from 'fastify';
import {
  registerSchema,
  loginSchema,
  loginPinSchema,
  childLoginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import * as authService from './auth.service';

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const data = registerSchema.parse(request.body);
  const result = await authService.registerParent(request.server, data);
  return reply.status(201).send(result);
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const data = loginSchema.parse(request.body);
  const result = await authService.loginParent(request.server, data);
  return reply.send(result);
}

export async function loginPin(request: FastifyRequest, reply: FastifyReply) {
  const data = loginPinSchema.parse(request.body);
  const result = await authService.loginParentPin(request.server, data);
  return reply.send(result);
}

export async function childLogin(request: FastifyRequest, reply: FastifyReply) {
  const data = childLoginSchema.parse(request.body);
  const result = await authService.loginChild(request.server, data);
  return reply.send(result);
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const data = refreshSchema.parse(request.body);
  const result = await authService.refreshAccessToken(request.server, data);
  return reply.send(result);
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = request.body as any;
  if (refreshToken) {
    await authService.logoutParent(refreshToken);
  }
  return reply.send({ message: 'تم تسجيل الخروج' });
}

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const parent = await authService.getMe(user.id);
  if (!parent) return reply.status(404).send({ error: 'not_found' });
  return reply.send(parent);
}

export async function saveFcmToken(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { fcmToken } = request.body as { fcmToken: string };
  await authService.saveParentFcmToken(user.id, fcmToken);
  return reply.send({ ok: true });
}

export async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  const { email } = forgotPasswordSchema.parse(request.body);
  // TODO: إرسال بريد إعادة التعيين عبر Resend
  return reply.send({ message: 'إذا كان البريد مسجلاً، ستصل رسالة إعادة التعيين' });
}

export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const data = resetPasswordSchema.parse(request.body);
  // TODO: التحقق من token وتحديث كلمة المرور
  return reply.send({ message: 'تم تغيير كلمة المرور بنجاح' });
}
