// كم XP يحتاج الطفل للوصول للمستوى التالي
export function xpForNextLevel(level: number): number {
  return (level + 1) * 100;
}

// احسب المستوى الجديد بعد كسب XP
export function calculateLevelUp(level: number, xp: number, earned: number) {
  let newLevel = level;
  let newXP = xp + earned;
  let needed = xpForNextLevel(newLevel);

  while (newXP >= needed) {
    newXP -= needed;
    newLevel++;
    needed = xpForNextLevel(newLevel);
  }

  return { level: newLevel, xp: newXP };
}
