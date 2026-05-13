// utils/badgeUtils.ts

import { Badge } from '../types';

// تعريف شارات الأولاد حسب نطاقات المستوى
export const BOY_BADGE_TIERS = [
  { minLevel: 1, maxLevel: 9, emoji: '⭐', color: '#FFA500', name: 'النجمة' },
  { minLevel: 10, maxLevel: 19, emoji: '🌟', color: '#FFD700', name: 'النجم الساطع' },
  { minLevel: 20, maxLevel: 29, emoji: '🔥', color: '#FF4500', name: 'النار' },
  { minLevel: 30, maxLevel: 39, emoji: '⚡', color: '#FFFF00', name: 'البرق' },
  { minLevel: 40, maxLevel: 49, emoji: '🛡️', color: '#4682B4', name: 'الدرع' },
  { minLevel: 50, maxLevel: 59, emoji: '⚔️', color: '#708090', name: 'السيف' },
  { minLevel: 60, maxLevel: 69, emoji: '🦁', color: '#DAA520', name: 'الأسد' },
  { minLevel: 70, maxLevel: 79, emoji: '🚀', color: '#4169E1', name: 'الصاروخ' },
  { minLevel: 80, maxLevel: 89, emoji: '🦸‍♂️', color: '#DC143C', name: 'البطل' },
  { minLevel: 90, maxLevel: 100, emoji: '👑', color: '#FFD700', name: 'التاج' },
];

// تعريف شارات البنات حسب نطاقات المستوى
export const GIRL_BADGE_TIERS = [
  { minLevel: 1, maxLevel: 9, emoji: '🌷', color: '#FF69B4', name: 'الزهرة' },
  { minLevel: 10, maxLevel: 19, emoji: '🌼', color: '#FFD700', name: 'الأقحوان' },
  { minLevel: 20, maxLevel: 29, emoji: '🌈', color: '#FF1493', name: 'قوس القزح' },
  { minLevel: 30, maxLevel: 39, emoji: '🦋', color: '#9370DB', name: 'الفراشة' },
  { minLevel: 40, maxLevel: 49, emoji: '💎', color: '#4FACFE', name: 'الماسة' },
  { minLevel: 50, maxLevel: 59, emoji: '🌟', color: '#FFD700', name: 'النجمة الساطعة' },
  { minLevel: 60, maxLevel: 69, emoji: '👑', color: '#FFD700', name: 'التاج' },
  { minLevel: 70, maxLevel: 79, emoji: '🧚‍♀️', color: '#FF69B4', name: 'الجنية' },
  { minLevel: 80, maxLevel: 89, emoji: '💫', color: '#DDA0DD', name: 'النجمة المتألقة' },
  { minLevel: 90, maxLevel: 100, emoji: '🌸👑', color: '#FFD700', name: 'ملكة الزهور' },
];

// الحصول على الشارة المناسبة للمستوى حسب الجنس
export const getBadgeForLevel = (
  level: number,
  gender: 'boy' | 'girl'
): { emoji: string; color: string; name: string } | null => {
  const tiers = gender === 'boy' ? BOY_BADGE_TIERS : GIRL_BADGE_TIERS;
  const tier = tiers.find(t => level >= t.minLevel && level <= t.maxLevel);
  return tier || null;
};

// حساب كل الشارات من المستوى 1 إلى المستوى الحالي (للهيستوري)
export const calculateBadges = (currentLevel: number, gender: 'boy' | 'girl'): Badge[] => {
  const badges: Badge[] = [];
  const tiers = gender === 'boy' ? BOY_BADGE_TIERS : GIRL_BADGE_TIERS;

  // نمر على كل نطاق من 1 إلى المستوى الحالي
  for (const tier of tiers) {
    // إذا المستوى الحالي وصل أو تجاوز بداية هذا النطاق
    if (currentLevel >= tier.minLevel) {
      badges.push({
        id: `badge-${tier.minLevel}-${tier.maxLevel}`,
        level: tier.minLevel, // نستخدم بداية النطاق كمرجع
        emoji: tier.emoji,
        color: tier.color,
        earnedDate: new Date(),
      });
    } else {
      // إذا لم نصل لهذا النطاق، نوقف الحلقة
      break;
    }
  }

  return badges;
};

// الحصول على الشارة الحالية (آخر شارة حصل عليها)
export const getLatestBadge = (badges: Badge[] | undefined): Badge | null => {
  if (!badges || badges.length === 0) return null;

  // آخر شارة في المصفوفة هي الشارة الحالية
  return badges[badges.length - 1];
};

// التحقق من حصول الطفل على شارة جديدة
export const shouldAwardNewBadge = (
  previousLevel: number,
  newLevel: number,
  gender: 'boy' | 'girl'
): boolean => {
  const previousBadge = getBadgeForLevel(previousLevel, gender);
  const newBadge = getBadgeForLevel(newLevel, gender);

  // إذا تغيرت الشارة، معناه حصل على شارة جديدة
  return previousBadge?.emoji !== newBadge?.emoji;
};
