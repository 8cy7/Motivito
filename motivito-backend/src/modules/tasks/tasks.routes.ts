import { FastifyInstance } from 'fastify';
import { authenticate, authenticateChild } from '../../middleware/auth.middleware';
import * as controller from './tasks.controller';

export async function tasksRoutes(fastify: FastifyInstance) {
  const parentAuth = { preHandler: [authenticate] };
  const childAuth = { preHandler: [authenticateChild] };

  fastify.get('/', parentAuth, controller.getTasks);
  fastify.post('/', parentAuth, controller.createTask);
  fastify.post('/bulk', parentAuth, controller.bulkCreateTasks);
  fastify.get('/pending-approval', parentAuth, controller.getPendingApproval);
  fastify.get('/mine', childAuth, controller.getChildTasks);
  fastify.get('/stats', childAuth, controller.getChildStats);
  fastify.get('/:id', parentAuth, controller.getTask);
  fastify.put('/:id', parentAuth, controller.updateTask);
  fastify.delete('/:id', parentAuth, controller.deleteTask);

  // Task workflow
  fastify.post('/:id/complete', childAuth, controller.completeTask);
  fastify.post('/:id/approve', parentAuth, controller.approveTask);
  fastify.post('/:id/reject', parentAuth, controller.rejectTask);
}
