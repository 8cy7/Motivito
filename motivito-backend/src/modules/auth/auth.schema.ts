import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
  parentPin: z.string().length(4).regex(/^\d{4}$/, 'PIN يجب أن يكون 4 أرقام'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginPinSchema = z.object({
  email: z.string().email(),
  parentPin: z.string().length(4).regex(/^\d{4}$/),
});

export const childLoginSchema = z.object({
  childId: z.string().min(1),
  pin: z.string().length(4).regex(/^\d{4}$/),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginPinInput = z.infer<typeof loginPinSchema>;
export type ChildLoginInput = z.infer<typeof childLoginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
