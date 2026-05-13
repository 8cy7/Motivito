// DetailedAnalyticsScreen.tsx
// شاشة الرسومات والتحليلات الرئيسية

import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  Image,
} from 'react-native';
import { AppModal } from '../../components/AppModal';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useChildren } from '../../contexts/ChildrenContext';
import { SmartAnalyzerService, PerformanceOverview, DailyActivityPattern, SmartRecommendation } from '../../services/SmartAnalyzerService';

const { width } = Dimensions.get('window');

interface DetailedAnalyticsScreenProps {
  navigation: any;
  route: any;
}

export const DetailedAnalyticsScreen: React.FC<DetailedAnalyticsScreenProps> = ({ navigation, route }) => {
  const { childId } = route.params;
  const contextData = useChildren() || {};
  const { children = [], tasks: allTasks = [] } = contextData;
  const [resolvedChildId, setResolvedChildId] = useState<string | null>(childId);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [fabScale] = useState(new Animated.Value(1));

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      navigation.navigate('MotivitoAIChat', { childName });
    });
  };

  // تحديث البيانات كلما تركز الشاشة
  useFocusEffect(
    React.useCallback(() => {
      // إعادة تعيين ScrollView إلى الأعلى
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      if (childId) {
        setResolvedChildId(childId);
      } else if (resolvedChildId === null && children.length > 0) {
        setResolvedChildId(children[0].id);
      }

      // ✅ فرض إعادة حساب analytics بإثارة refresh trigger
      setRefreshTrigger(prev => prev + 1);
    }, [childId, children, resolvedChildId])
  );

  const selectedChild = useMemo(() => {
    return children.find(c => c.id === resolvedChildId);
  }, [children, resolvedChildId]);

  // استخراج الاسم من selectedChild مباشرة
  const childName = selectedChild?.name || '';

  const analytics = useMemo(() => {
    if (!selectedChild || !allTasks) return null;

    const overview = SmartAnalyzerService.getPerformanceOverview({ child: selectedChild, tasks: allTasks });
    return {
      overview,
      dailyPattern: SmartAnalyzerService.getDailyActivityPattern({ child: selectedChild, tasks: allTasks }),
      preferences: SmartAnalyzerService.getTaskPreferences({ child: selectedChild, tasks: allTasks }),
      prediction: SmartAnalyzerService.getLevelPrediction({ child: selectedChild, tasks: allTasks }),
      recommendations: SmartAnalyzerService.getSmartRecommendations(
        { child: selectedChild, tasks: allTasks },
        children
      ),
    };
  }, [selectedChild, allTasks, children, refreshTrigger, refreshTrigger]);

  if (!selectedChild || !analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#7241c6', '#5c34a3', '#7241c6']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد بيانات</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#7241c6', '#5c34a3', '#7241c6']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>تفاصيل اكثر</Text>
            <Text style={styles.childNameTitle}>{childName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerDivider} />

        {/* Performance Overview Card */}
        <PerformanceOverviewCard data={analytics.overview} setShowStreakModal={setShowStreakModal} />

        {/* Daily Activity Pattern */}
        <DailyActivityCard pattern={analytics.dailyPattern} childId={resolvedChildId || ''} />

        {/* Task Preferences */}
        <TaskPreferencesCard preferences={analytics.preferences} />

        {/* Level Prediction */}
        <LevelPredictionCard prediction={analytics.prediction} />

        {/* Smart Recommendations */}
        {analytics.recommendations.length > 0 && (
          <SmartRecommendationsCard
            recommendations={analytics.recommendations}
            childGender={selectedChild.gender}
          />
        )}
      </ScrollView>

      {/* Floating Action Button - موتيفيتو */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <View style={styles.fabWithLabel}>
          <Text style={styles.fabLabel}>اسأل موتيفيتو</Text>
          <TouchableOpacity onPress={handleFabPress} activeOpacity={0.7} style={styles.fabTouchable}>
            <LinearGradient
              colors={['#FFFFFF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Image
                source={require('../../assets/motivito-logo.png')}
                style={styles.fabLogo}
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Streak Explanation Modal */}
      <AppModal
        visible={showStreakModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.streakModalContent}>
            <Text style={styles.streakModalTitle}>ماذا يعني الـ Streak؟ 🔥</Text>

            <Text style={styles.streakModalSubtitle}>الأيام المتتالية</Text>
            <Text style={styles.streakModalText}>
              هذا هو عدد الأيام المتتالية اللي كمل فيها {childName} على الأقل مهمة واحدة يومياً بدون انقطاع.
            </Text>

            <Text style={styles.streakModalSubtitle}>🎯 مثال</Text>
            <View style={styles.streakExampleContainer}>
              <View style={styles.streakExampleRow}>
                <Text style={styles.streakExampleTaskStatus}>✓</Text>
                <Text style={styles.streakExampleTask}>مهمة</Text>
                <Text style={styles.streakExampleDay}>السبت</Text>
              </View>
              <View style={styles.streakExampleRow}>
                <Text style={styles.streakExampleTaskStatus}>✓</Text>
                <Text style={styles.streakExampleTask}>مهمتان</Text>
                <Text style={styles.streakExampleDay}>الأحد</Text>
              </View>
              <View style={styles.streakExampleRow}>
                <Text style={styles.streakExampleTaskStatusRed}>✗</Text>
                <Text style={styles.streakExampleTaskRed}>لا توجد مهام</Text>
                <Text style={styles.streakExampleDay}>الاثنين</Text>
              </View>
            </View>

            <View style={styles.streakResetContainer}>
              <Text style={styles.streakResetTitle}>
                الـ Streak يرجع لـ صفر <Text style={styles.streakWarningIcon}>⚠️</Text>
              </Text>
              <Text style={styles.streakResetText}>
                لما تفوت يوم واحد بدون ما تكمل أي مهمة، الـ Streak يرجع للصفر ويبدأ من جديد!
              </Text>
            </View>

            <Text style={styles.streakMotivation}>
              حافظ على Streak عالي! كل يوم إنجاز = يوم إضافي في السلسلة 💪
            </Text>

            <TouchableOpacity
              style={styles.streakModalButton}
              onPress={() => setShowStreakModal(false)}
            >
              <Text style={styles.streakModalButtonText}>فهمت ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AppModal>
    </SafeAreaView>
  );
};

// ============================================
// 📊 Performance Overview Card
// ============================================
const PerformanceOverviewCard: React.FC<{ data: PerformanceOverview; setShowStreakModal: (visible: boolean) => void }> = ({ data, setShowStreakModal }) => {
  // تحديد أي أسبوع أفضل وحساب النسبة
  const isLastWeekBetter = data.weeklyCompletion.lastWeek > data.weeklyCompletion.thisWeek;
  const isThisWeekBetter = data.weeklyCompletion.thisWeek > data.weeklyCompletion.lastWeek;
  const isEqual = data.weeklyCompletion.thisWeek === data.weeklyCompletion.lastWeek;

  let percentage = 0;
  if (!isEqual) {
    if (isLastWeekBetter) {
      // الأسبوع الماضي أفضل - حساب النسبة بناءً على الأسبوع الحالي
      percentage = Math.round(
        ((data.weeklyCompletion.lastWeek - data.weeklyCompletion.thisWeek) / data.weeklyCompletion.thisWeek) * 100
      );
    } else {
      // الأسبوع الحالي أفضل
      if (data.weeklyCompletion.lastWeek === 0) {
        // إذا الأسبوع الماضي = 0 → النسبة = 100%
        percentage = 100;
      } else {
        // حساب النسبة العادية
        percentage = Math.round(
          ((data.weeklyCompletion.thisWeek - data.weeklyCompletion.lastWeek) / data.weeklyCompletion.lastWeek) * 100
        );
      }
    }
  }

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
        <Text style={styles.cardTitle}>ملخص الاداء 📊</Text>

        <View style={styles.statsGrid}>
          {/* This Week Tasks (Left - Top) */}
          <View style={styles.statItem}>
            <View style={styles.valueWithBadgeRow}>
              <Text style={styles.statValue}>{data.weeklyCompletion.thisWeek}</Text>
              {isThisWeekBetter && !isEqual && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerText}>↑ {percentage}%</Text>
                </View>
              )}
            </View>
            <Text style={styles.statLabel}>الأسبوع الحالي</Text>
          </View>

          {/* Last Week Tasks (Right - Top) */}
          <View style={styles.statItem}>
            <View style={styles.valueWithBadgeRow}>
              <Text style={styles.statValue}>{data.weeklyCompletion.lastWeek}</Text>
              {isLastWeekBetter && !isEqual && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerText}>↑ {percentage}%</Text>
                </View>
              )}
            </View>
            <Text style={styles.statLabel}>الأسبوع الماضي</Text>
          </View>

          {/* Completion Rate */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.completionRate}%</Text>
            <Text style={styles.statLabel}>معدل الإكمال</Text>
          </View>

          {/* Streak */}
          <View style={styles.statItem}>
            <View style={styles.streakContainer}>
              <Text style={styles.statValue}>{data.streakDays}</Text>
              {(data.streakDays === 0 || data.streakDays === 1) && (
                <TouchableOpacity
                  style={styles.exclamationButton}
                  onPress={() => setShowStreakModal(true)}
                >
                  <View style={styles.exclamationBadge}>
                    <Text style={styles.exclamationMarkText}>!</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.statLabel}>أيام متتالية</Text>
          </View>
        </View>

      </View>
    </View>
  );
};

// ============================================
// 📈 Daily Activity Card - Scrollable Weekly View
// ============================================
interface DailyActivityCardProps {
  pattern: DailyActivityPattern[];
  childId: string;
}

const DailyActivityCard: React.FC<DailyActivityCardProps> = ({ pattern, childId }) => {
  const [activeWeek, setActiveWeek] = useState<'current' | 'last'>('current');
  const { children = [], tasks: allTasks = [] } = useChildren() || {};

  // الحصول على الطفل المختار من childId
  const selectedChild = useMemo(() => {
    return children.find(c => c.id === childId);
  }, [children, childId]);

  const getWeekStart = (date: Date = new Date()): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // الحصول على المهام المنجزة
  const getCompletedTasks = () => {
    if (!selectedChild || !allTasks) return [];
    return (allTasks || [])
      .filter(t => t.childId === selectedChild.id && t.isCompleted && t.completedAt)
      .sort((a, b) => (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0));
  };

  // حساب حدود الأسابيع بناءً على آخر مهمة منجزة
  const { currentWeekDates, lastWeekDates } = useMemo(() => {
    const completedTasks = getCompletedTasks();
    
    if (completedTasks.length === 0) {
      // لا توجد مهام - استخدم اليوم الحالي
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentWeekStart = getWeekStart(today);
      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      
      const currentWeekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        return date;
      });
      const lastWeekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(lastWeekStart);
        date.setDate(date.getDate() + i);
        return date;
      });
      return { currentWeekDates, lastWeekDates };
    }

    // توجد مهام - استخدم آخر مهمة
    const firstCompletionDate = new Date(completedTasks[0].completedAt!);
    firstCompletionDate.setHours(0, 0, 0, 0);
    const firstWeekStart = getWeekStart(firstCompletionDate);

    const lastCompletionDate = new Date(completedTasks[completedTasks.length - 1].completedAt!);
    lastCompletionDate.setHours(0, 0, 0, 0);
    const lastCompletionWeekStart = getWeekStart(lastCompletionDate);

    const weeksDiff = Math.floor((lastCompletionWeekStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const currentWeekStart = new Date(firstWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + weeksDiff * 7);
    
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const currentWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
    const lastWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(lastWeekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    return { currentWeekDates, lastWeekDates };
  }, [selectedChild, allTasks]);

  // دالة لحساب البيانات من المهام الفعلية
  const getDaysData = useMemo(() => {
    return (dates: Date[]) => {
      const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

      return dates.map(date => {
        const dayIndex = date.getDay();
        const dayName = dayNames[dayIndex];

        // حساب المهام المكتملة في هذا اليوم لهذا الطفل فقط
        const tasksCompleted = selectedChild
          ? (allTasks || [])
              .filter(t =>
                t.childId === selectedChild.id &&
                t.isCompleted &&
                t.completedAt &&
                new Date(t.completedAt).toDateString() === date.toDateString()
              ).length
          : 0;

        return {
          dayOfWeek: dayName,
          dayIndex,
          tasksCompleted,
        };
      });
    };
  }, [selectedChild, allTasks]);

  const lastWeekData = useMemo(() => getDaysData(lastWeekDates), [getDaysData, lastWeekDates]);
  const currentWeekData = useMemo(() => getDaysData(currentWeekDates), [getDaysData, currentWeekDates]);

  // الأسبوع المعروض حالياً
  const displayedWeekData = activeWeek === 'current' ? currentWeekData : lastWeekData;
  const maxTasks = Math.max(...displayedWeekData.map(d => d.tasksCompleted), 1);
  const bestDay = displayedWeekData.reduce((best, current) =>
    current.tasksCompleted > best.tasksCompleted ? current : best
  );

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
        <Text style={styles.cardTitle}>نمط النشاط الاسبوعي 📈</Text>

        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity
            style={[styles.weekButton, activeWeek === 'current' && styles.weekButtonActive]}
            onPress={() => setActiveWeek('current')}
          >
            <Text style={styles.weekButtonText}>← الحالي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.weekButton, activeWeek === 'last' && styles.weekButtonActive]}
            onPress={() => setActiveWeek('last')}
          >
            <Text style={styles.weekButtonText}>الماضي →</Text>
          </TouchableOpacity>
        </View>

        {/* Bar Chart */}
        <View style={styles.barChartContainer}>
          {displayedWeekData.map((day, index) => {
            const percentage = maxTasks === 0 ? 0 : (day.tasksCompleted / maxTasks) * 100;
            const isbestDay = day.tasksCompleted === maxTasks && maxTasks > 0;
            const isEmpty = day.tasksCompleted === 0;

            return (
              <View key={index} style={styles.barChartItem}>
                <View style={styles.barChartBar}>
                  {!isEmpty && (
                    <View
                      style={[
                        styles.barChartFill,
                        {
                          height: `${Math.max(percentage, 10)}%`,
                          backgroundColor: isbestDay ? '#FFD700' : '#4CAF50',
                        },
                      ]}
                    />
                  )}
                </View>
                <Text style={styles.barChartLabel}>{day.dayOfWeek}</Text>
                <Text style={styles.barChartValue}>{day.tasksCompleted}</Text>
              </View>
            );
          })}
        </View>

        {/* Best Day Info */}
        <View style={styles.bestDayContainer}>
          <Text style={styles.bestDayText}>
            💡 أفضل يوم: <Text style={styles.bestDayHighlight}>{bestDay.dayOfWeek}</Text> ({bestDay.tasksCompleted} مهام)
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============================================
// 🎯 Task Preferences Card
// ============================================
const TaskPreferencesCard: React.FC<{ preferences: any }> = ({ preferences }) => {
  const difficulties = [
    { label: 'سهلة', value: preferences.easy.percentage, color: '#4CAF50' },
    { label: 'متوسطة', value: preferences.medium.percentage, color: '#FFC107' },
    { label: 'صعبة', value: preferences.hard.percentage, color: '#FF6B6B' },
  ];

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
        <Text style={styles.cardTitle}> تفضيلات المهام 🎯 </Text>

        {difficulties.map((difficulty, index) => (
          <View key={index} style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { textAlign: 'right' }]}>
              {difficulty.label}: {Math.round(difficulty.value)}%
            </Text>
            <View style={styles.preferenceBar}>
              <View
                style={[
                  styles.preferenceFill,
                  {
                    width: `${difficulty.value}%`,
                    backgroundColor: difficulty.color,
                  }
                ]}
              />
            </View>
          </View>
        ))}

        {preferences.recommendation && (
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationText}>
              {preferences.recommendation}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ============================================
// 🚀 Level Prediction Card
// ============================================
const LevelPredictionCard: React.FC<{ prediction: any }> = ({ prediction }) => {
  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
        <Text style={styles.cardTitle}> توقعات المستوى التالي 🚀</Text>

        <View style={styles.predictionContent}>
          <Text style={styles.predictionLabel}>الوصول للمستوى {prediction.currentLevel + 1}:</Text>

          <View style={styles.xpContainer}>
            <Text style={styles.xpText}>
              {prediction.currentXP} / {prediction.xpNeededForLevel}
            </Text>
            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpFill,
                  {
                    width: `${prediction.percentageToNextLevel}%`,
                    backgroundColor: '#FFD700',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.predictionDetails}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailValue, { flex: 0 }]}>{prediction.xpRemaining}</Text>
              <Text style={[styles.detailLabel, { flex: 1 }]}>النقاط المتبقية:</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailValue, { flex: 0 }]}>{prediction.weeklyVelocity} نقطة</Text>
              <Text style={[styles.detailLabel, { flex: 1 }]}>السرعة الأسبوعية:</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailValue, { flex: 0 }]}>
                {prediction.estimatedWeeksToNextLevel} أسابيع
              </Text>
              <Text style={[styles.detailLabel, { flex: 1 }]}>الوقت المتوقع:</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailValue, { flex: 0 }]}>
                {prediction.estimatedCompletionDate.toLocaleDateString('ar-SA')}
              </Text>
              <Text style={[styles.detailLabel, { flex: 1 }]}>التاريخ المتوقع:</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============================================
// 💡 Smart Recommendations Card
// ============================================
const SmartRecommendationsCard: React.FC<{
  recommendations: SmartRecommendation[];
  childGender?: 'boy' | 'girl';
}> = ({ recommendations, childGender = 'boy' }) => {
  // دالة لتحويل النص حسب النوع الجنسي
  const applyGenderTransformation = (text: string): string => {
    if (childGender !== 'girl') return text;

    // تحويلات للبنات
    const transformations: [RegExp, string][] = [
      [/قريب/g, 'قريبة'],
      [/بعيد/g, 'بعيدة'],
      [/متأخر/g, 'متأخرة'],
      [/متقدم/g, 'متقدمة'],
      [/مجتهد/g, 'مجتهدة'],
      [/كسول/g, 'كسولة'],
      [/نشيط/g, 'نشيطة'],
      [/ذكي/g, 'ذكية'],
      [/موهوب/g, 'موهوبة'],
      [/يفضل/g, 'تفضل'],
      [/يمكنه/g, 'يمكنها'],
      [/يحتاج/g, 'تحتاج'],
      [/لديه/g, 'لديها'],
      [/يكمل/g, 'تكمل'],
      [/يقدم/g, 'تقدم'],
      [/تحسن/g, 'تحسنت'],
      [/حاول تحفيزه/g, 'حاول تحفيزها'],
      [/أرسل له/g, 'أرسل لها'],
      [/حفزه/g, 'حفزها'],
      [/كافئه/g, 'كافئها'],
    ];

    return transformations.reduce((result, [pattern, replacement]) =>
      result.replace(pattern, replacement), text);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
        <Text style={[styles.cardTitle, styles.smartRecommendationsTitle]}>التوصيات الذكية 💡</Text>

        {recommendations.map((rec, index) => (
          <View
            key={rec.id}
            style={[
              styles.recommendationItem,
              rec.priority === 'high' && styles.recommendationItemHigh,
              rec.priority === 'medium' && styles.recommendationItemMedium,
            ]}
          >
            <View style={styles.recommendationHeader}>
              <View style={[
                styles.priorityBadge,
                rec.priority === 'high' && { backgroundColor: '#FF6B6B' },
                rec.priority === 'medium' && { backgroundColor: '#FFC107' },
              ]}>
                <Text style={styles.priorityText}>
                  {rec.priority === 'high' ? '⚠️' : rec.priority === 'medium' ? '📌' : 'ℹ️'}
                </Text>
              </View>
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
            </View>
            <Text style={styles.recommendationDescription}>{applyGenderTransformation(rec.description)}</Text>
            {rec.action && <Text style={styles.recommendationAction}>→ {applyGenderTransformation(rec.action)}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
};

// ============================================
// 🎨 Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7241c6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  childNameTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 0,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Child Selector
  childSelectorContainer: {
    marginBottom: 20,
  },
  childSelectorList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  childSelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    gap: 6,
  },
  childSelectorButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.3)',
    borderColor: '#FFD700',
  },
  childSelectorEmoji: {
    fontSize: 24,
  },
  childSelectorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  childSelectorName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Cards
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'right',
  },
  smartRecommendationsTitle: {
    textAlign: 'right',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  valueWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  winnerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  winnerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Progress Container
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right' ,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
    minWidth: 50,
  },

  // Bar Chart
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 16,
    gap: 4,
  },
  barChartItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barChartBar: {
    flex: 1,
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barChartFill: {
    width: '100%',
  },
  barChartLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  barChartValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
  },

  bestDayContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  bestDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right' ,
  },
  bestDayHighlight: {
    color: '#FFD700',
    fontWeight: '800',
  },

  // Preferences
  preferenceItem: {
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
  },
  preferenceBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  preferenceFill: {
    height: '100%',
    borderRadius: 4,
  },

  recommendationBox: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  recommendationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'right' ,
  },

  // Prediction
  predictionContent: {
    gap: 12,
  },
  predictionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right' ,
  },
  xpContainer: {
    gap: 6,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right' ,
  },
  xpBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
  },

  predictionDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right' ,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'right' ,
  },

  // Recommendations
  recommendationItem: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  recommendationItemHigh: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  recommendationItemMedium: {
    borderColor: '#FFC107',
    backgroundColor: 'rgba(255,193,7,0.1)',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
  },
  recommendationDescription: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
    textAlign: 'right',
  },
  recommendationAction: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'right',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  streakModalContent: {
    backgroundColor: '#2a1a4a',
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  streakModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  streakModalSubtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
    marginTop: 16,
    marginBottom: 8,
  },
  streakModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 12,
  },
  streakExampleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakExampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakExampleDay: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
    textAlign: 'right',
  },
  streakExampleTaskGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
    flex: 1,
    textAlign: 'left',
  },
  streakExampleTaskRed: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B6B',
    flex: 1,
    textAlign: 'left',
  },
  streakResetContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  streakResetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B6B',
    textAlign: 'right',
    marginBottom: 8,
  },
  streakResetText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'right',
    lineHeight: 20,
  },
  streakMotivation: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  streakModalButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  streakModalButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2a1a4a',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  exclamationButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  exclamationBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  exclamationMarkText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 20,
  },

  // Updated Example Styles
  streakExampleTaskStatus: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4CAF50',
    flex: 0.1,
    textAlign: 'left',
  },
  streakExampleTask: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    textAlign: 'center',
  },
  streakExampleTaskStatusRed: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF6B6B',
    flex: 0.1,
    textAlign: 'left',
  },
  streakWarningIcon: {
    marginRight: 4,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    zIndex: 100,
  },
  fabWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  fabTouchable: {
    borderRadius: 31,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  fabLogo: {
    width: 38,
    height: 38,
  },

  weekNavigation: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'center',
  },
  weekButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  weekButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: '#FFD700',
  },
  weekButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

});
