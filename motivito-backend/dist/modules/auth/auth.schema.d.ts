import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    parentPin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    parentPin: string;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    parentPin: string;
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const loginPinSchema: z.ZodObject<{
    email: z.ZodString;
    parentPin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    parentPin: string;
}, {
    email: string;
    parentPin: string;
}>;
export declare const childLoginSchema: z.ZodObject<{
    childId: z.ZodString;
    pin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    childId: string;
    pin: string;
}, {
    childId: string;
    pin: string;
}>;
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginPinInput = z.infer<typeof loginPinSchema>;
export type ChildLoginInput = z.infer<typeof childLoginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
//# sourceMappingURL=auth.schema.d.ts.map