// نستورد 3 دوال من ملف badgeUtils عشان نختبرها
import {
  getBadgeForLevel,    // ترجع الشارة المناسبة حسب المستوى والجنس
  calculateBadges,     // تحسب كل الشارات اللي كسبها الطفل من المستوى 1 لحد مستواه الحالي
  shouldAwardNewBadge, // تتحقق إذا الطفل كسب شارة جديدة بعد ما ارتفع مستواه
} from '../../src/utils/badgeUtils';

// ============================================================
// مجموعة اختبارات لدالة getBadgeForLevel
// ============================================================

describe('getBadgeForLevel', () => {

  it('returns the correct badge for a boy at level 5', () => {
    // نستدعي الدالة ونعطيها مستوى 5 وجنس "ولد"
    // النتيجة تُخزّن في متغير اسمه badge
    const badge = getBadgeForLevel(5, 'boy');

    // not.toBeNull() = نتأكد إن الدالة ما رجعت null (يعني لقت شارة)
    expect(badge).not.toBeNull();

    // badge?.emoji = نقرأ الإيموجي من الشارة (علامة ? تحمي لو badge كان null)
    // المستوى 5 يقع في نطاق 1-9 عند الأولاد ← شارتها ⭐
    expect(badge?.emoji).toBe('⭐');

    // نتحقق كذلك من اسم الشارة
    expect(badge?.name).toBe('النجمة');
  });

  it('returns the correct badge for a girl at level 15', () => {
    // نعطيها مستوى 15 وجنس "بنت"
    const badge = getBadgeForLevel(15, 'girl');

    // نتأكد إن فيه شارة
    expect(badge).not.toBeNull();

    // المستوى 15 يقع في نطاق 10-19 عند البنات ← شارتها 🌼
    expect(badge?.emoji).toBe('🌼');
    expect(badge?.name).toBe('الأقحوان');
  });

  it('returns null for level 0 (out of range)', () => {
    // المستوى 0 ما موجود في أي نطاق (النطاقات تبدأ من 1)
    const badge = getBadgeForLevel(0, 'boy');

    // toBeNull() = نتوقع إن الدالة ترجع null لأنه مستوى غير موجود
    expect(badge).toBeNull();
  });

}); // نهاية مجموعة getBadgeForLevel

// ============================================================
// مجموعة اختبارات لدالة calculateBadges
// ============================================================

describe('calculateBadges', () => {

  it('returns correct number of badges for a given level', () => {
    // نعطيها مستوى 25 وجنس "ولد"
    // المستوى 25 يشمل 3 نطاقات: (1-9) و(10-19) و(20-29)
    // ← المفروض ترجع 3 شارات
    const badges = calculateBadges(25, 'boy');

    // .length = عدد العناصر في المصفوفة
    // نتوقع إن يكون 3 شارات بالضبط
    expect(badges.length).toBe(3);
  });

}); // نهاية مجموعة calculateBadges

// ============================================================
// مجموعة اختبارات لدالة shouldAwardNewBadge
// ============================================================

describe('shouldAwardNewBadge', () => {

  it('returns true when the player crosses a tier boundary', () => {
    // المستوى تغير من 9 إلى 10
    // المستوى 9  ← نطاق 1-9  ← شارة ⭐
    // المستوى 10 ← نطاق 10-19 ← شارة 🌟
    // الشارة تغيرت ← المفروض يرجع true (يستحق شارة جديدة)
    expect(shouldAwardNewBadge(9, 10, 'boy')).toBe(true);
  });

  it('returns false when staying within the same tier', () => {
    // المستوى تغير من 5 إلى 7
    // كلاهما في نطاق 1-9 ← نفس الشارة ⭐
    // الشارة ما تغيرت ← المفروض يرجع false
    expect(shouldAwardNewBadge(5, 7, 'boy')).toBe(false);
  });

}); // نهاية مجموعة shouldAwardNewBadge
