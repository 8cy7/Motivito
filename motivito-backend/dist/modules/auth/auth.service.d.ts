import { FastifyInstance } from 'fastify';
import type { RegisterInput, LoginInput, LoginPinInput, ChildLoginInput, RefreshInput } from './auth.schema';
export declare function registerParent(fastify: FastifyInstance, data: RegisterInput): Promise<{
    accessToken: string;
    refreshToken: string;
    parent: {
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        phone: string | null;
        isPremium: boolean;
        language: string;
    };
}>;
export declare function loginParent(fastify: FastifyInstance, data: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    parent: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        isPremium: boolean;
        language: string;
    };
}>;
export declare function loginParentPin(fastify: FastifyInstance, data: LoginPinInput): Promise<{
    accessToken: string;
    refreshToken: string;
    parent: {
        id: string;
        name: string;
        email: string;
        isPremium: boolean;
        language: string;
    };
}>;
export declare function loginChild(fastify: FastifyInstance, data: ChildLoginInput): Promise<{
    child: {
        id: string;
        parentId: string;
        name: string;
        avatar: string;
        gender: import(".prisma/client").$Enums.Gender;
        color: string;
        level: number;
        xp: number;
        stars: number;
    };
    accessToken: string;
}>;
export declare function refreshAccessToken(fastify: FastifyInstance, data: RefreshInput): Promise<{
    accessToken: string;
}>;
export declare function logoutParent(refreshToken: string): Promise<void>;
export declare function getMe(parentId: string): Promise<{
    id: string;
    createdAt: Date;
    name: string;
    email: string;
    phone: string | null;
    isPremium: boolean;
    premiumExpiresAt: Date | null;
    language: string;
    _count: {
        children: number;
    };
} | null>;
export declare function saveParentFcmToken(parentId: string, fcmToken: string): Promise<void>;
//# sourceMappingURL=auth.service.d.ts.map