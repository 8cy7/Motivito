import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MotivitoLogo } from '../MotivitoLogo';
import { Gender } from '../../types';
import { isTablet } from '../../utils/deviceUtils';

// رسائل تحفيزية للأولاد
const BOY_MESSAGES = [
  'أنت بطل حقيقي! استمر في التقدم 🦸‍♂️',
  'قوتك في عزيمتك! لا تتوقف ⚡',
  'كل مهمة تقربك من النجاح 🚀',
  'أنت تستطيع تحقيق المستحيل ⭐',
  'استمر.. النجاح قريب جداً 🎯',
  'عقلك سلاحك الأقوى 🧠',
  'كن فخوراً بإنجازاتك 🏆',
  'التحدي يصنع الأبطال ⚔️',
  'أنت أقوى مما تتخيل 🦁',
  'كل يوم فرصة جديدة 🌟',
];

// رسائل تحفيزية للبنات
const GIRL_MESSAGES = [
  'أنتِ أميرة مميزة! استمري 👸',
  'جمال روحكِ في عطائكِ 🌸',
  'كل خطوة تزيدكِ تألقاً 🌟',
  'أنتِ قادرة على كل شيء 💫',
  'استمري.. النجاح ينتظركِ 🦋',
  'ذكاؤكِ يميزكِ عن الجميع 🌼',
  'كوني فخورة بنفسكِ 💎',
  'التحديات تصنع الملكات 👑',
  'أنتِ أقوى من الصعاب 🌷',
  'كل يوم يزيدكِ جمالاً 🌈',
];

interface MotivationalMessageProps {
  gender: Gender;
}

export const MotivationalMessage: React.FC<MotivationalMessageProps> = ({ gender }) => {
  const messages = gender === 'boy' ? BOY_MESSAGES : GIRL_MESSAGES;
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  const isTabletDevice = isTablet();

  return (
    <View style={[styles.motivationalSection, isTabletDevice && styles.tabletMotivationalSection]}>
      <View style={[styles.motivationalCard, isTabletDevice && styles.tabletMotivationalCard]}>
        <View style={styles.logoContainerCardCenter}>
          <MotivitoLogo size={isTabletDevice ? 50 : 60} />
        </View>
        <Text style={[styles.motivationalText, isTabletDevice && styles.tabletMotivationalText]}>{randomMessage}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  motivationalSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tabletMotivationalSection: {
    marginBottom: 0,
    paddingHorizontal: 0,
    width: '100%',
  },
  motivationalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabletMotivationalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    minHeight: 80,
  },
  logoContainerCardCenter: {
    marginRight: 12,
    opacity: 0.9,
  },
  motivationalText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    textAlign: 'right',
  },
  tabletMotivationalText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
  },
});
