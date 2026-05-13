import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import prisma from '../../config/database';

export async function uploadRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  // Get presigned URL for avatar upload
  fastify.post('/avatar', auth, async (request, reply) => {
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
      return reply.status(503).send({ error: 'خدمة التخزين غير متاحة' });
    }

    const { childId, fileType } = z.object({
      childId: z.string().min(1),
      fileType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    }).parse(request.body);

    const user = request.user as any;

    // Verify child ownership
    const child = await prisma.child.findFirst({ where: { id: childId, parentId: user.id } });
    if (!child) return reply.status(404).send({ error: 'الطفل غير موجود' });

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const ext = fileType.split('/')[1];
    const key = `avatars/${childId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return reply.send({ uploadUrl, publicUrl, key });
  });
}
