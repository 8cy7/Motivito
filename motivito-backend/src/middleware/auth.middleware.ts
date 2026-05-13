import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const payload = request.user as any;
    if (payload.type !== 'parent') {
      return reply.status(403).send({ error: 'Parent access required' });
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function authenticateChild(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const payload = request.user as any;
    if (payload.type !== 'child') {
      return reply.status(403).send({ error: 'Child access required' });
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function authenticateAny(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function requirePremium(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });

  if (!parent?.isPremium) {
    return reply.status(403).send({
      error: 'premium_required',
      message: 'هذه الميزة متاحة للمشتركين Premium فقط',
    });
  }

  if (parent.premiumExpiresAt && parent.premiumExpiresAt < new Date()) {
    await prisma.parent.update({
      where: { id: user.id },
      data: { isPremium: false },
    });
    return reply.status(403).send({
      error: 'premium_expired',
      message: 'انتهى اشتراكك Premium',
    });
  }
}
