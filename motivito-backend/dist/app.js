"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
require("dotenv/config"); // تحميل .env أولاً
require("./config/env"); // Validate env variables
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const env_1 = require("./config/env");
const firebase_1 = require("./config/firebase");
const apns_1 = require("./utils/apns");
const errorHandler_1 = require("./middleware/errorHandler");
const renewDailyTasks_1 = require("./jobs/renewDailyTasks");
// Routes
const auth_routes_1 = require("./modules/auth/auth.routes");
const children_routes_1 = require("./modules/children/children.routes");
const tasks_routes_1 = require("./modules/tasks/tasks.routes");
const rewards_routes_1 = require("./modules/rewards/rewards.routes");
const notifications_routes_1 = require("./modules/notifications/notifications.routes");
const analytics_routes_1 = require("./modules/analytics/analytics.routes");
const ai_routes_1 = require("./modules/ai/ai.routes");
const battle_pass_routes_1 = require("./modules/battle-pass/battle-pass.routes");
const achievements_routes_1 = require("./modules/achievements/achievements.routes");
const subscriptions_routes_1 = require("./modules/subscriptions/subscriptions.routes");
const settings_routes_1 = require("./modules/settings/settings.routes");
const upload_routes_1 = require("./modules/upload/upload.routes");
const friends_routes_1 = require("./modules/friends/friends.routes");
// =============================================
// Build Fastify App
// =============================================
const fastify = (0, fastify_1.default)({
    logger: env_1.env.NODE_ENV === 'development' ? { level: 'info' } : { level: 'error' },
    trustProxy: true,
});
async function buildApp() {
    // ---- Security Plugins ----
    await fastify.register(helmet_1.default, {
        contentSecurityPolicy: false,
    });
    await fastify.register(cors_1.default, {
        origin: env_1.env.CORS_ORIGINS.split(','),
        credentials: true,
    });
    await fastify.register(rate_limit_1.default, {
        global: true,
        max: 100,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
            error: 'rate_limit_exceeded',
            message: 'تجاوزت الحد المسموح به من الطلبات، حاول لاحقاً',
        }),
    });
    // ---- JWT ----
    await fastify.register(jwt_1.default, {
        secret: env_1.env.JWT_SECRET,
    });
    // ---- Error Handler ----
    fastify.setErrorHandler(errorHandler_1.errorHandler);
    // ---- Health Check ----
    fastify.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env_1.env.NODE_ENV,
    }));
    // ---- API Routes ----
    fastify.register(auth_routes_1.authRoutes, { prefix: '/api/auth' });
    fastify.register(children_routes_1.childrenRoutes, { prefix: '/api/children' });
    fastify.register(tasks_routes_1.tasksRoutes, { prefix: '/api/tasks' });
    fastify.register(rewards_routes_1.rewardsRoutes, { prefix: '/api/rewards' });
    fastify.register(rewards_routes_1.rewardRequestsRoutes, { prefix: '/api/reward-requests' });
    fastify.register(notifications_routes_1.notificationsRoutes, { prefix: '/api/notifications' });
    fastify.register(analytics_routes_1.analyticsRoutes, { prefix: '/api/analytics' });
    fastify.register(ai_routes_1.aiRoutes, { prefix: '/api/ai' });
    fastify.register(battle_pass_routes_1.battlePassRoutes, { prefix: '/api/battle-pass' });
    fastify.register(achievements_routes_1.achievementsRoutes, { prefix: '/api/achievements' });
    fastify.register(subscriptions_routes_1.subscriptionsRoutes, { prefix: '/api/subscriptions' });
    fastify.register(settings_routes_1.settingsRoutes, { prefix: '/api/settings' });
    fastify.register(upload_routes_1.uploadRoutes, { prefix: '/api/upload' });
    fastify.register(friends_routes_1.friendsRoutes, { prefix: '/api/friends' });
    return fastify;
}
// =============================================
// Start Server
// =============================================
async function start() {
    try {
        // Initialize Firebase (optional, if configured)
        (0, firebase_1.initFirebase)();
        // Initialize APNs
        (0, apns_1.initApns)();
        const app = await buildApp();
        await app.listen({
            port: parseInt(env_1.env.PORT),
            host: '0.0.0.0',
        });
        console.log(`
🚀 Motivito Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port:        ${env_1.env.PORT}
🌍 Environment: ${env_1.env.NODE_ENV}
🔗 URL:         ${env_1.env.APP_URL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Auth API:         /api/auth
✅ Children API:     /api/children
✅ Tasks API:        /api/tasks
✅ Rewards API:      /api/rewards
✅ Notifications:    /api/notifications
✅ Analytics:        /api/analytics (Premium)
✅ AI Chat:          /api/ai (Premium)
✅ Battle Pass:      /api/battle-pass (Premium)
✅ Achievements:     /api/achievements (Premium)
✅ Subscriptions:    /api/subscriptions
✅ Settings:         /api/settings
✅ Upload:           /api/upload
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
        // Start Cron Jobs
        (0, renewDailyTasks_1.startAllCronJobs)();
    }
    catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=app.js.map