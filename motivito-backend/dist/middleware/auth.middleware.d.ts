import { FastifyRequest, FastifyReply } from 'fastify';
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function authenticateChild(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function authenticateAny(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function requirePremium(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
//# sourceMappingURL=auth.middleware.d.ts.map