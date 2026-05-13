import { FastifyInstance } from 'fastify';
import { authenticate, authenticateChild } from '../../middleware/auth.middleware';
import * as controller from './rewards.controller';

export async function rewardsRoutes(fastify: FastifyInstance) {
  const parentAuth = { preHandler: [authenticate] };
  const childAuth = { preHandler: [authenticateChild] };

  // Child: get rewards available to them (must be before /:id)
  fastify.get('/mine', childAuth, controller.getRewardsForChild);

  // Rewards catalog
  fastify.get('/', parentAuth, controller.getRewards);
  fastify.get('/suggestions', parentAuth, controller.getSuggestions);
  fastify.post('/', parentAuth, controller.createReward);
  fastify.put('/:id', parentAuth, controller.updateReward);
  fastify.delete('/:id', parentAuth, controller.deleteReward);
}

export async function rewardRequestsRoutes(fastify: FastifyInstance) {
  const parentAuth = { preHandler: [authenticate] };
  const childAuth = { preHandler: [authenticateChild] };

  fastify.get('/', parentAuth, controller.getPendingRequests);
  fastify.post('/', childAuth, controller.requestReward);
  fastify.post('/:id/deliver', parentAuth, controller.deliverReward);
  fastify.post('/:id/reject', parentAuth, controller.rejectRewardRequest);
  fastify.get('/history', parentAuth, controller.getRequestHistory);
}
