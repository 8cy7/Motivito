import { z } from 'zod';

export const createChildSchema = z.object({
  name: z.string().min(1).max(50),
  avatar: z.string().min(1),
  gender: z.enum(['boy', 'girl']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isAvatarImage: z.boolean().optional().default(false),
  // PIN اختياري — الأب يضع PIN مؤقت، أو يتركه فارغ ليختاره الطفل بعد مسح QR
  pin: z.string().length(4).regex(/^\d{4}$/).optional(),
});

export const updateChildSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isAvatarImage: z.boolean().optional(),
});

// الأب يعيد ضبط PIN الطفل (لا يحتاج القديم — الأب هو صاحب الصلاحية)
export const resetChildPinSchema = z.object({
  newPin: z.string().length(4).regex(/^\d{4}$/),
});

// الطفل يختار PIN لأول مرة بعد مسح QR
export const setupPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN يجب أن يكون 4 أرقام'),
});

// الطفل يغيّر PIN الخاص فيه (يعرف القديم)
export const changeChildPinSchema = z.object({
  currentPin: z.string().length(4).regex(/^\d{4}$/),
  newPin: z.string().length(4).regex(/^\d{4}$/),
});

export const linkDeviceSchema = z.object({
  token: z.string().uuid(),
  fcmToken: z.string().optional(),
});

export const updateFcmSchema = z.object({
  fcmToken: z.string().min(1),
});

export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type ResetChildPinInput = z.infer<typeof resetChildPinSchema>;
export type SetupPinInput = z.infer<typeof setupPinSchema>;
export type ChangeChildPinInput = z.infer<typeof changeChildPinSchema>;
export type LinkDeviceInput = z.infer<typeof linkDeviceSchema>;
