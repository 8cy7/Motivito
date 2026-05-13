import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createRewardSchema,
  updateRewardSchema,
  rewardRequestSchema,
  rejectRewardRequestSchema,
} from './rewards.schema';
import * as rewardsService from './rewards.service';

// --- Rewards ---
export async function getRewardsForChild(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const rewards = await rewardsService.getRewardsForChild(user.id);
  return reply.send(rewards);
}

export async function getRewards(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { childId } = request.query as any;
  const rewards = await rewardsService.getRewards(user.id, childId);
  return reply.send(rewards);
}

export async function getSuggestions(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { childId } = request.query as any;
  if (!childId) return reply.status(400).send({ error: 'childId مطلوب' });
  const suggestions = await rewardsService.getRewardSuggestions(user.id, childId);
  return reply.send(suggestions);
}

export async function createReward(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const data = createRewardSchema.parse(request.body);
  const reward = await rewardsService.createReward(user.id, data);
  return reply.status(201).send(reward);
}

export async function updateReward(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const data = updateRewardSchema.parse(request.body);
  const reward = await rewardsService.updateReward(id, user.id, data);
  return reply.send(reward);
}

export async function deleteReward(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  await rewardsService.deleteReward(id, user.id);
  return reply.status(204).send();
}

// --- Reward Requests ---
export async function getPendingRequests(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const requests = await rewardsService.getPendingRequests(user.id);
  return reply.send(requests);
}

export async function requestReward(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const data = rewardRequestSchema.parse(request.body);
  const result = await rewardsService.requestReward(user.id, data);
  return reply.status(201).send(result);
}

export async function deliverReward(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const result = await rewardsService.deliverReward(id, user.id);
  return reply.send(result);
}

export async function rejectRewardRequest(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const data = rejectRewardRequestSchema.parse(request.body || {});
  const result = await rewardsService.rejectRewardRequest(id, user.id, data);
  return reply.send(result);
}

export async function getRequestHistory(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { childId } = request.query as any;
  const history = await rewardsService.getRequestHistory(user.id, childId);
  return reply.send(history);
}
