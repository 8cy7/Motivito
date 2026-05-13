import { FastifyInstance } from 'fastify';

export interface JwtPayload {
  id: string;
  email: string;
  type: 'parent';
}

export interface ChildJwtPayload {
  id: string;
  parentId: string;
  type: 'child';
}

export function signAccessToken(fastify: FastifyInstance, payload: JwtPayload | ChildJwtPayload): string {
  return fastify.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
}

export function signRefreshToken(fastify: FastifyInstance, payload: { id: string; sessionId: string }): string {
  return (fastify.jwt as any).sign(payload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}
