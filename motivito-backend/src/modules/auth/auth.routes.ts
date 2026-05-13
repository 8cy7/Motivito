import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware';
import * as controller from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', controller.register);
  fastify.post('/login', controller.login);
  fastify.post('/login/pin', controller.loginPin);
  fastify.post('/child/login', controller.childLogin);
  fastify.post('/refresh', controller.refresh);
  fastify.post('/logout', controller.logout);
  fastify.post('/forgot-password', controller.forgotPassword);
  fastify.post('/reset-password', controller.resetPassword);
  fastify.get('/me', { preHandler: [authenticate] }, controller.getMe);
  fastify.post('/fcm-token', { preHandler: [authenticate] }, controller.saveFcmToken);
}
