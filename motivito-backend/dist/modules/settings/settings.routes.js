"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = settingsRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const database_1 = __importDefault(require("../../config/database"));
const zod_1 = require("zod");
const hash_1 = require("../../utils/hash");
async function settingsRoutes(fastify) {
    const auth = { preHandler: [auth_middleware_1.authenticate] };
    // Get settings
    fastify.get('/', auth, async (request, reply) => {
        const user = request.user;
        const parent = await database_1.default.parent.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isPremium: true,
                premiumExpiresAt: true,
                language: true,
                createdAt: true,
            },
        });
        return reply.send(parent);
    });
    // Update profile
    fastify.put('/profile', auth, async (request, reply) => {
        const user = request.user;
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2).max(50).optional(),
            phone: zod_1.z.string().optional(),
            language: zod_1.z.enum(['ar', 'en']).optional(),
        });
        const data = schema.parse(request.body);
        const updated = await database_1.default.parent.update({
            where: { id: user.id },
            data,
            select: { id: true, name: true, phone: true, language: true },
        });
        return reply.send(updated);
    });
    // Change password
    fastify.put('/password', auth, async (request, reply) => {
        const user = request.user;
        const schema = zod_1.z.object({
            currentPassword: zod_1.z.string().min(1),
            newPassword: zod_1.z.string().min(8),
        });
        const { currentPassword, newPassword } = schema.parse(request.body);
        const parent = await database_1.default.parent.findUnique({
            where: { id: user.id },
            select: { passwordHash: true },
        });
        if (!parent)
            return reply.status(404).send({ error: 'not_found' });
        const valid = await (0, hash_1.comparePassword)(currentPassword, parent.passwordHash);
        if (!valid)
            return reply.status(400).send({ error: 'كلمة المرور الحالية غير صحيحة' });
        const newHash = await (0, hash_1.hashPassword)(newPassword);
        await database_1.default.parent.update({ where: { id: user.id }, data: { passwordHash: newHash } });
        return reply.send({ message: 'تم تغيير كلمة المرور' });
    });
    // Change parent PIN
    fastify.put('/parent-pin', auth, async (request, reply) => {
        const user = request.user;
        const schema = zod_1.z.object({
            currentPin: zod_1.z.string().length(4).regex(/^\d{4}$/),
            newPin: zod_1.z.string().length(4).regex(/^\d{4}$/),
        });
        const { currentPin, newPin } = schema.parse(request.body);
        const parent = await database_1.default.parent.findUnique({
            where: { id: user.id },
            select: { parentPinHash: true },
        });
        if (!parent)
            return reply.status(404).send({ error: 'not_found' });
        const valid = await (0, hash_1.comparePin)(currentPin, parent.parentPinHash);
        if (!valid)
            return reply.status(400).send({ error: 'PIN الحالي غير صحيح' });
        const newHash = await (0, hash_1.hashPin)(newPin);
        await database_1.default.parent.update({ where: { id: user.id }, data: { parentPinHash: newHash } });
        return reply.send({ message: 'تم تغيير PIN' });
    });
    // Change language
    fastify.put('/language', auth, async (request, reply) => {
        const user = request.user;
        const { language } = zod_1.z.object({ language: zod_1.z.enum(['ar', 'en']) }).parse(request.body);
        await database_1.default.parent.update({ where: { id: user.id }, data: { language } });
        return reply.send({ message: 'تم تغيير اللغة' });
    });
    // Delete account
    fastify.delete('/account', auth, async (request, reply) => {
        const user = request.user;
        const schema = zod_1.z.object({ password: zod_1.z.string().min(1) });
        const { password } = schema.parse(request.body);
        const parent = await database_1.default.parent.findUnique({
            where: { id: user.id },
            select: { passwordHash: true },
        });
        if (!parent)
            return reply.status(404).send({ error: 'not_found' });
        const valid = await (0, hash_1.comparePassword)(password, parent.passwordHash);
        if (!valid)
            return reply.status(400).send({ error: 'كلمة المرور غير صحيحة' });
        await database_1.default.parent.delete({ where: { id: user.id } });
        return reply.status(204).send();
    });
}
//# sourceMappingURL=settings.routes.js.map