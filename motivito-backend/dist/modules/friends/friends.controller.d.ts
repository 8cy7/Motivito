import { FastifyRequest, FastifyReply } from 'fastify';
export declare function getMyProfile(req: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function sendRequest(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function getIncoming(req: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function acceptRequest(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function rejectRequest(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function getFriends(req: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function removeFriend(req: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=friends.controller.d.ts.map