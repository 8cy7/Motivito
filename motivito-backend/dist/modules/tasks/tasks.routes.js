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
exports.tasksRoutes = tasksRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const controller = __importStar(require("./tasks.controller"));
async function tasksRoutes(fastify) {
    const parentAuth = { preHandler: [auth_middleware_1.authenticate] };
    const childAuth = { preHandler: [auth_middleware_1.authenticateChild] };
    fastify.get('/', parentAuth, controller.getTasks);
    fastify.post('/', parentAuth, controller.createTask);
    fastify.post('/bulk', parentAuth, controller.bulkCreateTasks);
    fastify.get('/pending-approval', parentAuth, controller.getPendingApproval);
    fastify.get('/mine', childAuth, controller.getChildTasks);
    fastify.get('/stats', childAuth, controller.getChildStats);
    fastify.get('/:id', parentAuth, controller.getTask);
    fastify.put('/:id', parentAuth, controller.updateTask);
    fastify.delete('/:id', parentAuth, controller.deleteTask);
    // Task workflow
    fastify.post('/:id/complete', childAuth, controller.completeTask);
    fastify.post('/:id/approve', parentAuth, controller.approveTask);
    fastify.post('/:id/reject', parentAuth, controller.rejectTask);
}
//# sourceMappingURL=tasks.routes.js.map