export interface ChallengeRequirement {
  text: string;
  completed: boolean;
  progressType?: 'easy' | 'medium' | 'hard' | 'stars';
  progressTarget?: number;
}

export interface Challenge {
  id: number;
  name: string;
  nameFemale?: string; // الصيغة المؤنثة من الاسم
  emoji: string;
  number: string;
  description: string;
  descriptionFemale?: string; // الوصف للإناث
  requirements: ChallengeRequirement[];
  requirementsFemale?: ChallengeRequirement[]; // المتطلبات للإناث
  reward: string;
  xpReward: number;
  totalProgress: number;
}

export const challengesData: Challenge[] = [
  {
    id: 0,
    name: 'المحارب',
    nameFemale: 'المحاربة',
    emoji: '⚔️',
    number: 'التحدي الأول',
    description: 'أثبت أنك محارب حقيقي',
    descriptionFemale: 'أثبتي أنك محاربة حقيقية',
    requirements: [
      { text: 'أكمل ثلاث مهمات سهلة', completed: false, progressType: 'easy', progressTarget: 3 },
    ],
    requirementsFemale: [
      { text: 'أكملي ثلاث مهمات سهلة', completed: false, progressType: 'easy', progressTarget: 3 },
    ],
    reward: '🏅 500 نقطة XP',
    xpReward: 500,
    totalProgress: 0,
  },
  {
    id: 1,
    name: 'المدخر',
    nameFemale: 'المدخرة',
    emoji: '💰',
    number: 'التحدي الثاني',
    description: 'كن حكيماً في إدارة نقاطك',
    descriptionFemale: 'كوني حكيمة في إدارة نقاطك',
    requirements: [
      { text: 'اجمع 50 نجمة', completed: false, progressType: 'stars', progressTarget: 50 },
    ],
    requirementsFemale: [
      { text: 'اجمعي 50 نجمة', completed: false, progressType: 'stars', progressTarget: 50 },
    ],
    reward: '🏅 700 نقطة XP',
    xpReward: 700,
    totalProgress: 0,
  },
  {
    id: 2,
    name: 'القارئ',
    nameFemale: 'القارئة',
    emoji: '📚',
    number: 'التحدي الثالث',
    description: 'ارتق مستوى صعوبة التحديات',
    descriptionFemale: 'ارتقي مستوى صعوبة التحديات',
    requirements: [
      { text: 'أكمل مهمتين متوسطة', completed: false, progressType: 'medium', progressTarget: 2 },
    ],
    requirementsFemale: [
      { text: 'أكملي مهمتين متوسطة', completed: false, progressType: 'medium', progressTarget: 2 },
    ],
    reward: '🏅 900 نقطة XP',
    xpReward: 900,
    totalProgress: 0,
  },
  {
    id: 3,
    name: 'المتفوق',
    nameFemale: 'المتفوقة',
    emoji: '🏆',
    number: 'التحدي الرابع',
    description: 'تحدى نفسك بمهام صعبة',
    descriptionFemale: 'تحدي نفسك بمهام صعبة',
    requirements: [
      { text: 'أكمل مهمة صعبة',   completed: false, progressType: 'hard', progressTarget: 1 },
      { text: 'أكمل مهمتين سهلة', completed: false, progressType: 'easy', progressTarget: 2 },
    ],
    requirementsFemale: [
      { text: 'أكملي مهمة صعبة',   completed: false, progressType: 'hard', progressTarget: 1 },
      { text: 'أكملي مهمتين سهلة', completed: false, progressType: 'easy', progressTarget: 2 },
    ],
    reward: '🏅 1100 نقطة XP',
    xpReward: 1100,
    totalProgress: 0,
  },
  {
    id: 4,
    name: 'المستكشف',
    nameFemale: 'المستكشفة',
    emoji: '🔍',
    number: 'التحدي الخامس',
    description: 'استكشف قدراتك الحقيقية',
    descriptionFemale: 'استكشفي قدراتك الحقيقية',
    requirements: [
      { text: 'أكمل ثلاث مهمات سهلة', completed: false, progressType: 'easy',  progressTarget: 3   },
      { text: 'اجمع 100 نقطة',          completed: false, progressType: 'stars', progressTarget: 100 },
    ],
    requirementsFemale: [
      { text: 'أكملي ثلاث مهمات سهلة', completed: false, progressType: 'easy',  progressTarget: 3   },
      { text: 'اجمعي 100 نقطة',         completed: false, progressType: 'stars', progressTarget: 100 },
    ],
    reward: '🏅 1300 نقطة XP',
    xpReward: 1300,
    totalProgress: 0,
  },
  {
    id: 5,
    name: 'صاحب الهمة',
    nameFemale: 'صاحبة الهمة',
    emoji: '💪',
    number: 'التحدي السادس',
    description: 'ارفع سقف طموحك أعلى',
    descriptionFemale: 'ارفعي سقف طموحك أعلى',
    requirements: [
      { text: 'أكمل مهمتين متوسطة', completed: false, progressType: 'medium', progressTarget: 2 },
      { text: 'أكمل مهمة صعبة',     completed: false, progressType: 'hard',   progressTarget: 1 },
    ],
    requirementsFemale: [
      { text: 'أكملي مهمتين متوسطة', completed: false, progressType: 'medium', progressTarget: 2 },
      { text: 'أكملي مهمة صعبة',     completed: false, progressType: 'hard',   progressTarget: 1 },
    ],
    reward: '🏅 1500 نقطة XP',
    xpReward: 1500,
    totalProgress: 0,
  },
  {
    id: 6,
    name: 'الفارس الشجاع',
    nameFemale: 'الفارسة الشجاعة',
    emoji: '🐴',
    number: 'التحدي السابع',
    description: 'كن شجاعاً في مواجهة التحديات',
    descriptionFemale: 'كوني شجاعة في مواجهة التحديات',
    requirements: [
      { text: 'أكمل مهمتين صعبة',   completed: false, progressType: 'hard',   progressTarget: 2 },
      { text: 'أكمل مهمتين متوسطة', completed: false, progressType: 'medium', progressTarget: 2 },
      { text: 'أكمل مهمة سهلة',     completed: false, progressType: 'easy',   progressTarget: 1 },
    ],
    requirementsFemale: [
      { text: 'أكملي مهمتين صعبة',   completed: false, progressType: 'hard',   progressTarget: 2 },
      { text: 'أكملي مهمتين متوسطة', completed: false, progressType: 'medium', progressTarget: 2 },
      { text: 'أكملي مهمة سهلة',     completed: false, progressType: 'easy',   progressTarget: 1 },
    ],
    reward: '🏅 1700 نقطة XP',
    xpReward: 1700,
    totalProgress: 0,
  },
  {
    id: 7,
    name: 'المتميز',
    nameFemale: 'المتميزة',
    emoji: '⭐',
    number: 'التحدي الثامن',
    description: 'تميز عن الآخرين بإنجازاتك',
    descriptionFemale: 'تميزي عن الآخرين بإنجازاتك',
    requirements: [
      { text: 'أكمل ثلاث مهام صعبة', completed: false, progressType: 'hard',  progressTarget: 3   },
      { text: 'اجمع 200 نقطة',        completed: false, progressType: 'stars', progressTarget: 200 },
    ],
    requirementsFemale: [
      { text: 'أكملي ثلاث مهام صعبة', completed: false, progressType: 'hard',  progressTarget: 3   },
      { text: 'اجمعي 200 نقطة',        completed: false, progressType: 'stars', progressTarget: 200 },
    ],
    reward: '🏅 1900 نقطة XP',
    xpReward: 1900,
    totalProgress: 0,
  },
  {
    id: 8,
    name: 'الأسطورة',
    nameFemale: 'الأسطورة',
    emoji: '👑',
    number: 'التحدي التاسع',
    description: 'كن أسطورة حقيقية',
    descriptionFemale: 'كوني أسطورة حقيقية',
    requirements: [
      { text: 'أكمل ثلاث مهام صعبة', completed: false, progressType: 'hard',   progressTarget: 3   },
      { text: 'أكمل مهمة متوسطة',    completed: false, progressType: 'medium', progressTarget: 1   },
      { text: 'اجمع 200 نقطة',        completed: false, progressType: 'stars',  progressTarget: 200 },
    ],
    requirementsFemale: [
      { text: 'أكملي ثلاث مهام صعبة', completed: false, progressType: 'hard',   progressTarget: 3   },
      { text: 'أكملي مهمة متوسطة',    completed: false, progressType: 'medium', progressTarget: 1   },
      { text: 'اجمعي 200 نقطة',        completed: false, progressType: 'stars',  progressTarget: 200 },
    ],
    reward: '🏅 2100 نقطة XP',
    xpReward: 2100,
    totalProgress: 0,
  },
  {
    id: 9,
    name: 'الإمبراطور',
    nameFemale: 'الإمبراطورة',
    emoji: '👨‍🦰',
    number: 'التحدي العاشر',
    description: 'حكم عالمك بقوة وذكاء',
    descriptionFemale: 'حكمي عالمك بقوة وذكاء',
    requirements: [
      { text: 'أكمل ثلاث مهام صعبة',               completed: false, progressType: 'hard',   progressTarget: 3   },
      { text: 'أكمل ثلاث مهام متوسطة',              completed: false, progressType: 'medium', progressTarget: 3   },
      { text: 'اجمع 500 نقطة واحفظها لأسبوع كامل', completed: false, progressType: 'stars',  progressTarget: 500 },
    ],
    requirementsFemale: [
      { text: 'أكملي ثلاث مهام صعبة',               completed: false, progressType: 'hard',   progressTarget: 3   },
      { text: 'أكملي ثلاث مهام متوسطة',              completed: false, progressType: 'medium', progressTarget: 3   },
      { text: 'اجمعي 500 نقطة واحفظيها لأسبوع كامل', completed: false, progressType: 'stars',  progressTarget: 500 },
    ],
    reward: '🏅 2300 نقطة XP',
    xpReward: 2300,
    totalProgress: 0,
  },
];
