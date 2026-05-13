"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationToParent = sendNotificationToParent;
exports.sendNotificationToChild = sendNotificationToChild;
const database_1 = __importDefault(require("../config/database"));
const apns_1 = require("./apns");
// =============================================
// بناء نصوص الإشعارات (عربية - حسب الجنس)
// =============================================
function buildNotificationContent(type, payload) {
    const isBoy = payload.gender !== 'girl';
    switch (type) {
        case 'task_assigned':
            return {
                title: 'Motivito 🦸',
                body: isBoy ? '🦸‍♂️ جتك مهمة يا بطل!' : '👸 جتك مهمة يا أميرتنا!',
            };
        case 'task_completed':
            return {
                title: isBoy
                    ? `🦸‍♂️ بطلك ${payload.childName} ينتظرك!`
                    : `👸 أميرتك ${payload.childName} تنتظرك!`,
                body: isBoy
                    ? `💪 بطلك ${payload.childName} أنهى المهمة وينتظر موافقتك الكريمة`
                    : `💜 أميرتك ${payload.childName} أنهت المهمة وتنتظر موافقتك الكريمة`,
            };
        case 'task_approved':
            return {
                title: isBoy ? 'أحسنت يا بطل! 🌟' : 'أحسنتِ يا أميرة! 🌟',
                body: `حصلت على ${payload.points} نجمة لإكمال "${payload.taskTitle}" ⭐`,
            };
        case 'task_rejected':
            return {
                title: isBoy ? 'المهمة تحتاج مراجعة 🔄' : 'المهمة تحتاج مراجعة 🔄',
                body: payload.reason ? `${payload.reason}` : 'راجع المهمة وحاول مجدداً 💪',
            };
        case 'reward_requested':
            return {
                title: isBoy
                    ? `🎁 بطلك ${payload.childName} يطلب جائزة!`
                    : `🎁 أميرتك ${payload.childName} تطلب جائزة!`,
                body: isBoy
                    ? `🏆 بطلك ${payload.childName} طلب جائزة "${payload.rewardName}"`
                    : `💝 أميرتك ${payload.childName} طلبت جائزة "${payload.rewardName}"`,
            };
        case 'reward_delivered':
            return {
                title: isBoy ? 'مبروك يا بطل! 🎉' : 'مبروك يا أميرة! 🎉',
                body: `🎁 تم تسليم جائزتك "${payload.rewardName}" استمتع بها!`,
            };
        case 'reward_rejected':
            return {
                title: 'طلب الجائزة 💭',
                body: `لم يتم تسليم جائزة "${payload.rewardName}" بعد، تحلّ بالصبر 🌟`,
            };
        case 'level_up':
            return {
                title: isBoy ? `🚀 ارتقى بطلك مستوى!` : `🚀 ارتقت أميرتك مستوى!`,
                body: `🏆 وصل للمستوى ${payload.level}! استمر في التألق!`,
            };
        case 'badge_earned':
            return {
                title: isBoy ? `🏅 بطلك حصل على شارة!` : `🏅 أميرتك حصلت على شارة!`,
                body: `${payload.emoji} شارة جديدة في رصيدك!`,
            };
        case 'battle_pass_unlock':
            return {
                title: '⚔️ مكافأة Battle Pass!',
                body: '🎊 فتحت مكافأة جديدة في Battle Pass!',
            };
        case 'daily_tasks_renewed':
            return {
                title: isBoy ? '🌅 مهامك اليومية جاهزة يا بطل!' : '🌅 مهامك اليومية جاهزة يا أميرة!',
                body: '✨ مهامك الجديدة تنتظرك، هيا ابدأ!',
            };
        default:
            return { title: 'إشعار جديد 🔔', body: '' };
    }
}
// =============================================
// إرسال إشعار للوالد
// =============================================
async function sendNotificationToParent(type, parentId, payload) {
    const { title, body } = buildNotificationContent(type, payload);
    await database_1.default.notification.create({
        data: {
            parentId,
            type,
            title,
            body,
            data: payload,
        },
    });
    const parent = await database_1.default.parent.findUnique({
        where: { id: parentId },
        select: { fcmToken: true },
    });
    if (parent?.fcmToken) {
        await (0, apns_1.sendApnsNotification)(parent.fcmToken, title, body, { type, ...Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)])) });
    }
}
// =============================================
// إرسال إشعار للطفل
// =============================================
async function sendNotificationToChild(type, childId, payload) {
    const { title, body } = buildNotificationContent(type, payload);
    await database_1.default.notification.create({
        data: {
            childId,
            type,
            title,
            body,
            data: payload,
        },
    });
    const child = await database_1.default.child.findUnique({
        where: { id: childId },
        select: { fcmToken: true },
    });
    if (child?.fcmToken) {
        await (0, apns_1.sendApnsNotification)(child.fcmToken, title, body, { type, ...Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)])) });
    }
}
//# sourceMappingURL=notifications.js.map