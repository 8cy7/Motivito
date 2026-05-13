import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createTaskSchema,
  updateTaskSchema,
  completeTaskSchema,
  rejectTaskSchema,
  bulkCreateTasksSchema,
} from './tasks.schema';
import * as tasksService from './tasks.service';

export async function getTasks(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { childId } = request.query as any;
  if (!childId) return reply.status(400).send({ error: 'childId مطلوب' });
  const tasks = await tasksService.getTasks(user.id, childId);
  return reply.send(tasks);
}

export async function getTask(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const task = await tasksService.getTask(id, user.id);
  return reply.send(task);
}

export async function createTask(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const data = createTaskSchema.parse(request.body);
  const task = await tasksService.createTask(user.id, data);
  return reply.status(201).send(task);
}

export async function bulkCreateTasks(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const data = bulkCreateTasksSchema.parse(request.body);
  const tasks = await tasksService.bulkCreateTasks(user.id, data);
  return reply.status(201).send(tasks);
}

export async function updateTask(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const data = updateTaskSchema.parse(request.body);
  const task = await tasksService.updateTask(id, user.id, data);
  return reply.send(task);
}

export async function deleteTask(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  await tasksService.deleteTask(id, user.id);
  return reply.status(204).send();
}

export async function getChildTasks(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  // user.id is childId (from child JWT)
  const tasks = await tasksService.getChildTasks(user.id);
  return reply.send(tasks);
}

export async function completeTask(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const data = completeTaskSchema.parse(request.body || {});
  // user.id here is childId (child JWT)
  const result = await tasksService.completeTask(id, user.id, data);
  return reply.send(result);
}

export async function approveTask(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const result = await tasksService.approveTask(id, user.id);
  return reply.send(result);
}

export async function rejectTask(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const { id } = request.params as any;
  const data = rejectTaskSchema.parse(request.body || {});
  const result = await tasksService.rejectTask(id, user.id, data);
  return reply.send(result);
}

export async function getPendingApproval(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const tasks = await tasksService.getPendingApproval(user.id);
  return reply.send(tasks);
}

export async function getChildStats(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  // user.id is childId (child JWT)
  const stats = await tasksService.getChildTaskStats(user.id);
  return reply.send(stats);
}
