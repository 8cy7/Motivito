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
exports.getRewardsForChild = getRewardsForChild;
exports.getRewards = getRewards;
exports.getSuggestions = getSuggestions;
exports.createReward = createReward;
exports.updateReward = updateReward;
exports.deleteReward = deleteReward;
exports.getPendingRequests = getPendingRequests;
exports.requestReward = requestReward;
exports.deliverReward = deliverReward;
exports.rejectRewardRequest = rejectRewardRequest;
exports.getRequestHistory = getRequestHistory;
const rewards_schema_1 = require("./rewards.schema");
const rewardsService = __importStar(require("./rewards.service"));
// --- Rewards ---
async function getRewardsForChild(request, reply) {
    const user = request.user;
    const rewards = await rewardsService.getRewardsForChild(user.id);
    return reply.send(rewards);
}
async function getRewards(request, reply) {
    const user = request.user;
    const { childId } = request.query;
    const rewards = await rewardsService.getRewards(user.id, childId);
    return reply.send(rewards);
}
async function getSuggestions(request, reply) {
    const user = request.user;
    const { childId } = request.query;
    if (!childId)
        return reply.status(400).send({ error: 'childId مطلوب' });
    const suggestions = await rewardsService.getRewardSuggestions(user.id, childId);
    return reply.send(suggestions);
}
async function createReward(request, reply) {
    const user = request.user;
    const data = rewards_schema_1.createRewardSchema.parse(request.body);
    const reward = await rewardsService.createReward(user.id, data);
    return reply.status(201).send(reward);
}
async function updateReward(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const data = rewards_schema_1.updateRewardSchema.parse(request.body);
    const reward = await rewardsService.updateReward(id, user.id, data);
    return reply.send(reward);
}
async function deleteReward(request, reply) {
    const user = request.user;
    const { id } = request.params;
    await rewardsService.deleteReward(id, user.id);
    return reply.status(204).send();
}
// --- Reward Requests ---
async function getPendingRequests(request, reply) {
    const user = request.user;
    const requests = await rewardsService.getPendingRequests(user.id);
    return reply.send(requests);
}
async function requestReward(request, reply) {
    const user = request.user;
    const data = rewards_schema_1.rewardRequestSchema.parse(request.body);
    const result = await rewardsService.requestReward(user.id, data);
    return reply.status(201).send(result);
}
async function deliverReward(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const result = await rewardsService.deliverReward(id, user.id);
    return reply.send(result);
}
async function rejectRewardRequest(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const data = rewards_schema_1.rejectRewardRequestSchema.parse(request.body || {});
    const result = await rewardsService.rejectRewardRequest(id, user.id, data);
    return reply.send(result);
}
async function getRequestHistory(request, reply) {
    const user = request.user;
    const { childId } = request.query;
    const history = await rewardsService.getRequestHistory(user.id, childId);
    return reply.send(history);
}
//# sourceMappingURL=rewards.controller.js.map