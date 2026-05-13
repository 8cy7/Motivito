// نستورد الدوال اللي نبي نختبرها من ملف loginValidation
// كل دالة مسؤولة عن التحقق من نوع معين من المدخلات
import {
  isValidEmail,    // دالة تتحقق إن الإيميل صحيح
  isValidPassword, // دالة تتحقق إن الباسورد صحيح
  isValidPin,      // دالة تتحقق إن الـ PIN صحيح
} from '../../src/utils/loginValidation';

// ============================================================
// describe = مجموعة اختبارات، نحطها عشان نجمّع الاختبارات
//            اللي تخص نفس الدالة في مكان واحد
// ============================================================

// مجموعة اختبارات خاصة بدالة isValidEmail
describe('isValidEmail', () => {

  // it = اختبار واحد، الجملة اللي بداخله تشرح شو المفروض يصير
  it('returns true for a valid email', () => {
    // expect = "أتوقع أن..."
    // isValidEmail('user@example.com') = ندخّل إيميل صحيح فيه @ ونقطة
    // toBe(true) = النتيجة المتوقعة هي true (الإيميل صحيح)
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns false when the email has no @ symbol', () => {
    // ندخّل إيميل بدون @ ← المفروض يرجع false
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('returns false for an empty string', () => {
    // ندخّل نص فاضي ← المفروض يرجع false
    expect(isValidEmail('')).toBe(false);
  });

}); // نهاية مجموعة اختبارات isValidEmail

// ============================================================
// مجموعة اختبارات خاصة بدالة isValidPassword
// ============================================================

describe('isValidPassword', () => {

  it('returns true for a password with 8 or more characters', () => {
    // '12345678' = 8 أحرف بالضبط ← المفروض يرجع true
    expect(isValidPassword('12345678')).toBe(true);
  });

  it('returns false for a password shorter than 8 characters', () => {
    // '123' = 3 أحرف فقط، أقل من 8 ← المفروض يرجع false
    expect(isValidPassword('123')).toBe(false);
  });

}); // نهاية مجموعة اختبارات isValidPassword

// ============================================================
// مجموعة اختبارات خاصة بدالة isValidPin
// ============================================================

describe('isValidPin', () => {

  it('returns true for a valid 4-digit PIN', () => {
    // '1234' = 4 أرقام صحيحة ← المفروض يرجع true
    expect(isValidPin('1234')).toBe(true);
  });

  it('returns false for a PIN with letters', () => {
    // '12ab' = فيه حروف مش أرقام ← المفروض يرجع false
    expect(isValidPin('12ab')).toBe(false);
  });

  it('returns false for a PIN that is not 4 digits', () => {
    // '12' = رقمين فقط، ناقص ← المفروض يرجع false
    expect(isValidPin('12')).toBe(false);
  });

}); // نهاية مجموعة اختبارات isValidPin
