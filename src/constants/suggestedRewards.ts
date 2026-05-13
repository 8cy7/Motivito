// Suggested Rewards for AI Assistant
export interface SuggestedReward {
  name: string;
  stars: number;
  emoji: string;
}

export interface SuggestedRewardsByGender {
  girls: {
    small: SuggestedReward[];
    medium: SuggestedReward[];
    large: SuggestedReward[];
  };
  boys: {
    small: SuggestedReward[];
    medium: SuggestedReward[];
    large: SuggestedReward[];
  };
}

export const SUGGESTED_REWARDS: SuggestedRewardsByGender = {
  girls: {
    small: [
      { name: 'آيس كريم أو مشروب من اختيارها', stars: 30, emoji: '🍦' },
      { name: 'ملصقات أو أدوات تزيين مدرسية', stars: 40, emoji: '✨' },
      { name: 'قطعة شوكولاتة فاخرة', stars: 25, emoji: '🍫' },
      { name: 'اختيار فيلم أو مسلسل للعائلة', stars: 50, emoji: '🎬' },
      { name: 'وجبة خفيفة أو وجبة سريعة صغيرة', stars: 60, emoji: '🍿' },
      { name: 'يوم راحة من ترتيب الغرفة', stars: 80, emoji: '😴' },
      { name: 'لعبة صغيرة (دمية، سلايم، إلخ)', stars: 90, emoji: '🧸' },
      { name: 'دفتر أو قلم أنيق', stars: 70, emoji: '📝' },
      { name: 'وقت إضافي على الأجهزة (30 دقيقة)', stars: 100, emoji: '📱' },
      { name: 'اختيار الزي ليوم كامل بالبيت', stars: 90, emoji: '👗' },
      { name: 'قلادة أو إكسسوار بسيط', stars: 95, emoji: '💎' },
      { name: 'ميدالية أو زينة للمكتب', stars: 60, emoji: '🏅' },
      { name: 'لون أظافر أو عطر صغير', stars: 100, emoji: '💅' },
      { name: 'لعبة ذكاء بسيطة', stars: 80, emoji: '🧩' },
      { name: 'مشوار قصير مع الأب أو الأم', stars: 100, emoji: '🚗' },
    ],
    medium: [
      { name: 'تذكرة كوفي أو حلويات من اختيارها', stars: 150, emoji: '☕' },
      { name: 'كتاب أو مجلة تحبها', stars: 200, emoji: '📚' },
      { name: 'رحلة قصيرة أو طلعة تسوق بسيطة', stars: 300, emoji: '🛍️' },
      { name: 'لعبة تركيب أو فنون', stars: 250, emoji: '🎨' },
      { name: 'اشتراك شهر في تطبيق تعليم / رسم', stars: 400, emoji: '📲' },
      { name: 'عطر صغير أو منتج عناية', stars: 350, emoji: '🌸' },
      { name: 'تيشيرت أو حقيبة صغيرة', stars: 300, emoji: '👕' },
      { name: 'سماعة بلوتوث صغيرة', stars: 450, emoji: '🎧' },
      { name: 'صندوق مفاجآت من الأب', stars: 500, emoji: '🎁' },
      { name: 'وجبة في مطعم مفضل', stars: 400, emoji: '🍕' },
      { name: 'مصروف إضافي رمزي', stars: 250, emoji: '💰' },
      { name: 'يوم اختيار النشاط مع العائلة', stars: 350, emoji: '🎉' },
      { name: 'كاميرا فورية صغيرة (لعبة)', stars: 500, emoji: '📷' },
      { name: 'مجموعة رسم أو أشغال يدوية', stars: 300, emoji: '🖌️' },
      { name: 'أكسسوار شعر فاخر', stars: 200, emoji: '🎀' },
    ],
    large: [
      { name: 'عشاء فاخر في مطعم مميز', stars: 700, emoji: '🍽️' },
      { name: 'ساعة ذكية للبنات', stars: 1200, emoji: '⌚' },
      { name: 'رحلة ترفيهية يوم كامل', stars: 1500, emoji: '🎢' },
      { name: 'حقيبة فاخرة أو حذاء مميز', stars: 900, emoji: '👜' },
      { name: 'تابلت أو آيباد صغير', stars: 1400, emoji: '📱' },
      { name: 'مبلغ مالي (300 ريال مثلًا)', stars: 1000, emoji: '💵' },
      { name: 'يوم كامل اختيار مطلق', stars: 1200, emoji: '👑' },
      { name: 'اشتراك 3 أشهر نتفلكس أو مشابه', stars: 800, emoji: '📺' },
      { name: 'كاميرا صغيرة', stars: 1100, emoji: '📸' },
      { name: 'جلسة سبا أو عناية منزلية', stars: 900, emoji: '💆' },
      { name: 'ملابس جديدة من اختيارها', stars: 1000, emoji: '👚' },
      { name: 'مفاجأة من الأب (مغلفة)', stars: 1300, emoji: '🎊' },
      { name: 'رحلة تسوق محدودة', stars: 1200, emoji: '🏬' },
      { name: 'دورة في هواية تحبها (رسم، طبخ)', stars: 1400, emoji: '🎓' },
      { name: 'جهاز لوحي صغير', stars: 1500, emoji: '💻' },
    ],
  },
  boys: {
    small: [
      { name: 'آيس كريم أو عصير', stars: 30, emoji: '🍦' },
      { name: 'قطعة شوكولاتة أو سناك مفضل', stars: 25, emoji: '🍫' },
      { name: 'اختيار اللعبة اليومية', stars: 50, emoji: '🎮' },
      { name: '30 دقيقة إضافية على الألعاب', stars: 100, emoji: '⏰' },
      { name: 'نزهة قصيرة مع الأب', stars: 90, emoji: '🚶' },
      { name: 'لعبة صغيرة (سيارة، سبينر، إلخ)', stars: 80, emoji: '🏎️' },
      { name: 'إعفاء من مهمة منزلية ليوم', stars: 60, emoji: '😴' },
      { name: 'قبعة أو سوار رياضي', stars: 90, emoji: '🧢' },
      { name: 'قلم أو دفتر مميز', stars: 70, emoji: '✏️' },
      { name: 'كرة صغيرة أو لعبة ضغط', stars: 50, emoji: '⚽' },
      { name: 'لعبة ذكاء صغيرة (puzzle)', stars: 100, emoji: '🧩' },
      { name: 'مشروب أو وجبة من اختياره', stars: 80, emoji: '🍔' },
      { name: 'مشاهدة فيلم يختاره', stars: 90, emoji: '🎬' },
      { name: 'بطاقة تهنئة وتحفيز من الأب', stars: 40, emoji: '💌' },
      { name: 'ملصقات أو هدية بسيطة', stars: 60, emoji: '🎁' },
    ],
    medium: [
      { name: 'تذكرة ملاهي أو لعبة VR', stars: 300, emoji: '🎢' },
      { name: 'كرة قدم أو سلة بجودة عالية', stars: 400, emoji: '⚽' },
      { name: 'وجبة في مطعمه المفضل', stars: 350, emoji: '🍕' },
      { name: 'لعبة إلكترونية صغيرة أو كرت شحن', stars: 500, emoji: '🎮' },
      { name: 'سماعة بلوتوث بسيطة', stars: 450, emoji: '🎧' },
      { name: 'تيشيرت أو قبعة فريقه المفضل', stars: 300, emoji: '👕' },
      { name: 'مصروف إضافي بسيط', stars: 250, emoji: '💰' },
      { name: 'اشتراك شهر في تطبيق ألعاب', stars: 400, emoji: '📱' },
      { name: 'رحلة مع الأب (كوفي / مشوار خاص)', stars: 350, emoji: '☕' },
      { name: 'ماوس أو كيبورد ألعاب بسيط', stars: 500, emoji: '⌨️' },
      { name: 'صندوق مفاجآت من الأب', stars: 450, emoji: '🎁' },
      { name: 'يوم اختيار النشاط', stars: 300, emoji: '🎉' },
      { name: 'لعبة LEGO صغيرة', stars: 400, emoji: '🧱' },
      { name: 'حقيبة ظهر صغيرة', stars: 350, emoji: '🎒' },
      { name: 'قسيمة شراء بسيطة', stars: 500, emoji: '🎫' },
    ],
    large: [
      { name: 'جهاز ألعاب (PS5 أو Switch)', stars: 1500, emoji: '🎮' },
      { name: 'ساعة ذكية أو سوار رياضي', stars: 1200, emoji: '⌚' },
      { name: 'رحلة ترفيهية أو مغامرة VR', stars: 1300, emoji: '🕶️' },
      { name: 'تابلت صغير', stars: 1400, emoji: '📱' },
      { name: 'مبلغ مالي (300 ريال)', stars: 1000, emoji: '💵' },
      { name: 'اشتراك 3 أشهر في منصة يحبها', stars: 800, emoji: '📺' },
      { name: 'حذاء رياضي مميز', stars: 900, emoji: '👟' },
      { name: 'عشاء فاخر من اختياره', stars: 700, emoji: '🍽️' },
      { name: 'كاميرا أكشن أو صغيرة', stars: 1100, emoji: '📸' },
      { name: 'رحلة مع الأب ليوم كامل', stars: 1200, emoji: '🚗' },
      { name: 'ملابس جديدة من اختياره', stars: 1000, emoji: '👔' },
      { name: 'مفاجأة كبرى من الأب', stars: 1300, emoji: '🎊' },
      { name: 'دورة في هواية (برمجة / كرة / رسم)', stars: 1400, emoji: '🎓' },
      { name: 'اشتراك 3 أشهر Xbox / PS Plus', stars: 1000, emoji: '🎮' },
      { name: 'رحلة داخلية (بولينغ / تسلق / مغامرة)', stars: 1500, emoji: '🎳' },
    ],
  },
};
