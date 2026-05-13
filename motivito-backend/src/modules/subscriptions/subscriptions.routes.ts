import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { z } from 'zod';
import axios from 'axios';
import crypto from 'crypto';
import { env } from '../../config/env';

export async function subscriptionsRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  // Get subscription status
  fastify.get('/status', auth, async (request, reply) => {
    const user = request.user as any;
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: user.id },
    });
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      select: { isPremium: true, premiumExpiresAt: true },
    });

    // Auto-expire if subscription date has passed
    const expired = parent?.premiumExpiresAt && parent.premiumExpiresAt < new Date();
    if (expired && parent?.isPremium) {
      await prisma.parent.update({
        where: { id: user.id },
        data: { isPremium: false },
      });
    }

    return reply.send({
      isPremium: expired ? false : (parent?.isPremium || false),
      subscription,
    });
  });

  // ─── Apple IAP Receipt Verification ────────────────────────────────────────
  fastify.post('/apple-verify', auth, async (request, reply) => {
    const user = request.user as any;
    const { receiptData } = z.object({
      receiptData: z.string().min(1),
      productId: z.string().optional(),
      transactionId: z.string().optional(),
    }).parse(request.body);

    const sharedSecret = env.APPLE_IAP_SHARED_SECRET;
    const payload = { 'receipt-data': receiptData, ...(sharedSecret ? { password: sharedSecret } : {}) };

    // Apple's standard: try production first, fall back to sandbox on status 21007
    const verify = async (url: string) =>
      axios.post<{ status: number; latest_receipt_info?: any[] }>(url, payload);

    let appleRes: Awaited<ReturnType<typeof verify>>;
    try {
      appleRes = await verify('https://buy.itunes.apple.com/verifyReceipt');
      if (appleRes.data.status === 21007) {
        appleRes = await verify('https://sandbox.itunes.apple.com/verifyReceipt');
      }
    } catch {
      return reply.status(502).send({ error: 'تعذّر التحقق من Apple، حاول مرة أخرى' });
    }

    if (appleRes.data.status !== 0) {
      return reply.status(400).send({ error: 'إيصال Apple غير صالح' });
    }

    // Find the latest active subscription in the receipt
    const latestInfo: any[] = appleRes.data.latest_receipt_info ?? [];
    const sorted = latestInfo.sort(
      (a, b) => Number(b.expires_date_ms) - Number(a.expires_date_ms)
    );
    const latest = sorted[0];
    if (!latest) return reply.status(400).send({ error: 'لم يتم العثور على اشتراك في الإيصال' });

    const expiresDate = new Date(Number(latest.expires_date_ms));
    if (expiresDate < new Date()) {
      return reply.status(400).send({ error: 'انتهت صلاحية الاشتراك' });
    }

    // Block: same Apple subscription used on a different account
    const origTxId: string = latest.original_transaction_id ?? latest.transaction_id;
    const takenBy = await prisma.subscription.findFirst({
      where: { paymentRef: origTxId, parentId: { not: user.id } },
      select: { parentId: true },
    });
    if (takenBy) {
      return reply.status(409).send({ error: 'هذا الاشتراك مرتبط بحساب موتيفيتو آخر' });
    }

    // Activate subscription in DB
    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { parentId: user.id },
        create: {
          parentId: user.id,
          status: 'active',
          plan: 'premium_monthly',
          amount: 0,
          currency: 'USD',
          startDate: new Date(),
          endDate: expiresDate,
          paymentRef: origTxId,
        },
        update: {
          status: 'active',
          startDate: new Date(),
          endDate: expiresDate,
          paymentRef: origTxId,
        },
      }),
      prisma.parent.update({
        where: { id: user.id },
        data: { isPremium: true, premiumExpiresAt: expiresDate },
      }),
    ]);

    return reply.send({ success: true, expiresAt: expiresDate });
  });

  // Create checkout session (Tap Payments)
  fastify.post('/checkout', auth, async (request, reply) => {
    const user = request.user as any;
    if (!env.TAP_SECRET_KEY) {
      return reply.status(503).send({ error: 'بوابة الدفع غير متاحة' });
    }

    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, phone: true },
    });
    if (!parent) return reply.status(404).send({ error: 'not_found' });

    try {
      const tapResponse = await axios.post(
        'https://api.tap.company/v2/charges',
        {
          amount: parseFloat(env.SUBSCRIPTION_PRICE_SAR),
          currency: 'SAR',
          customer: {
            first_name: parent.name,
            email: parent.email,
            phone: parent.phone ? { country_code: '966', number: parent.phone } : undefined,
          },
          source: { id: 'src_all' },
          redirect: { url: `${env.APP_URL}/subscription/callback` },
          metadata: { parentId: user.id },
          description: 'Motivito Premium Subscription',
        },
        {
          headers: {
            Authorization: `Bearer ${env.TAP_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return reply.send({
        checkoutUrl: tapResponse.data.transaction?.url,
        chargeId: tapResponse.data.id,
      });
    } catch {
      return reply.status(502).send({ error: 'خطأ في بوابة الدفع' });
    }
  });

  // Tap Payments Webhook
  fastify.post('/webhook', {
    config: { rawBody: true },
  }, async (request, reply) => {
    const signature = request.headers['hashstring'] as string;
    const body = (request as any).rawBody as string;

    if (env.TAP_WEBHOOK_SECRET) {
      const expected = crypto
        .createHmac('sha256', env.TAP_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expected) {
        return reply.status(401).send({ error: 'Invalid signature' });
      }
    }

    const event = request.body as any;

    if (event.object === 'charge' && event.status === 'CAPTURED') {
      const parentId = event.metadata?.parentId;
      if (!parentId) return reply.send({ received: true });

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await prisma.$transaction([
        prisma.subscription.upsert({
          where: { parentId },
          create: {
            parentId,
            status: 'active',
            amount: event.amount,
            currency: event.currency,
            startDate: new Date(),
            endDate,
            tapChargeId: event.id,
            paymentRef: event.reference?.payment,
          },
          update: {
            status: 'active',
            startDate: new Date(),
            endDate,
            tapChargeId: event.id,
            paymentRef: event.reference?.payment,
          },
        }),
        prisma.parent.update({
          where: { id: parentId },
          data: { isPremium: true, premiumExpiresAt: endDate },
        }),
      ]);
    }

    return reply.send({ received: true });
  });

  // Cancel subscription
  fastify.post('/cancel', auth, async (request, reply) => {
    const user = request.user as any;
    await prisma.subscription.update({
      where: { parentId: user.id },
      data: { autoRenew: false, status: 'cancelled' },
    });
    return reply.send({ message: 'تم إلغاء الاشتراك' });
  });

  // Subscription history
  fastify.get('/history', auth, async (request, reply) => {
    const user = request.user as any;
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: user.id },
    });
    return reply.send(subscription ? [subscription] : []);
  });

}
