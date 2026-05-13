import type { CreateRewardInput, UpdateRewardInput, RewardRequestInput, RejectRewardRequestInput } from './rewards.schema';
export declare function getRewardsForChild(childId: string): Promise<{
    type: import(".prisma/client").$Enums.RewardType;
    id: string;
    createdAt: Date;
    parentId: string;
    childId: string | null;
    name: string;
    updatedAt: Date;
    isActive: boolean;
    category: string | null;
    emoji: string;
    pointsCost: number;
}[]>;
export declare function getRewards(parentId: string, childId?: string): Promise<{
    type: import(".prisma/client").$Enums.RewardType;
    id: string;
    createdAt: Date;
    parentId: string;
    childId: string | null;
    name: string;
    updatedAt: Date;
    isActive: boolean;
    category: string | null;
    emoji: string;
    pointsCost: number;
}[]>;
export declare function getRewardSuggestions(parentId: string, childId: string): Promise<{
    name: string;
    emoji: string;
    type: string;
    category: string;
    pointsCost: number;
}[]>;
export declare function createReward(parentId: string, data: CreateRewardInput): Promise<{
    type: import(".prisma/client").$Enums.RewardType;
    id: string;
    createdAt: Date;
    parentId: string;
    childId: string | null;
    name: string;
    updatedAt: Date;
    isActive: boolean;
    category: string | null;
    emoji: string;
    pointsCost: number;
}>;
export declare function updateReward(rewardId: string, parentId: string, data: UpdateRewardInput): Promise<{
    type: import(".prisma/client").$Enums.RewardType;
    id: string;
    createdAt: Date;
    parentId: string;
    childId: string | null;
    name: string;
    updatedAt: Date;
    isActive: boolean;
    category: string | null;
    emoji: string;
    pointsCost: number;
}>;
export declare function deleteReward(rewardId: string, parentId: string): Promise<void>;
export declare function requestReward(childId: string, data: RewardRequestInput): Promise<{
    newStars: number;
    status: import(".prisma/client").$Enums.RequestStatus;
    id: string;
    childId: string;
    rejectedAt: Date | null;
    rewardId: string;
    starsCost: number;
    requestedAt: Date;
    deliveredAt: Date | null;
    rejectionNote: string | null;
}>;
export declare function getPendingRequests(parentId: string): Promise<({
    child: {
        id: string;
        name: string;
        avatar: string;
        color: string;
        stars: number;
    };
    reward: {
        id: string;
        name: string;
        emoji: string;
        pointsCost: number;
    };
} & {
    status: import(".prisma/client").$Enums.RequestStatus;
    id: string;
    childId: string;
    rejectedAt: Date | null;
    rewardId: string;
    starsCost: number;
    requestedAt: Date;
    deliveredAt: Date | null;
    rejectionNote: string | null;
})[]>;
export declare function deliverReward(requestId: string, parentId: string): Promise<{
    delivered: boolean;
}>;
export declare function rejectRewardRequest(requestId: string, parentId: string, data: RejectRewardRequestInput): Promise<{
    rejected: boolean;
}>;
export declare function getRequestHistory(parentId: string, childId?: string): Promise<({
    child: {
        id: string;
        name: string;
        avatar: string;
    };
    reward: {
        id: string;
        name: string;
        emoji: string;
    };
} & {
    status: import(".prisma/client").$Enums.RequestStatus;
    id: string;
    childId: string;
    rejectedAt: Date | null;
    rewardId: string;
    starsCost: number;
    requestedAt: Date;
    deliveredAt: Date | null;
    rejectionNote: string | null;
})[]>;
//# sourceMappingURL=rewards.service.d.ts.map