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
exports.getTasks = getTasks;
exports.getTask = getTask;
exports.createTask = createTask;
exports.bulkCreateTasks = bulkCreateTasks;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.getChildTasks = getChildTasks;
exports.completeTask = completeTask;
exports.approveTask = approveTask;
exports.rejectTask = rejectTask;
exports.getPendingApproval = getPendingApproval;
exports.getChildStats = getChildStats;
const tasks_schema_1 = require("./tasks.schema");
const tasksService = __importStar(require("./tasks.service"));
async function getTasks(request, reply) {
    const user = request.user;
    const { childId } = request.query;
    if (!childId)
        return reply.status(400).send({ error: 'childId مطلوب' });
    const tasks = await tasksService.getTasks(user.id, childId);
    return reply.send(tasks);
}
async function getTask(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const task = await tasksService.getTask(id, user.id);
    return reply.send(task);
}
async function createTask(request, reply) {
    const user = request.user;
    const data = tasks_schema_1.createTaskSchema.parse(request.body);
    const task = await tasksService.createTask(user.id, data);
    return reply.status(201).send(task);
}
async function bulkCreateTasks(request, reply) {
    const user = request.user;
    const data = tasks_schema_1.bulkCreateTasksSchema.parse(request.body);
    const tasks = await tasksService.bulkCreateTasks(user.id, data);
    return reply.status(201).send(tasks);
}
async function updateTask(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const data = tasks_schema_1.updateTaskSchema.parse(request.body);
    const task = await tasksService.updateTask(id, user.id, data);
    return reply.send(task);
}
async function deleteTask(request, reply) {
    const user = request.user;
    const { id } = request.params;
    await tasksService.deleteTask(id, user.id);
    return reply.status(204).send();
}
async function getChildTasks(request, reply) {
    const user = request.user;
    // user.id is childId (from child JWT)
    const tasks = await tasksService.getChildTasks(user.id);
    return reply.send(tasks);
}
async function completeTask(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const data = tasks_schema_1.completeTaskSchema.parse(request.body || {});
    // user.id here is childId (child JWT)
    const result = await tasksService.completeTask(id, user.id, data);
    return reply.send(result);
}
async function approveTask(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const result = await tasksService.approveTask(id, user.id);
    return reply.send(result);
}
async function rejectTask(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const data = tasks_schema_1.rejectTaskSchema.parse(request.body || {});
    const result = await tasksService.rejectTask(id, user.id, data);
    return reply.send(result);
}
async function getPendingApproval(request, reply) {
    const user = request.user;
    const tasks = await tasksService.getPendingApproval(user.id);
    return reply.send(tasks);
}
async function getChildStats(request, reply) {
    const user = request.user;
    // user.id is childId (child JWT)
    const stats = await tasksService.getChildTaskStats(user.id);
    return reply.send(stats);
}
//# sourceMappingURL=tasks.controller.js.map