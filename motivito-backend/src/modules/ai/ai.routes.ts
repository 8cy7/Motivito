import { FastifyInstance } from 'fastify';
import { authenticate, requirePremium } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { z } from 'zod';
import Groq from 'groq-sdk';
import { env } from '../../config/env';
import { xpToNextLevel } from '../../utils/gamification';

export async function aiRoutes(fastify: FastifyInstance) {
  const premiumAuth = { preHandler: [authenticate, requirePremium] };

  // Chat with Motivito AI
  fastify.post('/chat', premiumAuth, async (request, reply) => {
    if (!env.GROQ_API_KEY) {
      return reply.status(503).send({ error: 'خدمة الذكاء الاصطناعي غير متاحة' });
    }

    const { message } = z.object({ message: z.string().min(1).max(2000) }).parse(request.body);
    const user = request.user as any;

    const response = await chatWithMotivitoAI(user.id, message);
    return reply.send({ message: response });
  });

  // Get chat history
  fastify.get('/chat/history', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    const history = await prisma.aiChat.findMany({
      where: { parentId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return reply.send(history);
  });

  // Clear chat history
  fastify.delete('/chat/history', premiumAuth, async (request, reply) => {
    const user = request.user as any;
    await prisma.aiChat.deleteMany({ where: { parentId: user.id } });
    return reply.send({ message: 'تم مسح المحادثات' });
  });
}

async function chatWithMotivitoAI(parentId: string, userMessage: string): Promise<string> {
  const groq = new Groq({ apiKey: env.GROQ_API_KEY });

  const children = await prisma.child.findMany({
    where: { parentId },
    include: {
      tasks: {
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      badges: true,
    },
  });

  const childrenSummary = children.map((c) => ({
    name: c.name,
    gender: c.gender,
    level: c.level,
    stars: c.stars,
    xp: c.xp,
    xpToNextLevel: xpToNextLevel(c.level),
    completedTasks: c.tasks.filter((t) => t.approvalStatus === 'approved').length,
    pendingTasks: c.tasks.filter((t) => !t.isCompleted && t.approvalStatus === 'pending').length,
    badges: c.badges.length,
  }));

  const systemPrompt = `أنت "موتيفيتو"، مساعد ذكاء اصطناعي داخل تطبيق موتيفيتو.

عن التطبيق:
موتيفيتو تطبيق تحفيزي للأطفال يحوّل المهام اليومية من روتين ممل إلى تجربة ممتعة شبيهة باللعبة. يضع الوالد مهاماً يومية للأطفال، وعند إنجازها يكسبون نقاطاً وجوائز ومكافآت يحددها الوالد مسبقاً. كل شيء يسير في مسار تصاعدي من مستويات وشارات مما يجعل التجربة أجمل وأسهل للطفل.

⚠️ قاعدة صارمة: اكتب ردودك باللغة العربية فقط بدون أي استثناء. لا تستخدم أي حرف من لغة أخرى مهما كان السبب.

أسلوبك دافئ، مشجع، وعملي.

بيانات أطفال هذا الوالد:
${JSON.stringify(childrenSummary, null, 2)}

يمكنك مساعدة الوالد في:
- فهم تقدم أطفاله وسلوكهم داخل التطبيق
- اقتراح مهام مناسبة لكل طفل
- اقتراح جوائز ومكافآت مناسبة
- نصائح تحفيزية مخصصة
- إجابة أسئلة التربية العامة

لا تذكر أرقاماً أو إحصائيات لا تجدها في البيانات المقدمة.`;

  const history = await prisma.aiChat.findMany({
    where: { parentId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'لا تتكلم إلا بالعربية فقط في كل ردودك، ولا تستخدم أي حرف من لغة أخرى أبداً.' },
    { role: 'assistant', content: 'فهمت تماماً. سأتحدث باللغة العربية فقط في جميع ردودي دون استثناء.' },
    ...history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  const assistantReply = completion.choices[0].message.content ?? '';

  await prisma.$transaction([
    prisma.aiChat.create({ data: { parentId, role: 'user', content: userMessage } }),
    prisma.aiChat.create({ data: { parentId, role: 'assistant', content: assistantReply } }),
  ]);

  return assistantReply;
}
