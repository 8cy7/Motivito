import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { z } from 'zod';
import { hashPassword, comparePassword, hashPin, comparePin } from '../../utils/hash';

export async function settingsRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  // Get settings
  fastify.get('/', auth, async (request, reply) => {
    const user = request.user as any;
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isPremium: true,
        premiumExpiresAt: true,
        language: true,
        createdAt: true,
      },
    });
    return reply.send(parent);
  });

  // Update profile
  fastify.put('/profile', auth, async (request, reply) => {
    const user = request.user as any;
    const schema = z.object({
      name: z.string().min(2).max(50).optional(),
      phone: z.string().optional(),
      language: z.enum(['ar', 'en']).optional(),
    });
    const data = schema.parse(request.body);
    const updated = await prisma.parent.update({
      where: { id: user.id },
      data,
      select: { id: true, name: true, phone: true, language: true },
    });
    return reply.send(updated);
  });

  // Change password
  fastify.put('/password', auth, async (request, reply) => {
    const user = request.user as any;
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });
    const { currentPassword, newPassword } = schema.parse(request.body);

    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!parent) return reply.status(404).send({ error: 'not_found' });

    const valid = await comparePassword(currentPassword, parent.passwordHash);
    if (!valid) return reply.status(400).send({ error: 'كلمة المرور الحالية غير صحيحة' });

    const newHash = await hashPassword(newPassword);
    await prisma.parent.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    return reply.send({ message: 'تم تغيير كلمة المرور' });
  });

  // Change parent PIN
  fastify.put('/parent-pin', auth, async (request, reply) => {
    const user = request.user as any;
    const schema = z.object({
      currentPin: z.string().length(4).regex(/^\d{4}$/),
      newPin: z.string().length(4).regex(/^\d{4}$/),
    });
    const { currentPin, newPin } = schema.parse(request.body);

    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      select: { parentPinHash: true },
    });
    if (!parent) return reply.status(404).send({ error: 'not_found' });

    const valid = await comparePin(currentPin, parent.parentPinHash);
    if (!valid) return reply.status(400).send({ error: 'PIN الحالي غير صحيح' });

    const newHash = await hashPin(newPin);
    await prisma.parent.update({ where: { id: user.id }, data: { parentPinHash: newHash } });

    return reply.send({ message: 'تم تغيير PIN' });
  });

  // Change language
  fastify.put('/language', auth, async (request, reply) => {
    const user = request.user as any;
    const { language } = z.object({ language: z.enum(['ar', 'en']) }).parse(request.body);
    await prisma.parent.update({ where: { id: user.id }, data: { language } });
    return reply.send({ message: 'تم تغيير اللغة' });
  });

  // Delete account
  fastify.delete('/account', auth, async (request, reply) => {
    const user = request.user as any;
    const schema = z.object({ password: z.string().min(1) });
    const { password } = schema.parse(request.body);

    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!parent) return reply.status(404).send({ error: 'not_found' });

    const valid = await comparePassword(password, parent.passwordHash);
    if (!valid) return reply.status(400).send({ error: 'كلمة المرور غير صحيحة' });

    await prisma.parent.delete({ where: { id: user.id } });
    return reply.status(204).send();
  });
}
