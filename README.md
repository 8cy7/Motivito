<div align="center" dir="rtl">

# Motivito — موتيفيتو

### منصة تحفيز الأطفال الذكية

تطبيق جوال يحوّل المهام اليومية للأطفال إلى تجربة مثيرة تجمع بين الألعاب والذكاء الاصطناعي ومشاركة العائلة

---

</div>

<div dir="rtl">

## نظرة عامة

<p dir="rtl" align="justify">
موتيفيتو منصة تربوية متكاملة تعمل على الهاتف الجوال، تهدف إلى حل مشكلة حقيقية يعاني منها كثير من الآباء: <strong>كيف تجعل طفلك يُكمل مهامه اليومية بشوق وليس بإكراه؟</strong>
</p>

<p dir="rtl" align="justify">
الجواب: بتحويل كل مهمة إلى لحظة إنجاز حقيقية — نقاط، مستويات، شارات، خريطة مغامرات، ومكافآت يختارها الطفل بنفسه.
</p>

---

## المشكلة والحل

| المشكلة | الحل في Motivito |
|---------|-----------------|
| الأطفال لا يُنجزون مهامهم دون ضغط مستمر | نظام نقاط وتحديات يجعل المهمة هدفاً يسعى إليه الطفل |
| الأهل لا يرون تقدم أبنائهم بوضوح | لوحة تحكم للأهل مع تحليلات مفصّلة وإشعارات فورية |
| الأطفال يملّون من الروتين سريعاً | Battle Pass، خريطة مغامرات، وتحديات أسبوعية متجددة |
| لا توجد أداة ذكية تساعد الأهل على التعامل مع أطفالهم | مساعد ذكاء اصطناعي (Motivito AI) يقدم نصائح تربوية مخصصة |

---

## المميزات الرئيسية

### للطفل
- **خريطة المغامرة** — رحلة بصرية تفاعلية بمراحل ومحطات يفتحها الطفل تدريجياً
- **نظام المستويات والشارات** — يرتقي الطفل من مستوى لآخر ويكسب شارات تعكس إنجازاته الحقيقية
- **Battle Pass** — موسم تحديات بمكافآت حصرية تتجدد دورياً
- **نظام الأصدقاء** — إضافة أصدقاء برمز فريد (MOTI-XXXX) ومقارنة التقدم
- **رف الإنجازات** — معرض يحتفظ بكل شارة وإنجاز حققه الطفل
- **رسائل تحفيزية** — مساعد الطفل الذكي يشجعه في كل خطوة

### للأهل
- **لوحة تحكم شاملة** — نظرة سريعة على إنجازات كل طفل
- **موافقة على المهام** — الأهل يراجعون ويعتمدون إنجاز المهام قبل صرف النقاط
- **المكافآت المخصصة** — إنشاء مكافآت حقيقية ومعنوية تناسب كل طفل
- **مقارنة الأخوة** — رؤية تقدم الأبناء جنباً إلى جنب
- **تحليلات مفصّلة** — إحصاءات المهام والنقاط ومناطق القوة والضعف
- **Motivito AI** — مساعد ذكاء اصطناعي يقدم رؤى تربوية ونصائح مخصصة

### تقني
- **دعم كامل للأجهزة اللوحية (iPad)** — واجهة Landscape مصممة خصيصاً
- **مصادقة بـ QR Code وPIN** — تجربة دخول سريعة وآمنة للأطفال
- **Backend متكامل** — Fastify + Prisma + PostgreSQL + AWS S3

---

## البنية التقنية

</div>

```
Motivito/
├── src/
│   ├── screens/
│   │   ├── child/          # شاشات الطفل (Dashboard, Map, Progress, Friends, BattlePass...)
│   │   └── parent/         # شاشات الأهل (Dashboard, Approvals, Analytics, AI Chat...)
│   ├── contexts/           # AuthContext, ChildrenContext
│   ├── services/           # API calls, IAP, Storage
│   ├── utils/              # levelUtils, badgeUtils, soundUtils...
│   └── types/              # TypeScript interfaces
├── motivito-backend/       # Fastify + Prisma + PostgreSQL
└── __tests__/
    ├── unit/               # اختبارات الوحدة
    └── integration/        # اختبارات التكامل
```

<div dir="rtl">

**Stack:**

| الطبقة | التقنية |
|--------|--------|
| Mobile | React Native 0.82 + TypeScript |
| Navigation | React Navigation v7 |
| Backend | Fastify + Prisma ORM |
| Database | PostgreSQL |
| Storage | AWS S3 |
| Auth | JWT + QR Code |
| Testing | Jest |

---

## متطلبات التشغيل

- Node.js >= 18
- npm أو yarn
- **iOS:** macOS + Xcode 15+ + CocoaPods
- **Android:** Android Studio + JDK 17 + Android SDK

---

## تشغيل المشروع

### 1. تثبيت الاعتماديات

</div>

```bash
npm install
```

<div dir="rtl">

لـ iOS فقط، ثبّت الـ pods:

</div>

```bash
cd ios && pod install && cd ..
```

---

<div dir="rtl">

### 2. تشغيل Metro Bundler

افتح terminal وشغّل:

</div>

```bash
npm start
```

<div dir="rtl">

> اتركه يعمل في الخلفية وافتح terminal ثانياً للخطوة التالية.

---

### التشغيل على Android

</div>

```bash
npm run android
```

<div dir="rtl">

> تأكد أن جهاز أو محاكي Android يعمل أولاً عبر `adb devices`.

---

### التشغيل على iOS

</div>

```bash
npm run ios
```

<div dir="rtl">

لتحديد محاكي بعينه:

</div>

```bash
npm run ios -- --simulator="iPhone 15 Pro"
```

<div dir="rtl">

> التطبيق يدعم iPad بواجهة Landscape مستقلة.

---

## تشغيل الاختبارات

### تشغيل جميع الاختبارات

</div>

```bash
npm test
```

<div dir="rtl">

### تشغيل ملف اختبار محدد

الطريقة الأضمن هي تمرير مسار الملف مباشرة لـ `npx jest`:

</div>

```bash
npx jest __tests__/integration/levelAndBadge.test.ts
npx jest __tests__/integration/loginAndStorage.test.ts
npx jest __tests__/integration/storage.test.ts
npx jest __tests__/unit/levelUtils.test.ts
npx jest __tests__/unit/badgeUtils.test.ts
npx jest __tests__/unit/loginValidation.test.ts
```

<div dir="rtl">

### خيارات إضافية

</div>

```bash
# عرض تفاصيل كاملة
npm test -- --verbose

# وضع المراقبة
npm test -- --watch
```

<div dir="rtl">

### ما تغطيه الاختبارات

| الملف | ما يختبره |
|-------|----------|
| `levelAndBadge.test.ts` | التحقق من ترابط نظام المستويات مع نظام الشارات — يضمن أن ارتفاع المستوى يؤدي تلقائياً لتغيير الشارة |
| `loginAndStorage.test.ts` | عمليات المصادقة والتخزين المحلي |
| `storage.test.ts` | AsyncStorage والمهام المعلّقة للموافقة |

---

<div align="center">

**Motivito** — حوّل مهام طفلك إلى مغامرة

</div>

</div>
