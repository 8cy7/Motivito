"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.loginPin = loginPin;
exports.childLogin = childLogin;
exports.refresh = refresh;
exports.logout = logout;
exports.getMe = getMe;
exports.saveFcmToken = saveFcmToken;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const auth_schema_1 = require("./auth.schema");
const authService = __importStar(require("./auth.service"));
async function register(request, reply) {
    const data = auth_schema_1.registerSchema.parse(request.body);
    const result = await authService.registerParent(request.server, data);
    return reply.status(201).send(result);
}
async function login(request, reply) {
    const data = auth_schema_1.loginSchema.parse(request.body);
    const result = await authService.loginParent(request.server, data);
    return reply.send(result);
}
async function loginPin(request, reply) {
    const data = auth_schema_1.loginPinSchema.parse(request.body);
    const result = await authService.loginParentPin(request.server, data);
    return reply.send(result);
}
async function childLogin(request, reply) {
    const data = auth_schema_1.childLoginSchema.parse(request.body);
    const result = await authService.loginChild(request.server, data);
    return reply.send(result);
}
async function refresh(request, reply) {
    const data = auth_schema_1.refreshSchema.parse(request.body);
    const result = await authService.refreshAccessToken(request.server, data);
    return reply.send(result);
}
async function logout(request, reply) {
    const { refreshToken } = request.body;
    if (refreshToken) {
        await authService.logoutParent(refreshToken);
    }
    return reply.send({ message: 'تم تسجيل الخروج' });
}
async function getMe(request, reply) {
    const user = request.user;
    const parent = await authService.getMe(user.id);
    if (!parent)
        return reply.status(404).send({ error: 'not_found' });
    return reply.send(parent);
}
async function saveFcmToken(request, reply) {
    const user = request.user;
    const { fcmToken } = request.body;
    await authService.saveParentFcmToken(user.id, fcmToken);
    return reply.send({ ok: true });
}
async function forgotPassword(request, reply) {
    const { email } = auth_schema_1.forgotPasswordSchema.parse(request.body);
    // TODO: إرسال بريد إعادة التعيين عبر Resend
    return reply.send({ message: 'إذا كان البريد مسجلاً، ستصل رسالة إعادة التعيين' });
}
async function resetPassword(request, reply) {
    const data = auth_schema_1.resetPasswordSchema.parse(request.body);
    // TODO: التحقق من token وتحديث كلمة المرور
    return reply.send({ message: 'تم تغيير كلمة المرور بنجاح' });
}
//# sourceMappingURL=auth.controller.js.map