"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateTasksSchema = exports.rejectTaskSchema = exports.completeTaskSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
exports.createTaskSchema = zod_1.z.object({
    childId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(500).optional(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    points: zod_1.z.number().int().min(1).max(1000),
    category: zod_1.z.enum(['daily', 'weekly', 'special']),
    frequency: zod_1.z.enum(['once', 'daily', 'weekly']),
    dueDate: zod_1.z.string().datetime().optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(500).optional(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    points: zod_1.z.number().int().min(1).max(1000).optional(),
    dueDate: zod_1.z.string().datetime().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.completeTaskSchema = zod_1.z.object({
    timeSpent: zod_1.z.number().int().min(0).optional(),
});
exports.rejectTaskSchema = zod_1.z.object({
    reason: zod_1.z.string().max(500).optional(),
});
exports.bulkCreateTasksSchema = zod_1.z.object({
    tasks: zod_1.z.array(exports.createTaskSchema).min(1).max(20),
});
//# sourceMappingURL=tasks.schema.js.map