// SiblingsComparisonScreen.tsx
// شاشة مقارنة الأخوة

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useChildren } from '../../contexts/ChildrenContext';
import { SmartAnalyzerService } from '../../services/SmartAnalyzerService';

const { width } = Dimensions.get('window');

interface SiblingsComparisonScreenProps {
  navigation: any;
}

export const SiblingsComparisonScreen: React.FC<SiblingsComparisonScreenProps> = ({ navigation }) => {
  const { children = [], tasks: allTasks = [] } = useChildren() || {};
  const [fabScale] = useState(new Animated.Value(1));
  const scrollOffsetY = useRef(new Animated.Value(0)).current;

  const rankings = useMemo(() => {
    return SmartAnalyzerService.getRankings(children || [], allTasks || []);
  }, [children, allTasks]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetY.setValue(event.nativeEvent.contentOffset.y);
  };

  const handleFabPress = () => {
    // Animation: scale down then up
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('MotivitoAIChat', { childName: 'أطفالك' });
    });
  };

  useEffect(() => {
    if (children.length <= 1 && children.length > 0) {
      navigation.replace('DetailedAnalytics', { childId: children[0].id });
    } else if (children.length === 0) {
      navigation.goBack();
    }
  }, [children, navigation]);

  if (children.length <= 1) {
    return null;
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>مقارنة الأطفال</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerDivider} />

        {/* Rankings */}
        <FlatList
          scrollEnabled={false}
          data={rankings}
          keyExtractor={item => item.childId}
          renderItem={({ item: stat, index }) => (
            <RankingCard
              stat={stat}
              index={index}
              totalChildren={rankings.length}
              onPress={() => navigation.navigate('DetailedAnalytics', { childId: stat.childId })}
            />
          )}
        />

        {/* Summary Stats */}
        <SummaryCard rankings={rankings} />

        {/* Insights */}
        <InsightsCard rankings={rankings} />
      </ScrollView>

      {/* Floating Action Button - موتيفيتو */}
      <Animated.View
        style={[
          styles.floatingActionButtonContainer,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <View style={styles.fabWithLabel}>
          <Text style={styles.fabLabel}>اسأل موتيفيتو</Text>
          <TouchableOpacity
            onPress={handleFabPress}
            activeOpacity={0.7}
            style={styles.fabTouchable}
          >
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
    </SafeAreaView>
  );
};

// ============================================
// Ranking Card Component
// ============================================
const RankingCard: React.FC<{
  stat: any;
  index: number;
  totalChildren: number;
  onPress?: () => void;
}> = ({ stat, index, totalChildren, onPress }) => {
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return { emoji: '🥇', color: '#FFD700' };
      case 2:
        return { emoji: '🥈', color: '#A0A0A0' };
      case 3:
        return { emoji: '🥉', color: '#CD7F32' };
      default:
        return { emoji: rank.toString(), color: '#FFFFFF' };
    }
  };

  const rankDisplay = getRankDisplay(stat.rank);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.rankingCardContainer}
    >
      <View
        style={[
          styles.rankingCard,
          index === 0 && styles.rankingCardFirst,
          {
            backgroundColor: index === 0 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.1)',
          },
        ]}
      >
        {/* Rank Badge - Shows emoji or number */}
        <View style={styles.rankBadgeContainer}>
          <Text style={[styles.rankNumber, { color: rankDisplay.color }]}>
            {rankDisplay.emoji}
          </Text>
        </View>

        {/* Child Info */}
        <View style={styles.childInfoContainer}>
          <View style={styles.childNameRow}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: stat.isAvatarImage ? 'rgba(255,255,255,0.2)' : 'transparent',
                overflow: 'hidden',
                marginRight: 10,
              }}
            >
              {stat.childPhoto && stat.isAvatarImage ? (
                <Image
                  source={{ uri: stat.childPhoto }}
                  style={styles.childAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.childAvatar}>{stat.childAvatar || stat.childName.substring(0, 1)}</Text>
              )}
            </View>
            <View style={styles.childNameCol}>
              <Text style={styles.childNameLarge}>{stat.childName}</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>المستوى</Text>
              <Text style={styles.statBoxValue}>{stat.level}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>النجوم</Text>
              <Text style={styles.statBoxValue}>{stat.totalStars}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>المهام</Text>
              <Text style={styles.statBoxValue}>{stat.tasksCompleted}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>الإكمال</Text>
              <Text style={styles.statBoxValue}>{stat.completionRate}%</Text>
            </View>
          </View>

          {/* XP Progress Bar - Progress to Next Level */}
          <View style={styles.starsProgressContainer}>
            <View style={styles.starsProgressLabel}>
              <Text style={styles.starsProgressText}>حتى المستوى القادم</Text>
            </View>
            <View style={styles.starsBar}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.starsBarFill, { width: `${Math.min((stat.currentXP / stat.xpNeededForLevel) * 100, 100)}%` }]}
              />
            </View>
            <Text style={styles.starsValue}>{stat.currentXP || 0}/{stat.xpNeededForLevel || 1000}</Text>
          </View>

        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// Summary Card Component
// ============================================
const SummaryCard: React.FC<{ rankings: any[] }> = ({ rankings }) => {
  const firstPlace = rankings[0];
  const lastPlace = rankings[rankings.length - 1];

  // الفارق في المستويات
  const levelGap = firstPlace.level - lastPlace.level;

  // معدل الإكمال العام
  const avgCompletionRate = Math.round(
    rankings.reduce((sum, r) => sum + r.completionRate, 0) / rankings.length
  );

  // أكثر نشاط (أعلى معدل إكمال)
  const mostActiveChild = rankings.reduce((max, current) =>
    current.completionRate > max.completionRate ? current : max
  );

  return (
    <View style={styles.summaryCardContainer}>
      <View style={[styles.summaryCard, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
        <Text style={styles.summaryTitle}>ملخص المقارنة 📊</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>الفارق</Text>
            <Text style={styles.summaryValue}>{levelGap}</Text>
            <Text style={styles.summarySubtext}>مستوى</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>معدل الإكمال</Text>
            <Text style={styles.summaryValue}>{avgCompletionRate}</Text>
            <Text style={styles.summarySubtext}>%</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>الأكثر نشاطاً</Text>
            <Text style={styles.summaryValue}>{mostActiveChild.completionRate}</Text>
            <Text style={styles.summarySubtext}>%</Text>
          </View>
        </View>

        {/* Top Insight */}
        <View style={styles.insightBox}>
          <Text style={styles.insightEmoji}>💡</Text>
          <Text style={styles.insightText}>
            {firstPlace.childName} في المقدمة بـ {levelGap} مستوى. {mostActiveChild.childName} الأكثر نشاطاً بمعدل {mostActiveChild.completionRate}%!
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============================================
// Insights Card Component
// ============================================
const InsightsCard: React.FC<{ rankings: any[] }> = ({ rankings }) => {
  // دالة لتحويل النص حسب النوع الجنسي
  const applyGenderTransformation = (text: string, childGender?: string): string => {
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
      [/غير نشط/g, 'غير نشيطة'],
      [/ينمو/g, 'تنمو'],
      [/يحتاج/g, 'تحتاج'],
      [/القائد/g, 'القائدة'],
    ];

    return transformations.reduce((result, [pattern, replacement]) =>
      result.replace(pattern, replacement), text);
  };

  const insights: { text: string; gender?: string }[] = [];

  // Insight 1: تحية للمتقدم الأول
  const leader = rankings[0];
  insights.push({
    text: `🏆 ممتاز! ${leader.childName} متقدم وفي المقدمة!`,
    gender: leader.gender,
  });

  // Insight 2: الفرق في المستويات أو XP مع الطفل الثاني
  if (rankings.length > 1) {
    const secondPlace = rankings[1];
    const levelDifference = leader.level - secondPlace.level;

    if (levelDifference > 0) {
      // إذا هناك فرق في المستويات
      insights.push({
        text: `📊 ${leader.childName} متقدم على ${secondPlace.childName} بـ ${levelDifference} مستوى`,
        gender: leader.gender,
      });
    } else if (levelDifference === 0) {
      // إذا نفس المستوى، حساب فرق XP
      const xpDifference = Math.abs(leader.currentXP - secondPlace.currentXP);
      insights.push({
        text: `📊 ${leader.childName} متقدم على ${secondPlace.childName} بـ ${xpDifference} نقطة في نفس المستوى`,
        gender: leader.gender,
      });
    }
  }

  return (
    <View style={styles.insightsContainer}>
      <View style={[styles.insightsCard, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
        <Text style={styles.insightsTitle}>رؤى ذكية 💡</Text>

        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Text style={styles.insightItemText}>
              {applyGenderTransformation(insight.text, insight.gender)}
            </Text>
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
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 20,
    marginBottom: 20,
  },

  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  // Ranking Card
  rankingCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  rankingCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
  },
  rankingCardFirst: {
    borderColor: '#FFD700',
  },

  rankBadgeContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  rankBadge: {
    fontSize: 40,
    marginBottom: 4,
  },
  rankNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
  },
  rankAvatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 60,
    height: 60,
  },
  rankAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
  },
  rankAvatarEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  rankBadgeNumber: {
    fontSize: 14,
    fontWeight: '900',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  childInfoContainer: {
    flex: 1,
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  childAvatar: {
    fontSize: 36,
  },
  childAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  childNameCol: {
    flex: 1,
  },
  childName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  childNameLarge: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  childBadge: {
    fontSize: 16,
    marginTop: 2,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  statBoxValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
    marginTop: 2,
  },

  starsProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  starsProgressLabel: {
    minWidth: 50,
  },
  starsProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  starsBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  starsBarFill: {
    height: '100%',
  },
  starsValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    minWidth: 40,
  },

  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  trendArrow: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  // Summary Card
  summaryCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'right',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
  },
  summarySubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  insightBox: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(102,126,234,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.3)',
  },
  insightEmoji: {
    fontSize: 16,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    textAlign: 'right'
  },

  // Insights Card
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  insightsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'right',
  },

  insightItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  insightItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
  },

  // Floating Action Button
  floatingActionButtonContainer: {
    position: 'absolute',
    bottom: 85, // فوق البوتوم نافيجيتور
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
});
