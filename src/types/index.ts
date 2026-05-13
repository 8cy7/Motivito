// types.ts

// نوع جنس الطفل
export type Gender = 'boy' | 'girl';

// نوع الشارة
export interface Badge {
  id: string;
  level: number;          // اللفل اللي حصل فيه الطفل على الشارة
  emoji: string;          // إيموجي الشارة
  color: string;          // لون الشارة
  earnedDate: Date;       // تاريخ الحصول على الشارة
}

// تعريف الطفل
export interface Child {
  id: string;
  name: string;
  avatar: string;          // إيموجي أو رابط صورة
  isAvatarImage?: boolean; // true لو avatar = رابط صورة
  level: number;           // المستوى الحالي
  xp: number;              // نقاط الخبرة للمستوى الحالي (ترجع صفر بعد كل لفل)
  stars: number;           // النجوم الكلية (ثابتة، تنقص فقط بالجوائز)
  totalStars: number;      // مجموع النجوم الكلية المكتسبة (للإحصائيات)
  isPinned?: boolean;
  color: string;
  gender: Gender;
  badges?: Badge[];        // قائمة الشارات
  unlockedEmojis?: string[]; // الإيموجيات المفتوحة من البتل باس

  // DEPRECATED: سيتم حذفها لاحقاً
  points?: number;
  totalPoints?: number;
}

// الإنجازات (لو تحتاجها لاحقاً)
export interface Achievement {
  id: string;
  type: 'star' | 'crown' | 'medal' | 'trophy';
  title: string;
  earnedDate: Date;
  color: string;
}

export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskFrequency = 'once' | 'daily' | 'weekly';

export interface Task {
  id: string;
  childId: string;
  title: string;
  description?: string;
  difficulty: TaskDifficulty;
  points: number;
  isCompleted: boolean;
  approvalStatus?: 'completed' | 'approved' | 'rejected'; // null = not yet submitted
  dueDate?: Date;
  category: 'daily' | 'weekly' | 'special';
  frequency: TaskFrequency;
  repeatType?: 'daily' | 'weekly' | 'once'; // نوع التكرار للهاشتاق
  renewsDaily?: boolean; // قديمة، تقدر تلغيها لاحقاً
  createdAt: Date;
  completedAt?: Date; // تاريخ إكمال المهمة (مهم للإحصائيات)
  timeSpent?: number; // الوقت المستغرق بالدقائق (اختياري)
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  image?: string;
  category: string;
}
