import { z } from 'zod';

export const createTaskSchema = z.object({
  childId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  points: z.number().int().min(1).max(1000),
  category: z.enum(['daily', 'weekly', 'special']),
  frequency: z.enum(['once', 'daily', 'weekly']),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  points: z.number().int().min(1).max(1000).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const completeTaskSchema = z.object({
  timeSpent: z.number().int().min(0).optional(),
});

export const rejectTaskSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const bulkCreateTasksSchema = z.object({
  tasks: z.array(createTaskSchema).min(1).max(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type RejectTaskInput = z.infer<typeof rejectTaskSchema>;
export type BulkCreateTasksInput = z.infer<typeof bulkCreateTasksSchema>;
