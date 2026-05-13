"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
function signAccessToken(fastify, payload) {
    return fastify.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
}
function signRefreshToken(fastify, payload) {
    return fastify.jwt.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });
}
//# sourceMappingURL=jwt.js.map