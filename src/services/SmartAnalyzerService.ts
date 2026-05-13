// SmartAnalyzerService.ts
// خدمة التحليل الذكي - يحتوي على جميع دوال الحسابات والإحصائيات
// تم تحديثها: حساب الأسابيع بناءً على أول إنجاز (الأحد كبداية دائمة)

import { Child, Task } from '../types';

// ============================================
// 📊 أنواع البيانات للنتائج
// ============================================

export interface PerformanceOverview {
  childId: string;
  childName: string;
  weeklyCompletion: {
    thisWeek: number;
    lastWeek: number;
    percentageChange: number; // 25 يعني +25%
  };
  completionRate: number; // 0-100
  starsEarned: {
    thisWeek: number;
    lastWeek: number;
  };
  levelsProgressed: number;
  streakDays: number; // عدد أيام الإنجاز المتتالية
}

export interface DailyActivityPattern {
  dayOfWeek: string; // "السبت", "الأحد", etc.
  dayIndex: number; // 0-6
  tasksCompleted: number;
  xpEarned: number;
  starsEarned: number;
  percentageOfWeek: number;
}

export interface TaskPreferences {
  easy: {
    count: number;
    percentage: number;
  };
  medium: {
    count: number;
    percentage: number;
  };
  hard: {
    count: number;
    percentage: number;
  };
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  recommendation: string;
}

export interface LevelPrediction {
  childId: string;
  childName: string;
  currentLevel: number;
  currentXP: number;
  xpNeededForLevel: number;
  xpRemaining: number;
  percentageToNextLevel: number;
  weeklyVelocity: number; // نقاط XP في الأسبوع
  estimatedWeeksToNextLevel: number;
  estimatedCompletionDate: Date;
}

export interface MonthlyTrend {
  week: number;
  weekLabel: string; // "أسبوع 1", etc.
  tasksCompleted: number;
  xpEarned: number;
  starsEarned: number;
  avgTasksPerDay: number;
}

export interface BadgeProgressInfo {
  currentBadge: {
    emoji: string;
    level: number;
    color: string;
  };
  nextBadge: {
    emoji: string;
    level: number;
    color: string;
    levelsRemaining: number;
  } | null;
  allBadges: Array<{
    emoji: string;
    level: number;
    color: string;
    isEarned: boolean;
    earnedDate?: Date;
  }>;
}

export interface BestTimes {
  bestDays: Array<{
    day: string;
    dayIndex: number;
    completionRate: number;
    avgTasks: number;
  }>;
  bestTimeOfDay: Array<{
    period: string; // "صباح", "بعد الظهر", "مساء"
    score: number;
  }>;
  worstDays: Array<{
    day: string;
    dayIndex: number;
    completionRate: number;
  }>;
}

export interface SmartRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  type: 'achievement' | 'motivation' | 'difficulty' | 'activity' | 'reward';
  title: string;
  description: string;
  action?: string;
  actionCallback?: () => void;
}

export interface ComparisonStats {
  childId: string;
  childName: string;
  level: number;
  totalStars: number;
  tasksCompleted: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  currentBadge: string;
  rank: number;
  daysInactive: number;
  childAvatar?: string;
  childPhoto?: string;
  isAvatarImage?: boolean;
  gender?: 'boy' | 'girl';
  currentXP?: number;
  xpNeededForLevel?: number;
}

export interface AnalyticsData {
  child: Child;
  tasks: Task[];
}

// ============================================
// 🎯 SmartAnalyzerService Class
// ============================================

export class SmartAnalyzerService {
  // Helper: الحصول على مهام الطفل المكتملة
  private static getCompletedTasks(tasks: Task[] | undefined, childId: string): Task[] {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter(t => t && t.childId === childId && t.isCompleted);
  }

  // Helper: الحصول على تاريخ اليوم منذ N أيام
  private static getDateNDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Helper: الحصول على بداية الأسبوع (الأحد دائماً = يوم 0)
  private static getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = الأحد
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  // ⭐⭐⭐ الدالة الجديدة: حساب حدود الأسابيع بناءً على أول إنجاز
  // هذه الدالة تحل المشكلة الأساسية للبرنامج
  private static getWeekBoundariesByFirstCompletion(completedTasks: Task[]): {
    firstCompletionDate: Date | null;
    currentWeekStart: Date;
    currentWeekEnd: Date;
    lastWeekStart: Date;
    lastWeekEnd: Date;
  } {
    // إذا لم تكن هناك مهام مكتملة
    if (completedTasks.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentWeekStart = this.getWeekStart(today);
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);

      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(currentWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);

      return {
        firstCompletionDate: null,
        currentWeekStart,
        currentWeekEnd,
        lastWeekStart,
        lastWeekEnd,
      };
    }

    // الحصول على أول تاريخ إنجاز (الأقدم) - هذا يعتبر يوم البداية الحقيقي
    const sortedByDate = completedTasks
      .filter(t => t.completedAt)
      .sort((a, b) => (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0));

    let firstCompletionDate = sortedByDate[0]?.completedAt
      ? new Date(sortedByDate[0].completedAt)
      : new Date();
    firstCompletionDate.setHours(0, 0, 0, 0);

    // ✅ حساب بداية الأسبوع الأول (بداية الأحد في الأسبوع اللي فيه أول إنجاز)
    const firstWeekStart = this.getWeekStart(firstCompletionDate);

    // ✅ استخدام آخر تاريخ إنجاز لحساب الأسبوع الحالي (لا اليوم الفعلي)
    const lastCompletionDate = new Date(sortedByDate[sortedByDate.length - 1].completedAt || new Date());
    lastCompletionDate.setHours(0, 0, 0, 0);
    const todayWeekStart = this.getWeekStart(lastCompletionDate);

    // الفرق بين بداية الأسبوع الحالي وبداية الأسبوع الأول (بالأسابيع)
    const weeksDiff = Math.floor((todayWeekStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // ✅ بداية الأسبوع الحالي
    const currentWeekStart = new Date(firstWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + weeksDiff * 7);

    // ✅ نهاية الأسبوع الحالي (الجمعة = يوم 5، ولكن نحسب حتى السبت ليشمل كل الأسبوع)
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6); // 0-6 = 7 أيام (الأحد إلى السبت)
    currentWeekEnd.setHours(23, 59, 59, 999);

    // ✅ بداية الأسبوع الماضي
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // ✅ نهاية الأسبوع الماضي
    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    return {
      firstCompletionDate,
      currentWeekStart,
      currentWeekEnd,
      lastWeekStart,
      lastWeekEnd,
    };
  }

  // Helper: تحديد رقم اليوم (0 = الأحد)
  private static getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  // Helper: التحويل من رقم اليوم إلى اسم عربي
  private static getDayNameArabic(dayIndex: number): string {
    const names = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return names[dayIndex];
  }

  // Helper: الحصول على نمط يومي فارغ
  private static getEmptyDailyPattern(): DailyActivityPattern[] {
    return Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: this.getDayNameArabic(i),
      dayIndex: i,
      tasksCompleted: 0,
      xpEarned: 0,
      starsEarned: 0,
      percentageOfWeek: 0,
    }));
  }

  // ============================================
  // 📊 Performance Overview (محدث)
  // ============================================
  static getPerformanceOverview(data: AnalyticsData): PerformanceOverview {
    const { child, tasks } = data;
    if (!tasks || !Array.isArray(tasks)) {
      return {
        childId: child.id,
        childName: child.name,
        weeklyCompletion: { thisWeek: 0, lastWeek: 0, percentageChange: 0 },
        completionRate: 0,
        starsEarned: { thisWeek: 0, lastWeek: 0 },
        levelsProgressed: child.level,
        streakDays: 0,
      };
    }

    const childTasks = (tasks || []).filter(t => t && t.childId === child.id);
    const completedTasks = this.getCompletedTasks(tasks, child.id);

    // ✅ استخدام الدالة الجديدة لحساب حدود الأسابيع
    const weekBoundaries = this.getWeekBoundariesByFirstCompletion(completedTasks);
    const { currentWeekStart, currentWeekEnd, lastWeekStart, lastWeekEnd } = weekBoundaries;

    // ✅ حساب المهام المكتملة في الأسبوع الحالي والماضي
    const thisWeekCompleted = completedTasks.filter(
      t => t.completedAt && t.completedAt >= currentWeekStart && t.completedAt <= currentWeekEnd
    ).length;

    const lastWeekCompleted = completedTasks.filter(
      t => t.completedAt && t.completedAt >= lastWeekStart && t.completedAt <= lastWeekEnd
    ).length;

    // حساب النسبة المئوية للفرق
    let percentageChange = 0;
    if (lastWeekCompleted === 0 && thisWeekCompleted > 0) {
      percentageChange = 100;
    } else if (lastWeekCompleted > 0) {
      percentageChange = ((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100;
    }

    // معدل الإكمال
    const completionRate = childTasks.length === 0 ? 0 : (completedTasks.length / childTasks.length) * 100;

    // النجوم المكتسبة هذا الأسبوع والأسبوع الماضي
    const thisWeekStars = completedTasks
      .filter(t => t.completedAt && t.completedAt >= currentWeekStart && t.completedAt <= currentWeekEnd)
      .reduce((sum, t) => sum + t.points, 0);

    const lastWeekStars = completedTasks
      .filter(t => t.completedAt && t.completedAt >= lastWeekStart && t.completedAt <= lastWeekEnd)
      .reduce((sum, t) => sum + t.points, 0);

    // عدد أيام الإنجاز المتتالية (Streak)
    const streak = this.calculateStreak(completedTasks);

    // عدد المستويات المتقدمة
    const levelsProgressed = child.level;

    const result = {
      childId: child.id,
      childName: child.name,
      weeklyCompletion: {
        thisWeek: thisWeekCompleted,
        lastWeek: lastWeekCompleted,
        percentageChange: Math.round(percentageChange),
      },
      completionRate: Math.round(completionRate),
      starsEarned: {
        thisWeek: thisWeekStars,
        lastWeek: lastWeekStars,
      },
      levelsProgressed,
      streakDays: streak,
    };

    return result;
  }

  // ============================================
  // 📈 Daily Activity Pattern (محدث)
  // ============================================
  static getDailyActivityPattern(data: AnalyticsData): DailyActivityPattern[] {
    const { tasks } = data;
    if (!tasks || !Array.isArray(tasks)) return this.getEmptyDailyPattern();

    const completedTasks = this.getCompletedTasks(tasks, data.child.id);

    // ✅ استخدام الدالة الجديدة لحساب حدود الأسابيع
    const weekBoundaries = this.getWeekBoundariesByFirstCompletion(completedTasks);
    const { currentWeekStart } = weekBoundaries;

    const pattern: DailyActivityPattern[] = [];
    let totalWeekTasks = 0;
    let totalWeekXP = 0;
    let totalWeekStars = 0;

    // حساب الإحصائيات لكل يوم من أيام الأسبوع الحالي
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(dayDate.getDate() + i);
      dayDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(dayDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayTasks = completedTasks.filter(
        t => t.completedAt && t.completedAt >= dayDate && t.completedAt < nextDay
      );

      const tasksCompleted = dayTasks.length;
      const xpEarned = dayTasks.reduce((sum, t) => sum + t.points, 0);
      const starsEarned = dayTasks.reduce((sum, t) => sum + t.points, 0);

      totalWeekTasks += tasksCompleted;
      totalWeekXP += xpEarned;
      totalWeekStars += starsEarned;

      pattern.push({
        dayOfWeek: this.getDayNameArabic(i),
        dayIndex: i,
        tasksCompleted,
        xpEarned,
        starsEarned,
        percentageOfWeek: 0, // سيتم تحديثه لاحقاً
      });
    }

    // تحديث نسب المئة
    pattern.forEach(p => {
      p.percentageOfWeek = totalWeekTasks === 0 ? 0 : (p.tasksCompleted / totalWeekTasks) * 100;
    });

    return pattern;
  }

  // ============================================
  // 🎯 Task Preferences
  // ============================================
  static getTaskPreferences(data: AnalyticsData): TaskPreferences {
    const { tasks, child } = data;
    if (!tasks || !Array.isArray(tasks)) {
      return {
        easy: { count: 0, percentage: 0 },
        medium: { count: 0, percentage: 0 },
        hard: { count: 0, percentage: 0 },
        preferredDifficulty: 'easy',
        recommendation: 'لا توجد بيانات كافية للتحليل',
      };
    }

    const completedTasks = this.getCompletedTasks(tasks, data.child.id);

    const easy = completedTasks.filter(t => t.difficulty === 'easy').length;
    const medium = completedTasks.filter(t => t.difficulty === 'medium').length;
    const hard = completedTasks.filter(t => t.difficulty === 'hard').length;
    const total = easy + medium + hard;

    const easyPercentage = total === 0 ? 0 : (easy / total) * 100;
    const mediumPercentage = total === 0 ? 0 : (medium / total) * 100;
    const hardPercentage = total === 0 ? 0 : (hard / total) * 100;

    // تحديد الصعوبة المفضلة
    const max = Math.max(easyPercentage, mediumPercentage, hardPercentage);
    let preferredDifficulty: 'easy' | 'medium' | 'hard' = 'easy';
    if (easyPercentage === max) {
      preferredDifficulty = 'easy';
    } else if (mediumPercentage === max) {
      preferredDifficulty = 'medium';
    } else {
      preferredDifficulty = 'hard';
    }

    const preferences = {
      easy: {
        count: easy,
        percentage: easyPercentage,
      },
      medium: {
        count: medium,
        percentage: mediumPercentage,
      },
      hard: {
        count: hard,
        percentage: hardPercentage,
      },
      preferredDifficulty,
      recommendation: '',
    };

    // الاقتراح - نظام التوازن الذكي
    // ✅ الحالة المثالية: سهل > متوسط > صعب
    const isIdealBalance =
      easyPercentage > mediumPercentage &&
      mediumPercentage > hardPercentage;

    if (isIdealBalance) {
      // التوازن جيد جداً - عدم إظهار رسالة تحذيرية
      preferences.recommendation = 'توازن ممتاز بين مستويات الصعوبة! 🎯 احرص على هذا النمط الرائع!';
    } else if (easyPercentage > 80) {
      // السهل تجاوز 80% - يحتاج توازن
      const genderPrefix = child.gender === 'girl' ? 'تفضلة' : 'يفضل';
      preferences.recommendation = `${child.name} ${genderPrefix} المهام السهلة كثيراً! 🎪 لازم نوازن أكثر بإضافة مهام متوسطة وصعبة للتحدي والتطور.`;
    } else if (mediumPercentage > 70) {
      // المتوسط تجاوز 70% - يحتاج توازن
      const genderPrefix = child.gender === 'girl' ? 'تركزة' : 'يركز';
      preferences.recommendation = `${child.name} ${genderPrefix} على المهام المتوسطة أكثر من اللازم! 🎭 نوازن بإضافة مهام سهلة لزيادة الثقة ومهام صعبة للتحدي.`;
    } else if (hardPercentage > 40) {
      // الصعب تجاوز 40% - يحتاج توازن
      const genderPrefix = child.gender === 'girl' ? 'تركزة' : 'يركز';
      preferences.recommendation = `${child.name} ${genderPrefix} على المهام الصعبة جداً! 🚀 نوازن بإضافة مهام سهلة ومتوسطة لتجنب الملل والتوتر.`;
    } else {
      // توازن مقبول
      preferences.recommendation = 'التوازن جيد بين مستويات الصعوبة! 👍 استمر على هذا النمط الصحيح.';
    }

    return preferences;
  }

  // ============================================
  // 🚀 Level Prediction
  // ============================================
  static getLevelPrediction(data: AnalyticsData): LevelPrediction {
    const { child, tasks } = data;
    if (!tasks || !Array.isArray(tasks)) {
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 7);
      return {
        childId: child.id,
        childName: child.name,
        currentLevel: child.level,
        currentXP: child.xp || 0,
        xpNeededForLevel: (child.level + 1) * 100,
        xpRemaining: ((child.level + 1) * 100) - (child.xp || 0),
        percentageToNextLevel: ((child.xp || 0) / ((child.level + 1) * 100)) * 100,
        weeklyVelocity: 50,
        estimatedWeeksToNextLevel: 2,
        estimatedCompletionDate: estimatedDate,
      };
    }

    const completedTasks = this.getCompletedTasks(tasks, child.id);

    const xpNeededForLevel = (child.level + 1) * 100;
    const xpRemaining = xpNeededForLevel - child.xp;
    const percentageToNextLevel = (child.xp / xpNeededForLevel) * 100;

    // حساب السرعة الأسبوعية (XP في الأسبوع)
    const weekBoundaries = this.getWeekBoundariesByFirstCompletion(completedTasks);
    const { currentWeekStart, currentWeekEnd } = weekBoundaries;

    const weeklyXP = completedTasks
      .filter(t => t.completedAt && t.completedAt >= currentWeekStart && t.completedAt <= currentWeekEnd)
      .reduce((sum, t) => sum + t.points, 0);

    // إذا كانت السرعة صفر، سنفترض سرعة منخفضة
    const velocity = weeklyXP || 50; // minimum 50 XP per week as fallback

    const weeksNeeded = Math.ceil(xpRemaining / velocity);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + weeksNeeded * 7);

    return {
      childId: child.id,
      childName: child.name,
      currentLevel: child.level,
      currentXP: child.xp,
      xpNeededForLevel,
      xpRemaining,
      percentageToNextLevel: Math.round(percentageToNextLevel),
      weeklyVelocity: velocity,
      estimatedWeeksToNextLevel: weeksNeeded,
      estimatedCompletionDate: estimatedDate,
    };
  }

  // ============================================
  // 📅 Monthly Trends
  // ============================================
  static getMonthlyTrends(data: AnalyticsData): MonthlyTrend[] {
    const { tasks } = data;
    if (!tasks || !Array.isArray(tasks)) {
      return Array.from({ length: 4 }, (_, i) => ({
        week: i + 1,
        weekLabel: `أسبوع ${i + 1}`,
        tasksCompleted: 0,
        xpEarned: 0,
        starsEarned: 0,
        avgTasksPerDay: 0,
      }));
    }

    const completedTasks = this.getCompletedTasks(tasks, data.child.id);
    const weekBoundaries = this.getWeekBoundariesByFirstCompletion(completedTasks);
    const { currentWeekStart } = weekBoundaries;

    const trends: MonthlyTrend[] = [];

    // آخر 4 أسابيع (تراجع للخلف من الأسبوع الحالي)
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(weekStart.getDate() - week * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekTasks = completedTasks.filter(
        t => t.completedAt && t.completedAt >= weekStart && t.completedAt <= weekEnd
      );

      const tasksCompleted = weekTasks.length;
      const xpEarned = weekTasks.reduce((sum, t) => sum + t.points, 0);
      const starsEarned = weekTasks.reduce((sum, t) => sum + t.points, 0);
      const avgTasksPerDay = tasksCompleted / 7;

      trends.unshift({
        week: 4 - week,
        weekLabel: `أسبوع ${4 - week}`,
        tasksCompleted,
        xpEarned,
        starsEarned,
        avgTasksPerDay: Math.round(avgTasksPerDay * 10) / 10,
      });
    }

    return trends;
  }

  // ============================================
  // 🏆 Badge Progress
  // ============================================
  static getBadgeProgress(child: Child): BadgeProgressInfo {
    const badgeEmojis = ['🌟', '⭐', '🔥', '⚡', '🛡️', '⚔️', '🦁', '🚀', '🦸', '👑'];
    const currentBadgeIndex = Math.min(Math.floor(child.level / 2), badgeEmojis.length - 1);

    const badges = badgeEmojis.map((emoji, index) => ({
      emoji,
      level: index * 2,
      color: index < currentBadgeIndex ? '#FFD700' : 'rgba(255,255,255,0.3)',
      isEarned: index <= currentBadgeIndex,
      earnedDate: index <= currentBadgeIndex ? child.badges?.[index]?.earnedDate : undefined,
    }));

    const nextBadgeIndex = currentBadgeIndex + 1;
    const nextBadge = nextBadgeIndex < badgeEmojis.length
      ? {
          emoji: badgeEmojis[nextBadgeIndex],
          level: nextBadgeIndex * 2,
          color: '#FFD700',
          levelsRemaining: nextBadgeIndex * 2 - child.level,
        }
      : null;

    return {
      currentBadge: {
        emoji: badgeEmojis[currentBadgeIndex],
        level: child.level,
        color: '#FFD700',
      },
      nextBadge,
      allBadges: badges,
    };
  }

  // ============================================
  // ⏰ Best Times to Motivate
  // ============================================
  static getBestTimes(data: AnalyticsData): BestTimes {
    if (!data || !data.tasks || !Array.isArray(data.tasks)) {
      return {
        bestDays: [],
        bestTimeOfDay: [
          { period: '🌅 الصباح (8-10 AM)', score: 75 },
          { period: '🌞 بعد الظهر (2-4 PM)', score: 70 },
          { period: '🌆 المساء (6-8 PM)', score: 65 },
        ],
        worstDays: [],
      };
    }

    const pattern = this.getDailyActivityPattern(data);

    // أفضل الأيام
    const bestDays = pattern
      .map(p => ({
        day: p.dayOfWeek,
        dayIndex: p.dayIndex,
        completionRate: p.percentageOfWeek,
        avgTasks: p.tasksCompleted,
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3);

    // أسوأ الأيام
    const worstDays = pattern
      .map(p => ({
        day: p.dayOfWeek,
        dayIndex: p.dayIndex,
        completionRate: p.percentageOfWeek,
      }))
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 2);

    // أفضل الأوقات (افتراضية)
    const bestTimeOfDay = [
      { period: '🌅 الصباح (8-10 AM)', score: 85 },
      { period: '🌞 بعد الظهر (2-4 PM)', score: 75 },
      { period: '🌆 المساء (6-8 PM)', score: 70 },
    ];

    return {
      bestDays,
      bestTimeOfDay,
      worstDays,
    };
  }

  // ============================================
  // 💡 Smart Recommendations
  // ============================================
  private static applyGenderTransformation(text: string, gender?: 'boy' | 'girl'): string {
    if (gender !== 'girl') return text;

    // تحويلات للبنات
    const transformations: [RegExp, string][] = [
      [/قريب/g, 'قريبة'],
      [/يفضل/g, 'تفضل'],
      [/يمكنه/g, 'يمكنها'],
      [/يحتاج/g, 'تحتاج'],
      [/لديه/g, 'لديها'],
      [/يكمل/g, 'تكمل'],
      [/يقدم/g, 'تقدم'],
      [/تحسن/g, 'تحسنت'],
      [/متأخر/g, 'متأخرة'],
      [/حاول تحفيزه/g, 'حاول تحفيزها'],
      [/أرسل له/g, 'أرسل لها'],
      [/حفزه/g, 'حفزها'],
      [/كافئه/g, 'كافئها'],
    ];

    return transformations.reduce((result, [pattern, replacement]) =>
      result.replace(pattern, replacement), text);
  }

  static getSmartRecommendations(
    data: AnalyticsData,
    allChildren?: Child[]
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const { child, tasks } = data;

    if (!child) return recommendations;
    if (!tasks || !Array.isArray(tasks)) {
      return [{
        id: 'no-data',
        priority: 'medium',
        type: 'activity',
        title: 'لا توجد بيانات',
        description: 'لم نجد بيانات كافية لتقديم توصيات',
      }];
    }

    const prediction = this.getLevelPrediction(data);
    const preferences = this.getTaskPreferences(data);
    const overview = this.getPerformanceOverview(data);

    // 1. قريب من Badge جديد
    if (prediction.xpRemaining < prediction.weeklyVelocity) {
      recommendations.push({
        id: 'badge-near',
        priority: 'high',
        type: 'achievement',
        title: 'قريب من شارة جديدة! 🎉',
        description: this.applyGenderTransformation(
          `${child.name} قريب جداً من الشارة التالية! يحتاج فقط ${prediction.xpRemaining} نقطة XP.`,
          child.gender
        ),
        action: this.applyGenderTransformation('كافئه بمهام خاصة هذا الأسبوع', child.gender),
      });
    }

    // 2. صعوبة المهام
    if (preferences.preferredDifficulty === 'easy' && preferences.easy.percentage > 70) {
      recommendations.push({
        id: 'difficulty-increase',
        priority: 'medium',
        type: 'difficulty',
        title: 'حان وقت التحدي! 💪',
        description: this.applyGenderTransformation(
          `${child.name} يفضل المهام السهلة. حاول إضافة مهام متوسطة للتطوير أكثر.`,
          child.gender
        ),
        action: 'أضف مهام متوسطة تدريجياً',
      });
    }

    // 3. نجوم تنتهي قريباً
    if (child.stars < 100) {
      recommendations.push({
        id: 'stars-low',
        priority: 'high',
        type: 'reward',
        title: 'النجوم تنتهي قريباً! ⭐',
        description: this.applyGenderTransformation(
          `${child.name} لديه فقط ${child.stars} نجمة. أضف مهام جديدة للحصول على المزيد!`,
          child.gender
        ),
        action: 'أضف مهام جديدة',
      });
    }

    // 4. النشاط منخفض
    if (overview.weeklyCompletion.thisWeek < 3) {
      recommendations.push({
        id: 'low-activity',
        priority: 'high',
        type: 'motivation',
        title: 'النشاط منخفض هذا الأسبوع 📉',
        description: this.applyGenderTransformation(
          `${child.name} لم يكمل سوى ${overview.weeklyCompletion.thisWeek} مهام هذا الأسبوع. حاول تحفيزه!`,
          child.gender
        ),
        action: 'إرسال رسالة تحفيزية',
      });
    }

    // 5. النشاط عالي
    if (overview.weeklyCompletion.thisWeek > 8 && overview.streakDays > 3) {
      recommendations.push({
        id: 'great-progress',
        priority: 'medium',
        type: 'motivation',
        title: 'إنجاز رائع! 🌟',
        description: this.applyGenderTransformation(
          `${child.name} يقدم أداءً ممتازاً مع ${overview.streakDays} أيام متتالية من الإنجاز!`,
          child.gender
        ),
        action: this.applyGenderTransformation('أرسل له رسالة تقدير', child.gender),
      });
    }

    // 6. تحسن كبير
    if (overview.weeklyCompletion.percentageChange > 40) {
      recommendations.push({
        id: 'big-improvement',
        priority: 'medium',
        type: 'motivation',
        title: 'تحسن كبير! 📈',
        description: this.applyGenderTransformation(
          `${child.name} تحسن بـ ${overview.weeklyCompletion.percentageChange}% مقارنة بالأسبوع الماضي!`,
          child.gender
        ),
        action: 'احتفل بهذا التحسن',
      });
    }

    // 7. مقارنة مع الأخوة
    if (allChildren && allChildren.length > 1) {
      const ranking = this.getRankings(allChildren, tasks);
      const childRank = ranking.find(r => r.childId === child.id);
      if (childRank && childRank.rank > 1) {
        const firstPlace = ranking[0];
        const levelDiff = firstPlace.level - childRank.level;
        recommendations.push({
          id: 'siblings-behind',
          priority: 'low',
          type: 'motivation',
          title: this.applyGenderTransformation(
            `متأخر عن ${firstPlace.childName} 📊`,
            child.gender
          ),
          description: this.applyGenderTransformation(
            `${child.name} يمكنه تجاوز ${firstPlace.childName} بـ ${levelDiff} ${levelDiff === 1 ? 'مستوى' : 'مستويات'} فقط!`,
            child.gender
          ),
          action: this.applyGenderTransformation('حفزه للمنافسة', child.gender),
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ============================================
  // 🏆 Siblings Comparison
  // ============================================
  static getRankings(
    children: Child[] | undefined,
    tasks: Task[] | undefined
  ): ComparisonStats[] {
    if (!children || !Array.isArray(children) || children.length === 0) return [];
    if (!tasks || !Array.isArray(tasks)) tasks = [];

    const stats = (children || [])
      .map(child => {
        if (!child) return null;
        const completedTasks = this.getCompletedTasks(tasks, child.id);
        const childTasks = (tasks || []).filter(t => t && t.childId === child.id);
        const completionRate = childTasks.length === 0
          ? 0
          : (completedTasks.length / childTasks.length) * 100;

        const currentXP = child.xp || 0;
        const xpNeededForLevel = (child.level + 1) * 100;

        return {
          childId: child.id,
          childName: child.name,
          level: child.level,
          totalStars: child.stars,
          tasksCompleted: completedTasks.length,
          completionRate: Math.round(completionRate),
          trend: 'up' as const,
          trendPercentage: 0,
          currentBadge: child.badges?.[0]?.emoji || '🌟',
          rank: 0,
          daysInactive: 0,
          childAvatar: child.isAvatarImage ? undefined : child.avatar,
          childPhoto: child.isAvatarImage ? child.avatar : undefined,
          isAvatarImage: child.isAvatarImage,
          gender: child.gender,
          currentXP,
          xpNeededForLevel,
        };
      })
      .filter((stat): stat is ComparisonStats => stat !== null);

    // ترتيب حسب النجوم الكلية
    stats.sort((a, b) => (b.totalStars || 0) - (a.totalStars || 0));

    // تعيين الترتيب
    stats.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    // حساب الأيام غير النشطة
    stats.forEach(stat => {
      const childTasks = (tasks || []).filter(t => t && t.childId === stat.childId);
      const lastCompleted = childTasks
        .filter(t => t.isCompleted && t.completedAt)
        .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))[0];

      if (lastCompleted && lastCompleted.completedAt) {
        const days = Math.floor((new Date().getTime() - lastCompleted.completedAt.getTime()) / (1000 * 60 * 60 * 24));
        stat.daysInactive = days;
      }
    });

    return stats;
  }

  // ============================================
  // 🔥 Helper: Calculate Streak
  // ============================================
  private static calculateStreak(completedTasks: Task[]): number {
    if (completedTasks.length === 0) return 0;

    const sorted = completedTasks
      .filter(t => t.completedAt)
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));

    if (sorted.length === 0) return 0;

    // الحصول على الأيام الفريدة
    const uniqueDays = new Map<string, boolean>();
    for (const task of sorted) {
      const taskDate = new Date(task.completedAt!);
      const dateString = taskDate.toISOString().split('T')[0];
      uniqueDays.set(dateString, true);
    }

    // ترتيب الأيام من الأحدث للأقدم
    const sortedDays = Array.from(uniqueDays.keys())
      .map(dateStr => new Date(dateStr + 'T00:00:00'))
      .sort((a, b) => b.getTime() - a.getTime());

    // حساب الأيام المتتالية من الأحدث
    let streak = 0;
    let currentDate = sortedDays[0];
    currentDate.setHours(0, 0, 0, 0);

    for (const dayDate of sortedDays) {
      const dayDiff = Math.floor((currentDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 0 || dayDiff === 1) {
        streak++;
        currentDate = new Date(dayDate);
      } else {
        break;
      }
    }

    return streak;
  }
}
