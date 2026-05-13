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
exports.authRoutes = authRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const controller = __importStar(require("./auth.controller"));
async function authRoutes(fastify) {
    fastify.post('/register', controller.register);
    fastify.post('/login', controller.login);
    fastify.post('/login/pin', controller.loginPin);
    fastify.post('/child/login', controller.childLogin);
    fastify.post('/refresh', controller.refresh);
    fastify.post('/logout', controller.logout);
    fastify.post('/forgot-password', controller.forgotPassword);
    fastify.post('/reset-password', controller.resetPassword);
    fastify.get('/me', { preHandler: [auth_middleware_1.authenticate] }, controller.getMe);
    fastify.post('/fcm-token', { preHandler: [auth_middleware_1.authenticate] }, controller.saveFcmToken);
}
//# sourceMappingURL=auth.routes.js.map