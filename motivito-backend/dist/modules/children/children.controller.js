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
exports.getChildren = getChildren;
exports.getChild = getChild;
exports.getChildSelf = getChildSelf;
exports.createChild = createChild;
exports.updateChild = updateChild;
exports.deleteChild = deleteChild;
exports.resetChildPin = resetChildPin;
exports.setupPin = setupPin;
exports.changeChildPin = changeChildPin;
exports.togglePinChild = togglePinChild;
exports.generateQR = generateQR;
exports.linkDevice = linkDevice;
exports.updateFcmToken = updateFcmToken;
exports.saveChildFcmToken = saveChildFcmToken;
exports.claimChallenge = claimChallenge;
const children_schema_1 = require("./children.schema");
const childrenService = __importStar(require("./children.service"));
async function getChildren(request, reply) {
    const user = request.user;
    const children = await childrenService.getChildren(user.id);
    return reply.send(children);
}
async function getChild(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const child = await childrenService.getChild(id, user.id);
    return reply.send(child);
}
async function getChildSelf(request, reply) {
    const user = request.user;
    const child = await childrenService.getChildSelf(user.id);
    return reply.send(child);
}
async function createChild(request, reply) {
    const user = request.user;
    const data = children_schema_1.createChildSchema.parse(request.body);
    const child = await childrenService.createChild(user.id, data);
    return reply.status(201).send(child);
}
async function updateChild(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const data = children_schema_1.updateChildSchema.parse(request.body);
    const child = await childrenService.updateChild(id, user.id, data);
    return reply.send(child);
}
async function deleteChild(request, reply) {
    const user = request.user;
    const { id } = request.params;
    await childrenService.deleteChild(id, user.id);
    return reply.status(204).send();
}
// الأب يعيد ضبط PIN الطفل (لا يحتاج القديم)
async function resetChildPin(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const data = children_schema_1.resetChildPinSchema.parse(request.body);
    await childrenService.resetChildPin(id, user.id, data);
    return reply.send({ message: 'تم إعادة ضبط رمز الطفل بنجاح' });
}
// الطفل يُعيّن رمزه لأول مرة بعد QR (child JWT)
async function setupPin(request, reply) {
    const user = request.user;
    const data = children_schema_1.setupPinSchema.parse(request.body);
    const result = await childrenService.setupChildPin(user.id, data);
    return reply.send(result);
}
// الطفل يغيّر رمزه (يعرف القديم) (child JWT)
async function changeChildPin(request, reply) {
    const user = request.user;
    const data = children_schema_1.changeChildPinSchema.parse(request.body);
    const result = await childrenService.changeChildPin(user.id, data);
    return reply.send(result);
}
async function togglePinChild(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const result = await childrenService.togglePinChild(id, user.id);
    return reply.send(result);
}
async function generateQR(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const result = await childrenService.generateQRCode(id, user.id);
    return reply.send(result);
}
async function linkDevice(request, reply) {
    const data = children_schema_1.linkDeviceSchema.parse(request.body);
    const result = await childrenService.linkDevice(request.server, data);
    return reply.send(result);
}
async function updateFcmToken(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const { fcmToken } = children_schema_1.updateFcmSchema.parse(request.body);
    await childrenService.updateChildFcmToken(id, user.id, fcmToken);
    return reply.send({ message: 'تم تحديث FCM token' });
}
async function saveChildFcmToken(request, reply) {
    const user = request.user;
    const { fcmToken } = request.body;
    await childrenService.saveChildFcmTokenSelf(user.id, fcmToken);
    return reply.send({ ok: true });
}
async function claimChallenge(request, reply) {
    const user = request.user;
    const { challengeIndex } = request.body;
    if (typeof challengeIndex !== 'number') {
        return reply.status(400).send({ error: 'challengeIndex مطلوب' });
    }
    const result = await childrenService.claimChallenge(user.id, challengeIndex);
    return reply.send(result);
}
//# sourceMappingURL=children.controller.js.map