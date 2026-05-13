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
exports.childrenRoutes = childrenRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const controller = __importStar(require("./children.controller"));
async function childrenRoutes(fastify) {
    const parentAuth = { preHandler: [auth_middleware_1.authenticate] };
    const childAuth = { preHandler: [auth_middleware_1.authenticateChild] };
    // --- Parent routes ---
    fastify.get('/', parentAuth, controller.getChildren);
    fastify.post('/', parentAuth, controller.createChild);
    fastify.get('/:id', parentAuth, controller.getChild);
    fastify.put('/:id', parentAuth, controller.updateChild);
    fastify.delete('/:id', parentAuth, controller.deleteChild);
    // الأب يعيد ضبط PIN الطفل (بدون الحاجة للقديم)
    fastify.put('/:id/pin', parentAuth, controller.resetChildPin);
    fastify.put('/:id/toggle-pin', parentAuth, controller.togglePinChild);
    fastify.get('/:id/qr', parentAuth, controller.generateQR);
    fastify.put('/:id/fcm-token', parentAuth, controller.updateFcmToken);
    // --- بدون auth: الطفل يمسح QR ويحصل على JWT مؤقت ---
    fastify.post('/link-device', controller.linkDevice);
    // --- Child routes (بعد QR أو بعد تسجيل دخول) ---
    fastify.get('/me', childAuth, controller.getChildSelf);
    fastify.post('/me/claim-challenge', childAuth, controller.claimChallenge);
    fastify.post('/fcm-token', childAuth, controller.saveChildFcmToken);
    // الطفل يختار رمزه لأول مرة (requiresPinSetup = true)
    fastify.post('/setup-pin', childAuth, controller.setupPin);
    // الطفل يغيّر رمزه (يعرف القديم)
    fastify.put('/change-pin', childAuth, controller.changeChildPin);
}
//# sourceMappingURL=children.routes.js.map