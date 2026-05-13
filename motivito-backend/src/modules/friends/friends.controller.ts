import { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './friends.service';

export async function getMyProfile(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user as any;
  const data = await service.getMyProfile(id);
  reply.send(data);
}

export async function sendRequest(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user as any;
  const { friendCode } = req.body as any;
  if (!friendCode) return reply.status(400).send({ error: 'friendCode مطلوب' });
  const result = await service.sendRequest(id, friendCode.trim().toUpperCase());
  if (result.error) return reply.status(400).send(result);
  reply.send(result);
}

export async function getIncoming(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user as any;
  const data = await service.getIncomingRequests(id);
  reply.send(data);
}

export async function acceptRequest(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user as any;
  const { requestId } = req.params as any;
  const result = await service.acceptRequest(requestId, id);
  if (result.error) return reply.status(400).send(result);
  reply.send(result);
}

export async function rejectRequest(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user as any;
  const { requestId } = req.params as any;
  const result = await service.rejectRequest(requestId, id);
  if (result.error) return reply.status(400).send(result);
  reply.send(result);
}

export async function getFriends(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user as any;
  const data = await service.getFriends(id);
  reply.send(data);
}

export async function removeFriend(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user as any;
  const { friendId } = req.params as any;
  const result = await service.removeFriend(id, friendId);
  reply.send(result);
}
