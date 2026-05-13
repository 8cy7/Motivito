"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = uploadRoutes;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const env_1 = require("../../config/env");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const database_1 = __importDefault(require("../../config/database"));
async function uploadRoutes(fastify) {
    const auth = { preHandler: [auth_middleware_1.authenticate] };
    // Get presigned URL for avatar upload
    fastify.post('/avatar', auth, async (request, reply) => {
        if (!env_1.env.R2_ACCOUNT_ID || !env_1.env.R2_ACCESS_KEY_ID || !env_1.env.R2_SECRET_ACCESS_KEY) {
            return reply.status(503).send({ error: 'خدمة التخزين غير متاحة' });
        }
        const { childId, fileType } = zod_1.z.object({
            childId: zod_1.z.string().min(1),
            fileType: zod_1.z.enum(['image/jpeg', 'image/png', 'image/webp']),
        }).parse(request.body);
        const user = request.user;
        // Verify child ownership
        const child = await database_1.default.child.findFirst({ where: { id: childId, parentId: user.id } });
        if (!child)
            return reply.status(404).send({ error: 'الطفل غير موجود' });
        const s3 = new client_s3_1.S3Client({
            region: 'auto',
            endpoint: `https://${env_1.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env_1.env.R2_ACCESS_KEY_ID,
                secretAccessKey: env_1.env.R2_SECRET_ACCESS_KEY,
            },
        });
        const ext = fileType.split('/')[1];
        const key = `avatars/${childId}/${(0, uuid_1.v4)()}.${ext}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: env_1.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 300 });
        const publicUrl = `${env_1.env.R2_PUBLIC_URL}/${key}`;
        return reply.send({ uploadUrl, publicUrl, key });
    });
}
//# sourceMappingURL=upload.routes.js.map