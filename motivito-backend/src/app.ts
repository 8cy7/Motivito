import 'dotenv/config';   // تحميل .env أولاً
import './config/env';    // Validate env variables
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { initFirebase } from './config/firebase';
import { initApns } from './utils/apns';
import { errorHandler } from './middleware/errorHandler';
import { startAllCronJobs } from './jobs/renewDailyTasks';

// Routes
import { authRoutes } from './modules/auth/auth.routes';
import { childrenRoutes } from './modules/children/children.routes';
import { tasksRoutes } from './modules/tasks/tasks.routes';
import { rewardsRoutes, rewardRequestsRoutes } from './modules/rewards/rewards.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { battlePassRoutes } from './modules/battle-pass/battle-pass.routes';
import { achievementsRoutes } from './modules/achievements/achievements.routes';
import { subscriptionsRoutes } from './modules/subscriptions/subscriptions.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { uploadRoutes } from './modules/upload/upload.routes';
import { friendsRoutes } from './modules/friends/friends.routes';

// =============================================
// Build Fastify App
// =============================================
const fastify = Fastify({
  logger: env.NODE_ENV === 'development' ? { level: 'info' } : { level: 'error' },
  trustProxy: true,
});

async function buildApp() {
  // ---- Security Plugins ----
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(fastifyCors, {
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
  });

  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'rate_limit_exceeded',
      message: 'تجاوزت الحد المسموح به من الطلبات، حاول لاحقاً',
    }),
  });

  // ---- JWT ----
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  // ---- Error Handler ----
  fastify.setErrorHandler(errorHandler);

  // ---- Health Check ----
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }));

  // ---- API Routes ----
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(childrenRoutes, { prefix: '/api/children' });
  fastify.register(tasksRoutes, { prefix: '/api/tasks' });
  fastify.register(rewardsRoutes, { prefix: '/api/rewards' });
  fastify.register(rewardRequestsRoutes, { prefix: '/api/reward-requests' });
  fastify.register(notificationsRoutes, { prefix: '/api/notifications' });
  fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
  fastify.register(aiRoutes, { prefix: '/api/ai' });
  fastify.register(battlePassRoutes, { prefix: '/api/battle-pass' });
  fastify.register(achievementsRoutes, { prefix: '/api/achievements' });
  fastify.register(subscriptionsRoutes, { prefix: '/api/subscriptions' });
  fastify.register(settingsRoutes, { prefix: '/api/settings' });
  fastify.register(uploadRoutes, { prefix: '/api/upload' });
  fastify.register(friendsRoutes, { prefix: '/api/friends' });

  return fastify;
}

// =============================================
// Start Server
// =============================================
async function start() {
  try {
    // Initialize Firebase (optional, if configured)
    initFirebase();
    // Initialize APNs
    initApns();

    const app = await buildApp();

    await app.listen({
      port: parseInt(env.PORT),
      host: '0.0.0.0',
    });

    console.log(`
🚀 Motivito Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port:        ${env.PORT}
🌍 Environment: ${env.NODE_ENV}
🔗 URL:         ${env.APP_URL}
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
    startAllCronJobs();
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

export { buildApp };
