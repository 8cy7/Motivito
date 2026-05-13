import { FastifyInstance } from 'fastify';
import { authenticate, authenticateChild } from '../../middleware/auth.middleware';
import * as controller from './children.controller';

export async function childrenRoutes(fastify: FastifyInstance) {
  const parentAuth = { preHandler: [authenticate] };
  const childAuth  = { preHandler: [authenticateChild] };

  // --- Parent routes ---
  fastify.get('/',               parentAuth, controller.getChildren);
  fastify.post('/',              parentAuth, controller.createChild);
  fastify.get('/:id',            parentAuth, controller.getChild);
  fastify.put('/:id',            parentAuth, controller.updateChild);
  fastify.delete('/:id',         parentAuth, controller.deleteChild);

  // الأب يعيد ضبط PIN الطفل (بدون الحاجة للقديم)
  fastify.put('/:id/pin',        parentAuth, controller.resetChildPin);
  fastify.put('/:id/toggle-pin', parentAuth, controller.togglePinChild);
  fastify.get('/:id/qr',         parentAuth, controller.generateQR);
  fastify.put('/:id/fcm-token',  parentAuth, controller.updateFcmToken);

  // --- بدون auth: الطفل يمسح QR ويحصل على JWT مؤقت ---
  fastify.post('/link-device', controller.linkDevice);

  // --- Child routes (بعد QR أو بعد تسجيل دخول) ---
  fastify.get('/me',                  childAuth, controller.getChildSelf);
  fastify.post('/me/claim-challenge', childAuth, controller.claimChallenge);
  fastify.post('/fcm-token',          childAuth, controller.saveChildFcmToken);
  // الطفل يختار رمزه لأول مرة (requiresPinSetup = true)
  fastify.post('/setup-pin',   childAuth, controller.setupPin);
  // الطفل يغيّر رمزه (يعرف القديم)
  fastify.put('/change-pin',   childAuth, controller.changeChildPin);
}
