import { z } from 'zod';
export declare const createTaskSchema: z.ZodObject<{
    childId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    points: z.ZodNumber;
    category: z.ZodEnum<["daily", "weekly", "special"]>;
    frequency: z.ZodEnum<["once", "daily", "weekly"]>;
    dueDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    childId: string;
    frequency: "once" | "daily" | "weekly";
    difficulty: "easy" | "medium" | "hard";
    points: number;
    category: "daily" | "weekly" | "special";
    description?: string | undefined;
    dueDate?: string | undefined;
}, {
    title: string;
    childId: string;
    frequency: "once" | "daily" | "weekly";
    difficulty: "easy" | "medium" | "hard";
    points: number;
    category: "daily" | "weekly" | "special";
    description?: string | undefined;
    dueDate?: string | undefined;
}>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
    points: z.ZodOptional<z.ZodNumber>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    isActive?: boolean | undefined;
    description?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    points?: number | undefined;
    dueDate?: string | null | undefined;
}, {
    title?: string | undefined;
    isActive?: boolean | undefined;
    description?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    points?: number | undefined;
    dueDate?: string | null | undefined;
}>;
export declare const completeTaskSchema: z.ZodObject<{
    timeSpent: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeSpent?: number | undefined;
}, {
    timeSpent?: number | undefined;
}>;
export declare const rejectTaskSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const bulkCreateTasksSchema: z.ZodObject<{
    tasks: z.ZodArray<z.ZodObject<{
        childId: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
        points: z.ZodNumber;
        category: z.ZodEnum<["daily", "weekly", "special"]>;
        frequency: z.ZodEnum<["once", "daily", "weekly"]>;
        dueDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        childId: string;
        frequency: "once" | "daily" | "weekly";
        difficulty: "easy" | "medium" | "hard";
        points: number;
        category: "daily" | "weekly" | "special";
        description?: string | undefined;
        dueDate?: string | undefined;
    }, {
        title: string;
        childId: string;
        frequency: "once" | "daily" | "weekly";
        difficulty: "easy" | "medium" | "hard";
        points: number;
        category: "daily" | "weekly" | "special";
        description?: string | undefined;
        dueDate?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tasks: {
        title: string;
        childId: string;
        frequency: "once" | "daily" | "weekly";
        difficulty: "easy" | "medium" | "hard";
        points: number;
        category: "daily" | "weekly" | "special";
        description?: string | undefined;
        dueDate?: string | undefined;
    }[];
}, {
    tasks: {
        title: string;
        childId: string;
        frequency: "once" | "daily" | "weekly";
        difficulty: "easy" | "medium" | "hard";
        points: number;
        category: "daily" | "weekly" | "special";
        description?: string | undefined;
        dueDate?: string | undefined;
    }[];
}>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type RejectTaskInput = z.infer<typeof rejectTaskSchema>;
export type BulkCreateTasksInput = z.infer<typeof bulkCreateTasksSchema>;
//# sourceMappingURL=tasks.schema.d.ts.map