# Motivito Backend API

**Fastify + TypeScript + Prisma + PostgreSQL + Redis**

---

## خطوات التشغيل

### 1. المتطلبات
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### 2. التثبيت
```bash
cd motivito-backend
npm install
```

### 3. إعداد متغيرات البيئة
```bash
cp .env.example .env
# عدّل .env بقيمك الحقيقية
```

### 4. إعداد قاعدة البيانات
```bash
# توليد Prisma Client
npm run prisma:generate

# تطبيق الـ migrations
npm run prisma:migrate

# (اختياري) فتح Prisma Studio
npm run prisma:studio
```

### 5. تشغيل التطوير
```bash
npm run dev
```

### 6. البناء للإنتاج
```bash
npm run build
npm start
```

---

## هيكل الـ API

| الوحدة | الـ Prefix | الوصف |
|---|---|---|
| Auth | `/api/auth` | تسجيل، دخول، JWT، refresh |
| Children | `/api/children` | إدارة الأطفال + QR |
| Tasks | `/api/tasks` | المهام + workflow الموافقة |
| Rewards | `/api/rewards` | كتالوج الجوائز |
| Reward Requests | `/api/reward-requests` | طلبات الجوائز |
| Notifications | `/api/notifications` | الإشعارات |
| Analytics | `/api/analytics` | تحليلات ذكية (Premium) |
| AI Chat | `/api/ai` | موتيفيتو AI (Premium) |
| Battle Pass | `/api/battle-pass` | Battle Pass (Premium) |
| Achievements | `/api/achievements` | الشارات والإنجازات (Premium) |
| Subscriptions | `/api/subscriptions` | Tap Payments |
| Settings | `/api/settings` | إعدادات الوالد |
| Upload | `/api/upload` | رفع الصور (R2) |

---

## Deployment على Railway

```bash
# 1. أنشئ مشروع جديد على railway.app
# 2. أضف PostgreSQL + Redis services
# 3. اضبط ENV Variables
# 4. اربط GitHub repo

# Procfile (تلقائي من package.json start script)
```

---

## الأمان

- ✅ JWT (15 دقيقة) + Refresh Tokens (30 يوم)
- ✅ bcrypt (saltRounds=12) للكلمات والـ PINs
- ✅ Rate Limiting: 100 req/min عام، 5 login/15min
- ✅ Helmet.js Security Headers
- ✅ Zod validation على كل المدخلات
- ✅ Row-level security (الوالد يرى بياناته فقط)
- ✅ QR tokens: استخدام مرة واحدة، تنتهي بعد 15 دقيقة
