import { z } from 'zod';

export const createRewardSchema = z.object({
  childId: z.string().optional().nullable(),
  name: z.string().min(1).max(100),
  emoji: z.string().min(1),
  pointsCost: z.number().int().min(0),
  type: z.enum(['small', 'medium', 'large']),
  category: z.string().optional(),
});

export const updateRewardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  emoji: z.string().optional(),
  pointsCost: z.number().int().min(1).optional(),
  type: z.enum(['small', 'medium', 'large']).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const rewardRequestSchema = z.object({
  rewardId: z.string().min(1),
});

export const rejectRewardRequestSchema = z.object({
  note: z.string().max(500).optional(),
});

export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type RewardRequestInput = z.infer<typeof rewardRequestSchema>;
export type RejectRewardRequestInput = z.infer<typeof rejectRewardRequestSchema>;
