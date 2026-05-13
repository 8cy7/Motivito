"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDailyTasksRenewal = startDailyTasksRenewal;
exports.startWeeklyTasksRenewal = startWeeklyTasksRenewal;
exports.startSubscriptionExpireCheck = startSubscriptionExpireCheck;
exports.startAllCronJobs = startAllCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = __importDefault(require("../config/database"));
const notifications_1 = require("../utils/notifications");
// =============================================
// كل يوم الساعة 12:00 منتصف الليل - تجديد المهام اليومية
// =============================================
function startDailyTasksRenewal() {
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('🔄 تجديد المهام اليومية...');
        try {
            const result = await database_1.default.task.updateMany({
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
        }
        catch (err) {
            console.error('❌ خطأ في تجديد المهام اليومية:', err);
        }
    }, { timezone: 'Asia/Riyadh' });
}
// =============================================
// كل أحد الساعة 12:00 منتصف الليل - تجديد المهام الأسبوعية
// =============================================
function startWeeklyTasksRenewal() {
    node_cron_1.default.schedule('0 0 * * 0', async () => {
        console.log('🔄 تجديد المهام الأسبوعية...');
        try {
            const result = await database_1.default.task.updateMany({
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
        }
        catch (err) {
            console.error('❌ خطأ في تجديد المهام الأسبوعية:', err);
        }
    }, { timezone: 'Asia/Riyadh' });
}
// =============================================
// كل يوم الساعة 6 صباحاً - فحص انتهاء الاشتراكات
// =============================================
function startSubscriptionExpireCheck() {
    node_cron_1.default.schedule('0 6 * * *', async () => {
        console.log('🔄 فحص انتهاء الاشتراكات...');
        try {
            const expiredSubs = await database_1.default.subscription.findMany({
                where: { status: 'active', endDate: { lte: new Date() } },
            });
            for (const sub of expiredSubs) {
                await database_1.default.$transaction([
                    database_1.default.subscription.update({
                        where: { id: sub.id },
                        data: { status: 'expired' },
                    }),
                    database_1.default.parent.update({
                        where: { id: sub.parentId },
                        data: { isPremium: false },
                    }),
                ]);
            }
            if (expiredSubs.length > 0) {
                console.log(`✅ تم تحديث ${expiredSubs.length} اشتراك منتهي`);
            }
        }
        catch (err) {
            console.error('❌ خطأ في فحص الاشتراكات:', err);
        }
    }, { timezone: 'Asia/Riyadh' });
}
// =============================================
// Helper: إشعار الأطفال بتجديد المهام اليومية
// =============================================
async function notifyAllChildrenDailyRenewal() {
    const childrenWithDailyTasks = await database_1.default.child.findMany({
        where: {
            tasks: {
                some: { frequency: 'daily', isActive: true },
            },
        },
        select: { id: true },
    });
    for (const child of childrenWithDailyTasks) {
        await (0, notifications_1.sendNotificationToChild)('daily_tasks_renewed', child.id, {});
    }
}
// =============================================
// Start all jobs
// =============================================
function startAllCronJobs() {
    startDailyTasksRenewal();
    startWeeklyTasksRenewal();
    startSubscriptionExpireCheck();
    console.log('✅ Cron jobs started');
}
//# sourceMappingURL=renewDailyTasks.js.map