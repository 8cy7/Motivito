"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFcmSchema = exports.linkDeviceSchema = exports.changeChildPinSchema = exports.setupPinSchema = exports.resetChildPinSchema = exports.updateChildSchema = exports.createChildSchema = void 0;
const zod_1 = require("zod");
exports.createChildSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    avatar: zod_1.z.string().min(1),
    gender: zod_1.z.enum(['boy', 'girl']),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isAvatarImage: zod_1.z.boolean().optional().default(false),
    // PIN اختياري — الأب يضع PIN مؤقت، أو يتركه فارغ ليختاره الطفل بعد مسح QR
    pin: zod_1.z.string().length(4).regex(/^\d{4}$/).optional(),
});
exports.updateChildSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).optional(),
    avatar: zod_1.z.string().optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isAvatarImage: zod_1.z.boolean().optional(),
});
// الأب يعيد ضبط PIN الطفل (لا يحتاج القديم — الأب هو صاحب الصلاحية)
exports.resetChildPinSchema = zod_1.z.object({
    newPin: zod_1.z.string().length(4).regex(/^\d{4}$/),
});
// الطفل يختار PIN لأول مرة بعد مسح QR
exports.setupPinSchema = zod_1.z.object({
    pin: zod_1.z.string().length(4).regex(/^\d{4}$/, 'PIN يجب أن يكون 4 أرقام'),
});
// الطفل يغيّر PIN الخاص فيه (يعرف القديم)
exports.changeChildPinSchema = zod_1.z.object({
    currentPin: zod_1.z.string().length(4).regex(/^\d{4}$/),
    newPin: zod_1.z.string().length(4).regex(/^\d{4}$/),
});
exports.linkDeviceSchema = zod_1.z.object({
    token: zod_1.z.string().uuid(),
    fcmToken: zod_1.z.string().optional(),
});
exports.updateFcmSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().min(1),
});
//# sourceMappingURL=children.schema.js.map