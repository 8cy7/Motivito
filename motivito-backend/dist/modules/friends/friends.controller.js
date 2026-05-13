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
exports.getMyProfile = getMyProfile;
exports.sendRequest = sendRequest;
exports.getIncoming = getIncoming;
exports.acceptRequest = acceptRequest;
exports.rejectRequest = rejectRequest;
exports.getFriends = getFriends;
exports.removeFriend = removeFriend;
const service = __importStar(require("./friends.service"));
async function getMyProfile(req, reply) {
    const { id } = req.user;
    const data = await service.getMyProfile(id);
    reply.send(data);
}
async function sendRequest(req, reply) {
    const { id } = req.user;
    const { friendCode } = req.body;
    if (!friendCode)
        return reply.status(400).send({ error: 'friendCode مطلوب' });
    const result = await service.sendRequest(id, friendCode.trim().toUpperCase());
    if (result.error)
        return reply.status(400).send(result);
    reply.send(result);
}
async function getIncoming(req, reply) {
    const { id } = req.user;
    const data = await service.getIncomingRequests(id);
    reply.send(data);
}
async function acceptRequest(req, reply) {
    const { id } = req.user;
    const { requestId } = req.params;
    const result = await service.acceptRequest(requestId, id);
    if (result.error)
        return reply.status(400).send(result);
    reply.send(result);
}
async function rejectRequest(req, reply) {
    const { id } = req.user;
    const { requestId } = req.params;
    const result = await service.rejectRequest(requestId, id);
    if (result.error)
        return reply.status(400).send(result);
    reply.send(result);
}
async function getFriends(req, reply) {
    const { id } = req.user;
    const data = await service.getFriends(id);
    reply.send(data);
}
async function removeFriend(req, reply) {
    const { id } = req.user;
    const { friendId } = req.params;
    const result = await service.removeFriend(id, friendId);
    reply.send(result);
}
//# sourceMappingURL=friends.controller.js.map