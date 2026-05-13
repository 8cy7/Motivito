"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementsRoutes = achievementsRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const database_1 = __importDefault(require("../../config/database"));
async function achievementsRoutes(fastify) {
    const premiumAuth = { preHandler: [auth_middleware_1.authenticate, auth_middleware_1.requirePremium] };
    // All achievements for a child
    fastify.get('/:childId', premiumAuth, async (request, reply) => {
        const user = request.user;
        const { childId } = request.params;
        const child = await database_1.default.child.findFirst({
            where: { id: childId, parentId: user.id },
            include: {
                badges: { orderBy: { earnedDate: 'desc' } },
                battlePassUnlocks: { orderBy: { level: 'asc' } },
                _count: { select: { tasks: { where: { approvalStatus: 'approved' } } } },
            },
        });
        if (!child)
            return reply.status(404).send({ error: 'الطفل غير موجود' });
        return reply.send(child);
    });
    // Badges only
    fastify.get('/:childId/badges', premiumAuth, async (request, reply) => {
        const user = request.user;
        const { childId } = request.params;
        const child = await database_1.default.child.findFirst({
            where: { id: childId, parentId: user.id },
        });
        if (!child)
            return reply.status(404).send({ error: 'الطفل غير موجود' });
        const badges = await database_1.default.badge.findMany({
            where: { childId },
            orderBy: { earnedDate: 'desc' },
        });
        return reply.send(badges);
    });
}
//# sourceMappingURL=achievements.routes.js.map