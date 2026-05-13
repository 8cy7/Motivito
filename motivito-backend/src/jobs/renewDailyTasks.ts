import cron from 'node-cron';
import prisma from '../config/database';
import { sendNotificationToChild } from '../utils/notifications';

// =============================================
// كل يوم الساعة 12:00 منتصف الليل - تجديد المهام اليومية
// =============================================
export function startDailyTasksRenewal() {
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 تجديد المهام اليومية...');

    try {
      const result = await prisma.task.updateMany({
        where: {
          frequency: 'daily',
          isActive: true,
          approvalStatus: { in: ['approved', 'rejected'] },
        },
        data: {
          isCompleted: false,
          completedAt: null,
          approvalStatus: 'pending',
          lastRenewedAt: new Date(),
          rejectionReason: null,
        },
      });

      console.log(`✅ تم تجديد ${result.count} مهمة يومية`);

      // Notify all children with active daily tasks
      await notifyAllChildrenDailyRenewal();
    } catch (err) {
      console.error('❌ خطأ في تجديد المهام اليومية:', err);
    }
  }, { timezone: 'Asia/Riyadh' });
}

// =============================================
// كل أحد الساعة 12:00 منتصف الليل - تجديد المهام الأسبوعية
// =============================================
export function startWeeklyTasksRenewal() {
  cron.schedule('0 0 * * 0', async () => {
    console.log('🔄 تجديد المهام الأسبوعية...');

    try {
      const result = await prisma.task.updateMany({
        where: {
          frequency: 'weekly',
          isActive: true,
          approvalStatus: { in: ['approved', 'rejected'] },
        },
        data: {
          isCompleted: false,
          completedAt: null,
          approvalStatus: 'pending',
          lastRenewedAt: new Date(),
          rejectionReason: null,
        },
      });

      console.log(`✅ تم تجديد ${result.count} مهمة أسبوعية`);
    } catch (err) {
      console.error('❌ خطأ في تجديد المهام الأسبوعية:', err);
    }
  }, { timezone: 'Asia/Riyadh' });
}

// =============================================
// كل يوم الساعة 6 صباحاً - فحص انتهاء الاشتراكات
// =============================================
export function startSubscriptionExpireCheck() {
  cron.schedule('0 6 * * *', async () => {
    console.log('🔄 فحص انتهاء الاشتراكات...');

    try {
      const expiredSubs = await prisma.subscription.findMany({
        where: { status: 'active', endDate: { lte: new Date() } },
      });

      for (const sub of expiredSubs) {
        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'expired' },
          }),
          prisma.parent.update({
            where: { id: sub.parentId },
            data: { isPremium: false },
          }),
        ]);
      }

      if (expiredSubs.length > 0) {
        console.log(`✅ تم تحديث ${expiredSubs.length} اشتراك منتهي`);
      }
    } catch (err) {
      console.error('❌ خطأ في فحص الاشتراكات:', err);
    }
  }, { timezone: 'Asia/Riyadh' });
}

// =============================================
// Helper: إشعار الأطفال بتجديد المهام اليومية
// =============================================
async function notifyAllChildrenDailyRenewal() {
  const childrenWithDailyTasks = await prisma.child.findMany({
    where: {
      tasks: {
        some: { frequency: 'daily', isActive: true },
      },
    },
    select: { id: true },
  });

  for (const child of childrenWithDailyTasks) {
    await sendNotificationToChild('daily_tasks_renewed', child.id, {});
  }
}

// =============================================
// Start all jobs
// =============================================
export function startAllCronJobs() {
  startDailyTasksRenewal();
  startWeeklyTasksRenewal();
  startSubscriptionExpireCheck();
  console.log('✅ Cron jobs started');
}
