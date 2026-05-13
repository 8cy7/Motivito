import { z } from 'zod';
export declare const createRewardSchema: z.ZodObject<{
    childId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    emoji: z.ZodString;
    pointsCost: z.ZodNumber;
    type: z.ZodEnum<["small", "medium", "large"]>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "small" | "medium" | "large";
    name: string;
    emoji: string;
    pointsCost: number;
    childId?: string | null | undefined;
    category?: string | undefined;
}, {
    type: "small" | "medium" | "large";
    name: string;
    emoji: string;
    pointsCost: number;
    childId?: string | null | undefined;
    category?: string | undefined;
}>;
export declare const updateRewardSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    emoji: z.ZodOptional<z.ZodString>;
    pointsCost: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["small", "medium", "large"]>>;
    category: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "small" | "medium" | "large" | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    category?: string | undefined;
    emoji?: string | undefined;
    pointsCost?: number | undefined;
}, {
    type?: "small" | "medium" | "large" | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    category?: string | undefined;
    emoji?: string | undefined;
    pointsCost?: number | undefined;
}>;
export declare const rewardRequestSchema: z.ZodObject<{
    rewardId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rewardId: string;
}, {
    rewardId: string;
}>;
export declare const rejectRewardRequestSchema: z.ZodObject<{
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    note?: string | undefined;
}, {
    note?: string | undefined;
}>;
export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type RewardRequestInput = z.infer<typeof rewardRequestSchema>;
export type RejectRewardRequestInput = z.infer<typeof rejectRewardRequestSchema>;
//# sourceMappingURL=rewards.schema.d.ts.map