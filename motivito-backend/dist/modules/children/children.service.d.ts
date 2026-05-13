import { FastifyInstance } from 'fastify';
import type { CreateChildInput, UpdateChildInput, ResetChildPinInput, SetupPinInput, ChangeChildPinInput, LinkDeviceInput } from './children.schema';
export declare function getChildren(parentId: string): Promise<{
    id: string;
    createdAt: Date;
    name: string;
    _count: {
        tasks: number;
        badges: number;
    };
    avatar: string;
    isAvatarImage: boolean;
    gender: import(".prisma/client").$Enums.Gender;
    color: string;
    isPinned: boolean;
    level: number;
    xp: number;
    stars: number;
    totalStars: number;
    unlockedEmojis: string[];
}[]>;
export declare function getChildSelf(childId: string): Promise<{
    parentIsPremium: boolean;
    id: string;
    parentId: string;
    name: string;
    avatar: string;
    isAvatarImage: boolean;
    gender: import(".prisma/client").$Enums.Gender;
    color: string;
    level: number;
    xp: number;
    stars: number;
    totalStars: number;
    challengeLevel: number;
}>;
export declare function claimChallenge(childId: string, challengeIndex: number): Promise<{
    success: boolean;
    challengeLevel: number;
}>;
export declare function getChild(childId: string, parentId: string): Promise<{
    _count: {
        tasks: number;
        badges: number;
        battlePassUnlocks: number;
    };
    badges: {
        id: string;
        childId: string;
        color: string;
        level: number;
        earnedDate: Date;
        emoji: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    parentId: string;
    name: string;
    fcmToken: string | null;
    updatedAt: Date;
    friendCode: string | null;
    avatar: string;
    isAvatarImage: boolean;
    gender: import(".prisma/client").$Enums.Gender;
    color: string;
    isPinned: boolean;
    level: number;
    xp: number;
    stars: number;
    totalStars: number;
    challengeLevel: number;
    lastChallengeClaimedAt: Date | null;
    pinHash: string;
    deviceToken: string | null;
    deviceTokenExp: Date | null;
    unlockedEmojis: string[];
}>;
export declare function createChild(parentId: string, data: CreateChildInput): Promise<{
    requiresPinSetup: boolean;
    pinHash: undefined;
    id: string;
    createdAt: Date;
    name: string;
    avatar: string;
    gender: import(".prisma/client").$Enums.Gender;
    color: string;
    level: number;
    xp: number;
    stars: number;
}>;
export declare function updateChild(childId: string, parentId: string, data: UpdateChildInput): Promise<{
    id: string;
    name: string;
    avatar: string;
    isAvatarImage: boolean;
    gender: import(".prisma/client").$Enums.Gender;
    color: string;
    isPinned: boolean;
    level: number;
    xp: number;
    stars: number;
}>;
export declare function deleteChild(childId: string, parentId: string): Promise<void>;
export declare function resetChildPin(childId: string, parentId: string, data: ResetChildPinInput): Promise<void>;
export declare function setupChildPin(childId: string, data: SetupPinInput): Promise<{
    message: string;
    pinSetupComplete: boolean;
}>;
export declare function changeChildPin(childId: string, data: ChangeChildPinInput): Promise<{
    message: string;
}>;
export declare function togglePinChild(childId: string, parentId: string): Promise<{
    id: string;
    isPinned: boolean;
}>;
export declare function generateQRCode(childId: string, parentId: string): Promise<{
    token: string;
    qrData: string;
    qrCodeDataUrl: string;
    expiresIn: number;
}>;
export declare function linkDevice(fastify: FastifyInstance, data: LinkDeviceInput): Promise<{
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
    requiresPinSetup: boolean;
}>;
export declare function updateChildFcmToken(childId: string, parentId: string, fcmToken: string): Promise<void>;
export declare function updateChildAvatar(childId: string, parentId: string, avatarUrl: string): Promise<{
    id: string;
    avatar: string;
    isAvatarImage: boolean;
}>;
export declare function saveChildFcmTokenSelf(childId: string, fcmToken: string): Promise<void>;
//# sourceMappingURL=children.service.d.ts.map