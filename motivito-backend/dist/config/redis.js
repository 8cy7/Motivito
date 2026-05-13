"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});
redis.on('connect', () => {
    console.log('✅ Redis connected');
});
redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
});
exports.default = redis;
//# sourceMappingURL=redis.js.map