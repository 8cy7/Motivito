"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('30d'),
    FIREBASE_PROJECT_ID: zod_1.z.string().optional(),
    FIREBASE_PRIVATE_KEY: zod_1.z.string().optional(),
    FIREBASE_CLIENT_EMAIL: zod_1.z.string().optional(),
    R2_ACCOUNT_ID: zod_1.z.string().optional(),
    R2_ACCESS_KEY_ID: zod_1.z.string().optional(),
    R2_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    R2_BUCKET_NAME: zod_1.z.string().optional(),
    R2_PUBLIC_URL: zod_1.z.string().optional(),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    GROQ_API_KEY: zod_1.z.string().optional(),
    TAP_SECRET_KEY: zod_1.z.string().optional(),
    TAP_WEBHOOK_SECRET: zod_1.z.string().optional(),
    SUBSCRIPTION_PRICE_SAR: zod_1.z.string().default('14.99'),
    RESEND_API_KEY: zod_1.z.string().optional(),
    FROM_EMAIL: zod_1.z.string().email().optional(),
    PORT: zod_1.z.string().default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    APP_URL: zod_1.z.string().default('http://localhost:3000'),
    CORS_ORIGINS: zod_1.z.string().default('motivito://,http://localhost:3000'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map