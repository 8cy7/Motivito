"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.battlePassRoutes = battlePassRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const database_1 = __importDefault(require("../../config/database"));
const gamification_1 = require("../../utils/gamification");
async function battlePassRoutes(fastify) {
    const premiumAuth = { preHandler: [auth_middleware_1.authenticate, auth_middleware_1.requirePremium] };
    const childAuth = { preHandler: [auth_middleware_1.authenticateChild] };
    // Child: get own claimed battle pass levels
    fastify.get('/my-unlocks', childAuth, async (request, reply) => {
        const user = request.user;
        const unlocks = await database_1.default.battlePassUnlock.findMany({
            where: { childId: user.id },
            select: { level: true },
            orderBy: { level: 'asc' },
        });
        return reply.send({ claimedLevels: unlocks.map((u) => u.level) });
    });
    // Child: claim a battle pass reward
    fastify.post('/claim', childAuth, async (request, reply) => {
        const user = request.user;
        const { level } = request.body;
        const child = await database_1.default.child.findUnique({
            where: { id: user.id },
            select: { id: true, name: true, level: true, gender: true, parentId: true, unlockedEmojis: true },
        });
        if (!child)
            return reply.status(404).send({ error: 'الطفل غير موجود' });
        if (child.level < level)
            return reply.status(400).send({ error: 'المستوى غير مكتمل بعد' });
        const allRewards = (0, gamification_1.getBattlePassProgress)(child.gender);
        const reward = allRewards.find((r) => r.level === level);
        if (!reward)
            return reply.status(404).send({ error: 'المكافأة غير موجودة' });
        // Upsert to avoid duplicate claims
        const existing = await database_1.default.battlePassUnlock.findUnique({
            where: { childId_level: { childId: child.id, level } },
        });
        if (existing)
            return reply.send({ success: true, alreadyClaimed: true, unlockedEmojis: child.unlockedEmojis });
        await database_1.default.battlePassUnlock.create({
            data: {
                childId: child.id,
                level,
                rewardType: reward.type,
                rewardData: reward.data,
            },
        });
        let updatedEmojis = child.unlockedEmojis;
        // Emoji reward: unlock in child profile
        if (reward.type === 'emoji') {
            const emojiData = reward.data;
            if (!updatedEmojis.includes(emojiData.emoji)) {
                updatedEmojis = [...updatedEmojis, emojiData.emoji];
                await database_1.default.child.update({
                    where: { id: child.id },
                    data: { unlockedEmojis: updatedEmojis },
                });
            }
        }
        // Message reward: queue notification for parent
        if (reward.type === 'message') {
            const msgData = reward.data;
            await database_1.default.notification.create({
                data: {
                    parentId: child.parentId,
                    type: 'battle_pass_unlock',
                    title: `رسالة من ${child.name} 💌`,
                    body: msgData.text,
                    data: { category: 'child_message', childName: child.name, text: msgData.text, level },
                    isRead: false,
                },
            });
        }
        return reply.send({ success: true, unlockedEmojis: updatedEmojis });
    });
    // Get full battle pass status for a child
    fastify.get('/:childId', premiumAuth, async (request, reply) => {
        const user = request.user;
        const { childId } = request.params;
        const child = await database_1.default.child.findFirst({
            where: { id: childId, parentId: user.id },
            include: { battlePassUnlocks: { orderBy: { level: 'asc' } } },
        });
        if (!child)
            return reply.status(404).send({ error: 'الطفل غير موجود' });
        const allRewards = (0, gamification_1.getBattlePassProgress)(child.gender);
        const unlockedLevels = new Set(child.battlePassUnlocks.map((u) => u.level));
        const battlePass = allRewards.map((reward) => ({
            level: reward.level,
            type: reward.type,
            data: reward.data,
            isUnlocked: unlockedLevels.has(reward.level),
            isReachable: child.level >= reward.level,
        }));
        return reply.send({
            child: { id: child.id, name: child.name, level: child.level },
            battlePass,
            totalUnlocked: child.battlePassUnlocks.length,
        });
    });
    // Get only unlocked rewards
    fastify.get('/:childId/unlocks', premiumAuth, async (request, reply) => {
        const user = request.user;
        const { childId } = request.params;
        const child = await database_1.default.child.findFirst({
            where: { id: childId, parentId: user.id },
        });
        if (!child)
            return reply.status(404).send({ error: 'الطفل غير موجود' });
        const unlocks = await database_1.default.battlePassUnlock.findMany({
            where: { childId },
            orderBy: { level: 'asc' },
        });
        return reply.send(unlocks);
    });
}
//# sourceMappingURL=battle-pass.routes.js.map