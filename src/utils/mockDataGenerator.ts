// mockDataGenerator.ts
// أداة توليد بيانات وهمية لاختبار الخوارزمية

import { Task } from '../types';

export interface MockTaskParams {
  childId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  dayOfWeek?: number; // 0-6 (الأحد - السبت)
}

export class MockDataGenerator {
  /**
   * توليد مهام وهمية مكتملة
   * @param childId معرف الطفل
   * @param difficulty صعوبة المهام
   * @param count عدد المهام
   * @param dayOfWeek اليوم (0=الأحد، 1=الاثنين، إلخ)
   * @returns قائمة المهام الموهومة
   */
  static generateMockTasks(params: MockTaskParams): Task[] {
    const { childId, difficulty, count, dayOfWeek } = params;
    const tasks: Task[] = [];

    const taskTitles = {
      easy: [
        'ترتيب الغرفة',
        'غسل الأطباق',
        'تنظيف المكتب',
        'ترتيب الألعاب',
        'تنظيف الأرضية',
      ],
      medium: [
        'حل الواجب المدرسي',
        'قراءة القصة',
        'حفظ جزء من القرآن',
        'مساعدة الأم',
        'التمرين الرياضي',
      ],
      hard: [
        'مشروع علمي',
        'بحث تاريخي',
        'برنامج حاسوب',
        'تطبيق رياضي معقد',
        'مسابقة عامة',
      ],
    };

    const pointsMap = {
      easy: 50,
      medium: 100,
      hard: 150,
    };

    const titles = taskTitles[difficulty];
    const points = pointsMap[difficulty];

    for (let i = 0; i < count; i++) {
      const task: Task = {
        id: `mock-${childId}-${difficulty}-${Date.now()}-${i}`,
        childId,
        title: `${titles[i % titles.length]} ${i + 1}`,
        description: `مهمة وهمية لاختبار الخوارزمية`,
        difficulty,
        points,
        isCompleted: true,
        category: 'daily',
        frequency: 'once',
        createdAt: this.getRandomDateThisWeek(),
        completedAt: this.getRandomDateForDay(dayOfWeek),
      };

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * توليد مهام لأسبوع كامل
   */
  static generateWeekOfTasks(childId: string): Task[] {
    const allTasks: Task[] = [];
    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // الأحد - السبت

    // لكل يوم
    for (const day of daysOfWeek) {
      // 2 مهمة سهلة
      allTasks.push(
        ...this.generateMockTasks({
          childId,
          difficulty: 'easy',
          count: 2,
          dayOfWeek: day,
        })
      );

      // 1 مهمة متوسطة
      allTasks.push(
        ...this.generateMockTasks({
          childId,
          difficulty: 'medium',
          count: 1,
          dayOfWeek: day,
        })
      );

      // 0-1 مهمة صعبة (عشوائي)
      if (Math.random() > 0.5) {
        allTasks.push(
          ...this.generateMockTasks({
            childId,
            difficulty: 'hard',
            count: 1,
            dayOfWeek: day,
          })
        );
      }
    }

    return allTasks;
  }

  /**
   * توليد مهام شهر كامل
   */
  static generateMonthOfTasks(childId: string): Task[] {
    const allTasks: Task[] = [];

    // 4 أسابيع
    for (let week = 0; week < 4; week++) {
      const weekTasks = this.generateWeekOfTasks(childId);

      // تعديل التواريخ لتكون في الأسبوع المناسب
      weekTasks.forEach(task => {
        const date = new Date();
        date.setDate(date.getDate() - (4 - week) * 7);
        task.completedAt = date;
      });

      allTasks.push(...weekTasks);
    }

    return allTasks;
  }

  /**
   * توليد مهام مخصصة
   */
  static generateCustomTasks(
    childId: string,
    counts: {
      easyCounts: number;
      mediumCounts: number;
      hardCounts: number;
    },
    dayOfWeek?: number
  ): Task[] {
    const tasks: Task[] = [];

    if (counts.easyCounts > 0) {
      tasks.push(
        ...this.generateMockTasks({
          childId,
          difficulty: 'easy',
          count: counts.easyCounts,
          dayOfWeek,
        })
      );
    }

    if (counts.mediumCounts > 0) {
      tasks.push(
        ...this.generateMockTasks({
          childId,
          difficulty: 'medium',
          count: counts.mediumCounts,
          dayOfWeek,
        })
      );
    }

    if (counts.hardCounts > 0) {
      tasks.push(
        ...this.generateMockTasks({
          childId,
          difficulty: 'hard',
          count: counts.hardCounts,
          dayOfWeek,
        })
      );
    }

    return tasks;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * الحصول على تاريخ عشوائي هذا الأسبوع
   */
  private static getRandomDateThisWeek(): Date {
    const date = new Date();
    const daysToAdd = Math.floor(Math.random() * 7);
    date.setDate(date.getDate() - daysToAdd);
    date.setHours(Math.floor(Math.random() * 24), 0, 0, 0);
    return date;
  }

  /**
   * الحصول على تاريخ في يوم معين من الأسبوع الحالي
   */
  private static getRandomDateForDay(dayOfWeek?: number): Date {
    const date = new Date();

    if (dayOfWeek !== undefined) {
      const currentDay = date.getDay();
      const daysToAdd = currentDay - dayOfWeek;
      date.setDate(date.getDate() - daysToAdd);
    } else {
      const daysToAdd = Math.floor(Math.random() * 7);
      date.setDate(date.getDate() - daysToAdd);
    }

    // وقت عشوائي في اليوم
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
    return date;
  }

  /**
   * أيام الأسبوع باللغة العربية
   */
  static getDayNameArabic(dayOfWeek: number): string {
    const names = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return names[dayOfWeek] || 'غير معروف';
  }
}
