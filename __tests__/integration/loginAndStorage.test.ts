// =============================================================
// الاختبار الثالث: التحقق من المدخلات والحفظ معاً
// =============================================================
//
// الهدف من هذا الاختبار:
// نتأكد إن لما يدخل الأب إيميل وكلمة مرور صحيحتين،
// رمز الدخول يُحفظ في الجهاز فعلاً.
// ولما يدخل بيانات خاطئة، ما يُحفظ أي شي.
//
// ليش مهم؟
// اختبرنا التحقق من الإيميل لحاله، واختبرنا الحفظ لحاله.
// لكن في التطبيق الحقيقي، الخطوتين مرتبطتين:
// التحقق أولاً، ثم الحفظ لو كان صحيحاً.
// لو في خلل في هذا الترتيب، ممكن يُحفظ رمز دخول لبيانات خاطئة،
// أو ما يُحفظ رمز دخول لبيانات صحيحة، وكلاهما مشكلة كبيرة.
// =============================================================

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { isValidEmail, isValidPassword } from '../../src/utils/loginValidation';
import * as storage from '../../src/services/storage';

// دالة تحاكي ما يصير بعد تسجيل الدخول الناجح في التطبيق
async function simulateLogin(email: string, password: string): Promise<boolean> {
  // الخطوة الأولى: نتحقق من صحة المدخلات
  if (!isValidEmail(email) || !isValidPassword(password)) {
    return false; // مدخلات خاطئة، نوقف العملية
  }
  // الخطوة الثانية: لو المدخلات صحيحة، نحفظ رمز الدخول
  await storage.saveParentTokens('رمز-ناجح-789', 'رمز-تجديد-789');
  return true;
}

describe('التحقق من المدخلات والحفظ معاً', () => {

  it('بيانات صحيحة تحفظ رمز الدخول في الجهاز', async () => {
    const success = await simulateLogin('user@example.com', '12345678');

    // نتأكد إن العملية نجحت
    expect(success).toBe(true);

    // نتأكد إن رمز الدخول اتحفظ فعلاً
    const token = await storage.getParentAccessToken();
    expect(token).toBe('رمز-ناجح-789');

    await storage.clearParentData();
  });

  it('بيانات خاطئة لا تحفظ أي رمز دخول', async () => {
    const success = await simulateLogin('بريد-خاطئ', '123');

    // نتأكد إن العملية فشلت
    expect(success).toBe(false);

    // نتأكد إن ما اتحفظ أي رمز دخول
    const token = await storage.getParentAccessToken();
    expect(token).toBeNull();
  });

});
