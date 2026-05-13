"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectRewardRequestSchema = exports.rewardRequestSchema = exports.updateRewardSchema = exports.createRewardSchema = void 0;
const zod_1 = require("zod");
exports.createRewardSchema = zod_1.z.object({
    childId: zod_1.z.string().optional().nullable(),
    name: zod_1.z.string().min(1).max(100),
    emoji: zod_1.z.string().min(1),
    pointsCost: zod_1.z.number().int().min(0),
    type: zod_1.z.enum(['small', 'medium', 'large']),
    category: zod_1.z.string().optional(),
});
exports.updateRewardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    emoji: zod_1.z.string().optional(),
    pointsCost: zod_1.z.number().int().min(1).optional(),
    type: zod_1.z.enum(['small', 'medium', 'large']).optional(),
    category: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.rewardRequestSchema = zod_1.z.object({
    rewardId: zod_1.z.string().min(1),
});
exports.rejectRewardRequestSchema = zod_1.z.object({
    note: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=rewards.schema.js.map