"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authenticateChild = authenticateChild;
exports.authenticateAny = authenticateAny;
exports.requirePremium = requirePremium;
const database_1 = __importDefault(require("../config/database"));
async function authenticate(request, reply) {
    try {
        await request.jwtVerify();
        const payload = request.user;
        if (payload.type !== 'parent') {
            return reply.status(403).send({ error: 'Parent access required' });
        }
    }
    catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}
async function authenticateChild(request, reply) {
    try {
        await request.jwtVerify();
        const payload = request.user;
        if (payload.type !== 'child') {
            return reply.status(403).send({ error: 'Child access required' });
        }
    }
    catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}
async function authenticateAny(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}
async function requirePremium(request, reply) {
    const user = request.user;
    const parent = await database_1.default.parent.findUnique({
        where: { id: user.id },
        select: { isPremium: true, premiumExpiresAt: true },
    });
    if (!parent?.isPremium) {
        return reply.status(403).send({
            error: 'premium_required',
            message: 'هذه الميزة متاحة للمشتركين Premium فقط',
        });
    }
    if (parent.premiumExpiresAt && parent.premiumExpiresAt < new Date()) {
        await database_1.default.parent.update({
            where: { id: user.id },
            data: { isPremium: false },
        });
        return reply.status(403).send({
            error: 'premium_expired',
            message: 'انتهى اشتراكك Premium',
        });
    }
}
//# sourceMappingURL=auth.middleware.js.map