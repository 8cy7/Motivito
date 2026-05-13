// نستورد الدوالين من ملف levelUtils
import { xpForNextLevel, calculateLevelUp } from '../../src/utils/levelUtils';

describe('xpForNextLevel', () => {

  it('returns 200 XP for level 1', () => {
    // المعادلة: (1 + 1) × 100 = 200
    expect(xpForNextLevel(1)).toBe(200);
  });

  it('returns 1000 XP for level 9', () => {
    // المعادلة: (9 + 1) × 100 = 1000
    expect(xpForNextLevel(9)).toBe(1000);
  });

});

describe('calculateLevelUp', () => {

  it('advances from level 1 to level 2 after earning 200 XP', () => {
    const result = calculateLevelUp(1, 0, 200);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(0); // استهلك كل الـ XP للترقية
  });

});
