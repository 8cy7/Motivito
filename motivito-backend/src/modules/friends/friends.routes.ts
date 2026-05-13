import { FastifyInstance } from 'fastify';
import { authenticateChild } from '../../middleware/auth.middleware';
import * as controller from './friends.controller';

export async function friendsRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticateChild] };

  fastify.get('/me',                         auth, controller.getMyProfile);
  fastify.post('/request',                   auth, controller.sendRequest);
  fastify.get('/requests/incoming',          auth, controller.getIncoming);
  fastify.post('/requests/:requestId/accept', auth, controller.acceptRequest);
  fastify.post('/requests/:requestId/reject', auth, controller.rejectRequest);
  fastify.get('/',                           auth, controller.getFriends);
  fastify.delete('/:friendId',               auth, controller.removeFriend);
}
