"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initApns = initApns;
exports.sendApnsNotification = sendApnsNotification;
const apn_1 = __importDefault(require("apn"));
let provider = null;
function initApns() {
    const keyId = process.env.APNS_KEY_ID;
    const teamId = process.env.APNS_TEAM_ID;
    const key = process.env.APNS_KEY; // محتوى ملف .p8
    const bundleId = process.env.APNS_BUNDLE_ID || 'org.reactjs.native.example.AmazingMotivito';
    if (!keyId || !teamId || !key) {
        console.warn('⚠️  APNs not configured — push notifications disabled');
        return;
    }
    provider = new apn_1.default.Provider({
        token: {
            key: Buffer.from(key.replace(/\\n/g, '\n')),
            keyId,
            teamId,
        },
        production: process.env.NODE_ENV === 'production',
    });
    console.log('✅ APNs provider initialized');
}
async function sendApnsNotification(deviceToken, title, body, data) {
    if (!provider)
        return;
    const bundleId = process.env.APNS_BUNDLE_ID || 'org.reactjs.native.example.AmazingMotivito';
    const note = new apn_1.default.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = 1;
    note.sound = 'default';
    note.alert = { title, body };
    note.topic = bundleId;
    note.payload = data || {};
    try {
        const result = await provider.send(note, deviceToken);
        if (result.failed.length > 0) {
            console.error('APNs failed:', result.failed[0].response);
        }
    }
    catch (e) {
        console.error('APNs error:', e.message);
    }
}
//# sourceMappingURL=apns.js.map