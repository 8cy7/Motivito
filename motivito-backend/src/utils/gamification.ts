// =============================================
// Boy Badge Tiers
// =============================================
const BOY_BADGE_TIERS = [
  { minLevel: 1,  maxLevel: 9,   emoji: '⭐',     color: '#FFA500', name: 'النجمة' },
  { minLevel: 10, maxLevel: 19,  emoji: '🌟',     color: '#FFD700', name: 'النجم الساطع' },
  { minLevel: 20, maxLevel: 29,  emoji: '🔥',     color: '#FF4500', name: 'النار' },
  { minLevel: 30, maxLevel: 39,  emoji: '⚡',     color: '#FFFF00', name: 'البرق' },
  { minLevel: 40, maxLevel: 49,  emoji: '🛡️',    color: '#4682B4', name: 'الدرع' },
  { minLevel: 50, maxLevel: 59,  emoji: '⚔️',    color: '#708090', name: 'السيف' },
  { minLevel: 60, maxLevel: 69,  emoji: '🦁',     color: '#DAA520', name: 'الأسد' },
  { minLevel: 70, maxLevel: 79,  emoji: '🚀',     color: '#4169E1', name: 'الصاروخ' },
  { minLevel: 80, maxLevel: 89,  emoji: '🦸‍♂️',  color: '#DC143C', name: 'البطل' },
  { minLevel: 90, maxLevel: 100, emoji: '👑',     color: '#FFD700', name: 'التاج' },
];

// =============================================
// Girl Badge Tiers
// =============================================
const GIRL_BADGE_TIERS = [
  { minLevel: 1,  maxLevel: 9,   emoji: '🌷',     color: '#FF69B4', name: 'الزهرة' },
  { minLevel: 10, maxLevel: 19,  emoji: '🌼',     color: '#FFD700', name: 'الأقحوان' },
  { minLevel: 20, maxLevel: 29,  emoji: '🌈',     color: '#FF1493', name: 'قوس القزح' },
  { minLevel: 30, maxLevel: 39,  emoji: '🦋',     color: '#9370DB', name: 'الفراشة' },
  { minLevel: 40, maxLevel: 49,  emoji: '💎',     color: '#4FACFE', name: 'الماسة' },
  { minLevel: 50, maxLevel: 59,  emoji: '🌟',     color: '#FFD700', name: 'النجمة الساطعة' },
  { minLevel: 60, maxLevel: 69,  emoji: '👑',     color: '#FFD700', name: 'التاج' },
  { minLevel: 70, maxLevel: 79,  emoji: '🧚‍♀️',  color: '#FF69B4', name: 'الجنية' },
  { minLevel: 80, maxLevel: 89,  emoji: '💫',     color: '#DDA0DD', name: 'النجمة المتألقة' },
  { minLevel: 90, maxLevel: 100, emoji: '🌸👑',   color: '#FFD700', name: 'ملكة الزهور' },
];

// =============================================
// Battle Pass Rewards
// =============================================
const BOYS_BATTLE_PASS = [
  { level: 10,  type: 'message', data: { text: 'أنت قدوتي ! 💪' } },
  { level: 20,  type: 'message', data: { text: 'كل يوم أتعلم منك ! 📚' } },
  { level: 30,  type: 'emoji',   data: { emoji: '😎', name: 'الواثق' } },
  { level: 40,  type: 'message', data: { text: 'أنا فخور بك ! 🌟' } },
  { level: 50,  type: 'voucher', data: { name: 'قسيمة نون', value: '10 ريال' } },
  { level: 60,  type: 'emoji',   data: { emoji: '🦸‍♂️', name: 'البطل' } },
  { level: 70,  type: 'message', data: { text: 'إنجازاتك تلهمني كل يوم ! 🏆' } },
  { level: 80,  type: 'voucher', data: { name: 'قسيمة أمازون', value: '20 ريال' } },
  { level: 90,  type: 'emoji',   data: { emoji: '🤴', name: 'الملك' } },
  { level: 100, type: 'mystery', data: { name: 'مفاجأة كبرى', options: ['PlayStation', 'جرير'] } },
];

const GIRLS_BATTLE_PASS = [
  { level: 10,  type: 'message', data: { text: 'إبداعاتي من تعليمك ! ✨' } },
  { level: 20,  type: 'message', data: { text: 'انت مصدر إلهام ! 💖' } },
  { level: 30,  type: 'emoji',   data: { emoji: '🦋', name: 'الفراشة' } },
  { level: 40,  type: 'message', data: { text: 'كل لحظة مليئة بالفرح ! 🌸' } },
  { level: 50,  type: 'voucher', data: { name: 'قسيمة نون', value: '10 ريال' } },
  { level: 60,  type: 'emoji',   data: { emoji: '🧚', name: 'الرشيقة' } },
  { level: 70,  type: 'message', data: { text: 'وجودك بحياتي هو أعظم نعمة 💖' } },
  { level: 80,  type: 'voucher', data: { name: 'قسيمة أمازون', value: '20 ريال' } },
  { level: 90,  type: 'emoji',   data: { emoji: '👸', name: 'الملكة' } },
  { level: 100, type: 'mystery', data: { name: 'مفاجأة كبرى', options: ['PlayStation', 'جرير'] } },
];

// =============================================
// XP needed per level: level * 100
// =============================================
export function calculateLevel(currentXP: number, currentLevel: number) {
  let level = currentLevel;
  let xp = currentXP;
  while (xp >= (level + 1) * 100) {
    xp -= (level + 1) * 100;
    level++;
  }
  return { level, xp };
}

export function xpToNextLevel(level: number) {
  return (level + 1) * 100;
}

export function checkNewBadges(
  oldLevel: number,
  newLevel: number,
  gender: 'boy' | 'girl'
): Array<{ level: number; emoji: string; color: string }> {
  const tiers = gender === 'boy' ? BOY_BADGE_TIERS : GIRL_BADGE_TIERS;
  return tiers
    .filter((tier) => oldLevel < tier.minLevel && newLevel >= tier.minLevel)
    .map((tier) => ({
      level: tier.minLevel,
      emoji: tier.emoji,
      color: tier.color,
    }));
}

export function checkBattlePass(
  oldLevel: number,
  newLevel: number,
  gender: 'boy' | 'girl'
): Array<{ level: number; rewardType: string; rewardData: object }> {
  const rewards = gender === 'boy' ? BOYS_BATTLE_PASS : GIRLS_BATTLE_PASS;
  return rewards
    .filter((r) => oldLevel < r.level && newLevel >= r.level)
    .map((r) => ({
      level: r.level,
      rewardType: r.type,
      rewardData: r.data,
    }));
}

export function getBattlePassProgress(gender: 'boy' | 'girl') {
  return gender === 'boy' ? BOYS_BATTLE_PASS : GIRLS_BATTLE_PASS;
}
