"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRoutes = notificationsRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const database_1 = __importDefault(require("../../config/database"));
const zod_1 = require("zod");
async function notificationsRoutes(fastify) {
    const auth = { preHandler: [auth_middleware_1.authenticateAny] };
    // Get all notifications (paginated)
    fastify.get('/', auth, async (request, reply) => {
        const user = request.user;
        const { page = '1', limit = '20' } = request.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [notifications, total] = await Promise.all([
            database_1.default.notification.findMany({
                where: { OR: [{ parentId: user.id }, { childId: user.id }] },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            database_1.default.notification.count({
                where: { OR: [{ parentId: user.id }, { childId: user.id }] },
            }),
        ]);
        return reply.send({ notifications, total, page: parseInt(page) });
    });
    // Get unread count
    fastify.get('/unread-count', auth, async (request, reply) => {
        const user = request.user;
        const count = await database_1.default.notification.count({
            where: {
                OR: [{ parentId: user.id }, { childId: user.id }],
                isRead: false,
            },
        });
        return reply.send({ count });
    });
    // Mark as read
    fastify.put('/:id/read', auth, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        await database_1.default.notification.updateMany({
            where: {
                id,
                OR: [{ parentId: user.id }, { childId: user.id }],
            },
            data: { isRead: true },
        });
        return reply.send({ success: true });
    });
    // Mark all as read
    fastify.put('/read-all', auth, async (request, reply) => {
        const user = request.user;
        await database_1.default.notification.updateMany({
            where: {
                OR: [{ parentId: user.id }, { childId: user.id }],
                isRead: false,
            },
            data: { isRead: true },
        });
        return reply.send({ success: true });
    });
    // Get unread child message notifications for parent (battle pass messages)
    fastify.get('/parent-messages', { preHandler: [auth_middleware_1.authenticate] }, async (request, reply) => {
        const user = request.user;
        const messages = await database_1.default.notification.findMany({
            where: {
                parentId: user.id,
                type: 'battle_pass_unlock',
                isRead: false,
            },
            orderBy: { createdAt: 'asc' },
        });
        // Filter to only child_message category
        const childMessages = messages.filter((n) => {
            const d = n.data;
            return d?.category === 'child_message';
        });
        return reply.send(childMessages);
    });
    // Register FCM token for parent
    fastify.post('/fcm-token', auth, async (request, reply) => {
        const user = request.user;
        const { fcmToken } = zod_1.z.object({ fcmToken: zod_1.z.string().min(1) }).parse(request.body);
        await database_1.default.parent.update({ where: { id: user.id }, data: { fcmToken } });
        return reply.send({ success: true });
    });
    // Delete notification
    fastify.delete('/:id', auth, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        await database_1.default.notification.deleteMany({
            where: { id, OR: [{ parentId: user.id }, { childId: user.id }] },
        });
        return reply.status(204).send();
    });
}
//# sourceMappingURL=notifications.routes.js.map