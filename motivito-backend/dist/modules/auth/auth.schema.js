"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshSchema = exports.childLoginSchema = exports.loginPinSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(100),
    phone: zod_1.z.string().optional(),
    parentPin: zod_1.z.string().length(4).regex(/^\d{4}$/, 'PIN يجب أن يكون 4 أرقام'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.loginPinSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    parentPin: zod_1.z.string().length(4).regex(/^\d{4}$/),
});
exports.childLoginSchema = zod_1.z.object({
    childId: zod_1.z.string().min(1),
    pin: zod_1.z.string().length(4).regex(/^\d{4}$/),
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8).max(100),
});
//# sourceMappingURL=auth.schema.js.map