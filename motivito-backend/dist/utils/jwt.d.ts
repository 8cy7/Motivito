import { FastifyInstance } from 'fastify';
export interface JwtPayload {
    id: string;
    email: string;
    type: 'parent';
}
export interface ChildJwtPayload {
    id: string;
    parentId: string;
    type: 'child';
}
export declare function signAccessToken(fastify: FastifyInstance, payload: JwtPayload | ChildJwtPayload): string;
export declare function signRefreshToken(fastify: FastifyInstance, payload: {
    id: string;
    sessionId: string;
}): string;
//# sourceMappingURL=jwt.d.ts.map