"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsRoutes = subscriptionsRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const database_1 = __importDefault(require("../../config/database"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
async function subscriptionsRoutes(fastify) {
    const auth = { preHandler: [auth_middleware_1.authenticate] };
    // Get subscription status
    fastify.get('/status', auth, async (request, reply) => {
        const user = request.user;
        const subscription = await database_1.default.subscription.findUnique({
            where: { parentId: user.id },
        });
        const parent = await database_1.default.parent.findUnique({
            where: { id: user.id },
            select: { isPremium: true, premiumExpiresAt: true },
        });
        return reply.send({
            isPremium: parent?.isPremium || false,
            subscription,
        });
    });
    // Create checkout session (Tap Payments)
    fastify.post('/checkout', auth, async (request, reply) => {
        const user = request.user;
        if (!env_1.env.TAP_SECRET_KEY) {
            return reply.status(503).send({ error: 'بوابة الدفع غير متاحة' });
        }
        const parent = await database_1.default.parent.findUnique({
            where: { id: user.id },
            select: { name: true, email: true, phone: true },
        });
        if (!parent)
            return reply.status(404).send({ error: 'not_found' });
        try {
            const tapResponse = await axios_1.default.post('https://api.tap.company/v2/charges', {
                amount: parseFloat(env_1.env.SUBSCRIPTION_PRICE_SAR),
                currency: 'SAR',
                customer: {
                    first_name: parent.name,
                    email: parent.email,
                    phone: parent.phone ? { country_code: '966', number: parent.phone } : undefined,
                },
                source: { id: 'src_all' },
                redirect: { url: `${env_1.env.APP_URL}/subscription/callback` },
                metadata: { parentId: user.id },
                description: 'Motivito Premium Subscription',
            }, {
                headers: {
                    Authorization: `Bearer ${env_1.env.TAP_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            return reply.send({
                checkoutUrl: tapResponse.data.transaction?.url,
                chargeId: tapResponse.data.id,
            });
        }
        catch (err) {
            console.error('Tap error:', err.response?.data);
            return reply.status(502).send({ error: 'خطأ في بوابة الدفع' });
        }
    });
    // Tap Payments Webhook
    fastify.post('/webhook', {
        config: { rawBody: true },
    }, async (request, reply) => {
        const signature = request.headers['hashstring'];
        const body = request.rawBody;
        if (env_1.env.TAP_WEBHOOK_SECRET) {
            const expected = crypto_1.default
                .createHmac('sha256', env_1.env.TAP_WEBHOOK_SECRET)
                .update(body)
                .digest('hex');
            if (signature !== expected) {
                return reply.status(401).send({ error: 'Invalid signature' });
            }
        }
        const event = request.body;
        if (event.object === 'charge' && event.status === 'CAPTURED') {
            const parentId = event.metadata?.parentId;
            if (!parentId)
                return reply.send({ received: true });
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            await database_1.default.$transaction([
                database_1.default.subscription.upsert({
                    where: { parentId },
                    create: {
                        parentId,
                        status: 'active',
                        amount: event.amount,
                        currency: event.currency,
                        startDate: new Date(),
                        endDate,
                        tapChargeId: event.id,
                        paymentRef: event.reference?.payment,
                    },
                    update: {
                        status: 'active',
                        startDate: new Date(),
                        endDate,
                        tapChargeId: event.id,
                        paymentRef: event.reference?.payment,
                    },
                }),
                database_1.default.parent.update({
                    where: { id: parentId },
                    data: { isPremium: true, premiumExpiresAt: endDate },
                }),
            ]);
        }
        return reply.send({ received: true });
    });
    // Cancel subscription
    fastify.post('/cancel', auth, async (request, reply) => {
        const user = request.user;
        await database_1.default.subscription.update({
            where: { parentId: user.id },
            data: { autoRenew: false, status: 'cancelled' },
        });
        return reply.send({ message: 'تم إلغاء الاشتراك' });
    });
    // Subscription history
    fastify.get('/history', auth, async (request, reply) => {
        const user = request.user;
        const subscription = await database_1.default.subscription.findUnique({
            where: { parentId: user.id },
        });
        return reply.send(subscription ? [subscription] : []);
    });
}
//# sourceMappingURL=subscriptions.routes.js.map