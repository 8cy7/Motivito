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
exports.rewardsRoutes = rewardsRoutes;
exports.rewardRequestsRoutes = rewardRequestsRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const controller = __importStar(require("./rewards.controller"));
async function rewardsRoutes(fastify) {
    const parentAuth = { preHandler: [auth_middleware_1.authenticate] };
    const childAuth = { preHandler: [auth_middleware_1.authenticateChild] };
    // Child: get rewards available to them (must be before /:id)
    fastify.get('/mine', childAuth, controller.getRewardsForChild);
    // Rewards catalog
    fastify.get('/', parentAuth, controller.getRewards);
    fastify.get('/suggestions', parentAuth, controller.getSuggestions);
    fastify.post('/', parentAuth, controller.createReward);
    fastify.put('/:id', parentAuth, controller.updateReward);
    fastify.delete('/:id', parentAuth, controller.deleteReward);
}
async function rewardRequestsRoutes(fastify) {
    const parentAuth = { preHandler: [auth_middleware_1.authenticate] };
    const childAuth = { preHandler: [auth_middleware_1.authenticateChild] };
    fastify.get('/', parentAuth, controller.getPendingRequests);
    fastify.post('/', childAuth, controller.requestReward);
    fastify.post('/:id/deliver', parentAuth, controller.deliverReward);
    fastify.post('/:id/reject', parentAuth, controller.rejectRewardRequest);
    fastify.get('/history', parentAuth, controller.getRequestHistory);
}
//# sourceMappingURL=rewards.routes.js.map