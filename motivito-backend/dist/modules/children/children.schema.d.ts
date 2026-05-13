import { z } from 'zod';
export declare const createChildSchema: z.ZodObject<{
    name: z.ZodString;
    avatar: z.ZodString;
    gender: z.ZodEnum<["boy", "girl"]>;
    color: z.ZodOptional<z.ZodString>;
    isAvatarImage: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    pin: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    avatar: string;
    isAvatarImage: boolean;
    gender: "girl" | "boy";
    color?: string | undefined;
    pin?: string | undefined;
}, {
    name: string;
    avatar: string;
    gender: "girl" | "boy";
    isAvatarImage?: boolean | undefined;
    color?: string | undefined;
    pin?: string | undefined;
}>;
export declare const updateChildSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    isAvatarImage: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    avatar?: string | undefined;
    isAvatarImage?: boolean | undefined;
    color?: string | undefined;
}, {
    name?: string | undefined;
    avatar?: string | undefined;
    isAvatarImage?: boolean | undefined;
    color?: string | undefined;
}>;
export declare const resetChildPinSchema: z.ZodObject<{
    newPin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPin: string;
}, {
    newPin: string;
}>;
export declare const setupPinSchema: z.ZodObject<{
    pin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pin: string;
}, {
    pin: string;
}>;
export declare const changeChildPinSchema: z.ZodObject<{
    currentPin: z.ZodString;
    newPin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPin: string;
    currentPin: string;
}, {
    newPin: string;
    currentPin: string;
}>;
export declare const linkDeviceSchema: z.ZodObject<{
    token: z.ZodString;
    fcmToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    token: string;
    fcmToken?: string | undefined;
}, {
    token: string;
    fcmToken?: string | undefined;
}>;
export declare const updateFcmSchema: z.ZodObject<{
    fcmToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fcmToken: string;
}, {
    fcmToken: string;
}>;
export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type ResetChildPinInput = z.infer<typeof resetChildPinSchema>;
export type SetupPinInput = z.infer<typeof setupPinSchema>;
export type ChangeChildPinInput = z.infer<typeof changeChildPinSchema>;
export type LinkDeviceInput = z.infer<typeof linkDeviceSchema>;
//# sourceMappingURL=children.schema.d.ts.map