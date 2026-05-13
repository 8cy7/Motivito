"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(error, request, reply) {
    // Zod validation errors
    if (error instanceof zod_1.ZodError) {
        return reply.status(400).send({
            error: 'validation_error',
            message: 'بيانات غير صحيحة',
            details: error.flatten().fieldErrors,
        });
    }
    // Fastify validation errors
    if (error.validation) {
        return reply.status(400).send({
            error: 'validation_error',
            message: 'بيانات غير صحيحة',
            details: error.validation,
        });
    }
    // JWT errors
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        return reply.status(401).send({ error: 'token_expired' });
    }
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
        return reply.status(401).send({ error: 'no_token' });
    }
    // Prisma unique constraint errors
    if (error.code === 'P2002') {
        return reply.status(409).send({
            error: 'conflict',
            message: 'البيانات موجودة مسبقاً',
        });
    }
    // Prisma not found errors
    if (error.code === 'P2025') {
        return reply.status(404).send({
            error: 'not_found',
            message: 'العنصر غير موجود',
        });
    }
    // Custom thrown objects: throw { statusCode: 4xx, message: '...' }
    const anyErr = error;
    if (anyErr.statusCode && anyErr.statusCode < 500) {
        return reply.status(anyErr.statusCode).send({
            error: 'request_error',
            message: anyErr.message || 'خطأ في الطلب',
        });
    }
    console.error('Unhandled error:', error);
    return reply.status(anyErr.statusCode || 500).send({
        error: 'server_error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'حدث خطأ في الخادم',
    });
}
//# sourceMappingURL=errorHandler.js.map