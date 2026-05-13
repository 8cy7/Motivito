import { Child, Task, Reward } from '../types';

// Mock Children Data
export const MOCK_CHILDREN: Record<string, Child> = {
  '1111': {
    id: 'ahmad-001',
    name: 'أحمد',
    avatar: '👦',
    level: 15,
    xp: 120,
    stars: 450,
    totalStars: 1200,
    color: '#4facfe',
    gender: 'boy',
    badges: [
      {
        id: 'badge-1',
        level: 5,
        emoji: '⭐',
        color: '#FFD700',
        earnedDate: new Date('2024-01-10'),
      },
      {
        id: 'badge-2',
        level: 10,
        emoji: '🔥',
        color: '#FF4500',
        earnedDate: new Date('2024-01-15'),
      },
    ],
  },
  '2222': {
    id: 'fatima-001',
    name: 'فاطمة',
    avatar: '👧',
    level: 12,
    xp: 80,
    stars: 320,
    totalStars: 850,
    color: '#f093fb',
    gender: 'girl',
    badges: [
      {
        id: 'badge-3',
        level: 5,
        emoji: '🌷',
        color: '#FF69B4',
        earnedDate: new Date('2024-01-12'),
      },
    ],
  },
};

// Mock Tasks for Ahmad (Boy)
export const AHMAD_TASKS: Task[] = [
  {
    id: 'task-ahmad-1',
    childId: 'ahmad-001',
    title: 'ترتيب الغرفة',
    description: 'ترتيب السرير وتنظيف الغرفة',
    difficulty: 'easy',
    points: 10,
    isCompleted: false,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
  {
    id: 'task-ahmad-2',
    childId: 'ahmad-001',
    title: 'حل الواجبات المدرسية',
    description: 'إنهاء جميع الواجبات المطلوبة',
    difficulty: 'medium',
    points: 20,
    isCompleted: false,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
  {
    id: 'task-ahmad-3',
    childId: 'ahmad-001',
    title: 'مساعدة الوالدين',
    description: 'مساعدة في الأعمال المنزلية',
    difficulty: 'easy',
    points: 15,
    isCompleted: true,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
  {
    id: 'task-ahmad-4',
    childId: 'ahmad-001',
    title: 'قراءة كتاب',
    description: 'قراءة 20 صفحة من الكتاب',
    difficulty: 'medium',
    points: 25,
    isCompleted: false,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
  {
    id: 'task-ahmad-5',
    childId: 'ahmad-001',
    title: 'ممارسة الرياضة',
    description: 'تمارين رياضية لمدة 30 دقيقة',
    difficulty: 'hard',
    points: 30,
    isCompleted: false,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
];

// Mock Tasks for Fatima (Girl)
export const FATIMA_TASKS: Task[] = [
  {
    id: 'task-fatima-1',
    childId: 'fatima-001',
    title: 'ترتيب الغرفة',
    description: 'ترتيب السرير وتنظيف الغرفة',
    difficulty: 'easy',
    points: 10,
    isCompleted: false,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
  {
    id: 'task-fatima-2',
    childId: 'fatima-001',
    title: 'حل الواجبات المدرسية',
    description: 'إنهاء جميع الواجبات المطلوبة',
    difficulty: 'medium',
    points: 20,
    isCompleted: true,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
  {
    id: 'task-fatima-3',
    childId: 'fatima-001',
    title: 'حفظ القرآن',
    description: 'حفظ صفحة من القرآن الكريم',
    difficulty: 'hard',
    points: 35,
    isCompleted: false,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
  {
    id: 'task-fatima-4',
    childId: 'fatima-001',
    title: 'مساعدة الأم',
    description: 'مساعدة في إعداد الطعام',
    difficulty: 'medium',
    points: 20,
    isCompleted: false,
    category: 'daily',
    frequency: 'daily',
    createdAt: new Date(),
  },
];

// Mock Rewards for Ahmad
export const AHMAD_REWARDS: Reward[] = [
  {
    id: 'reward-ahmad-1',
    title: 'ساعة لعب إضافية',
    description: 'ساعة إضافية للعب في الألعاب الإلكترونية',
    pointsCost: 50,
    category: 'gaming',
  },
  {
    id: 'reward-ahmad-2',
    title: 'رحلة إلى الملاهي',
    description: 'رحلة ممتعة إلى مدينة الملاهي',
    pointsCost: 200,
    category: 'outing',
  },
  {
    id: 'reward-ahmad-3',
    title: 'لعبة جديدة',
    description: 'شراء لعبة من اختيارك',
    pointsCost: 500,
    category: 'toy',
  },
  {
    id: 'reward-ahmad-4',
    title: 'هاتف جديد',
    description: 'هاتف محمول جديد',
    pointsCost: 1000,
    category: 'electronics',
  },
];

// Mock Rewards for Fatima
export const FATIMA_REWARDS: Reward[] = [
  {
    id: 'reward-fatima-1',
    title: 'كتاب قصص',
    description: 'كتاب قصص جميل من اختيارك',
    pointsCost: 40,
    category: 'books',
  },
  {
    id: 'reward-fatima-2',
    title: 'رحلة إلى المكتبة',
    description: 'رحلة ممتعة إلى المكتبة الكبيرة',
    pointsCost: 150,
    category: 'outing',
  },
  {
    id: 'reward-fatima-3',
    title: 'دراجة هوائية',
    description: 'دراجة هوائية جميلة',
    pointsCost: 600,
    category: 'sports',
  },
  {
    id: 'reward-fatima-4',
    title: 'تابلت جديد',
    description: 'تابلت للقراءة والدراسة',
    pointsCost: 900,
    category: 'electronics',
  },
];

// Helper function to get child data by PIN
export const getChildByPin = (pin: string): Child | null => {
  return MOCK_CHILDREN[pin] || null;
};

// Helper function to get tasks by child ID
export const getTasksByChildId = (childId: string): Task[] => {
  if (childId === 'ahmad-001') return AHMAD_TASKS;
  if (childId === 'fatima-001') return FATIMA_TASKS;
  return [];
};

// Helper function to get rewards by child ID
export const getRewardsByChildId = (childId: string): Reward[] => {
  if (childId === 'ahmad-001') return AHMAD_REWARDS;
  if (childId === 'fatima-001') return FATIMA_REWARDS;
  return [];
};
