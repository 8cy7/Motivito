import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createChildSchema,
  updateChildSchema,
  resetChildPinSchema,
  setupPinSchema,
  changeChildPinSchema,
  linkDeviceSchema,
  updateFcmSchema,
} from './children.schema';
import * as childrenService from './children.service';

export async function getChildren(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const children = await childrenService.getChildren(user.id);
  return reply.send(children);
}

export async function getChild(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const child = await childrenService.getChild(id, user.id);
  return reply.send(child);
}

export async function getChildSelf(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const child = await childrenService.getChildSelf(user.id);
  return reply.send(child);
}

export async function createChild(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const data = createChildSchema.parse(request.body);
  const child = await childrenService.createChild(user.id, data);
  return reply.status(201).send(child);
}

export async function updateChild(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const data = updateChildSchema.parse(request.body);
  const child = await childrenService.updateChild(id, user.id, data);
  return reply.send(child);
}

export async function deleteChild(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  await childrenService.deleteChild(id, user.id);
  return reply.status(204).send();
}

// الأب يعيد ضبط PIN الطفل (لا يحتاج القديم)
export async function resetChildPin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const data = resetChildPinSchema.parse(request.body);
  await childrenService.resetChildPin(id, user.id, data);
  return reply.send({ message: 'تم إعادة ضبط رمز الطفل بنجاح' });
}

// الطفل يُعيّن رمزه لأول مرة بعد QR (child JWT)
export async function setupPin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const data = setupPinSchema.parse(request.body);
  const result = await childrenService.setupChildPin(user.id, data);
  return reply.send(result);
}

// الطفل يغيّر رمزه (يعرف القديم) (child JWT)
export async function changeChildPin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const data = changeChildPinSchema.parse(request.body);
  const result = await childrenService.changeChildPin(user.id, data);
  return reply.send(result);
}

export async function togglePinChild(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const result = await childrenService.togglePinChild(id, user.id);
  return reply.send(result);
}

export async function generateQR(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const result = await childrenService.generateQRCode(id, user.id);
  return reply.send(result);
}

export async function linkDevice(request: FastifyRequest, reply: FastifyReply) {
  const data = linkDeviceSchema.parse(request.body);
  const result = await childrenService.linkDevice(request.server, data);
  return reply.send(result);
}

export async function updateFcmToken(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const { fcmToken } = updateFcmSchema.parse(request.body);
  await childrenService.updateChildFcmToken(id, user.id, fcmToken);
  return reply.send({ message: 'تم تحديث FCM token' });
}

export async function saveChildFcmToken(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { fcmToken } = request.body as { fcmToken: string };
  await childrenService.saveChildFcmTokenSelf(user.id, fcmToken);
  return reply.send({ ok: true });
}


export async function claimChallenge(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { challengeIndex } = request.body as { challengeIndex: number };
  if (typeof challengeIndex !== 'number') {
    return reply.status(400).send({ error: 'challengeIndex مطلوب' });
  }
  const result = await childrenService.claimChallenge(user.id, challengeIndex);
  return reply.send(result);
}
