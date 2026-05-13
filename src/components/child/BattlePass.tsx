import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { AppModal } from '../AppModal';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Gender, Reward } from '../../types';
import { SoundManager } from '../../utils/soundUtils';

const { width, height } = Dimensions.get('window');

// Level Milestone Data
const LEVEL_MILESTONES = [
  { level: 10, type: 'message', emoji: '💌', title: 'رسالة شكر 1' },
  { level: 20, type: 'message', emoji: '💝', title: 'رسالة شكر 2' },
  { level: 30, type: 'message', emoji: '💖', title: 'رسالة شكر 3' },
  { level: 40, type: 'message', emoji: '💗', title: 'رسالة شكر 4' },
  { level: 50, type: 'voucher', emoji: '🎟️', title: 'قسيمة نون 10 ريال', value: '10 ريال' },
  { level: 60, type: 'message', emoji: '💕', title: 'رسالة شكر 5' },
  { level: 70, type: 'voucher', emoji: '🎁', title: 'قسيمة شي إن 5%', value: '5%' },
  { level: 80, type: 'voucher', emoji: '🎫', title: 'قسيمة أمازون 20 ريال', value: '20 ريال' },
  { level: 90, type: 'message', emoji: '👑', title: 'رسالة ذهبية', special: true },
  { level: 100, type: 'mystery', emoji: '🎁', title: 'هدية غامضة', options: ['10$ PlayStation', '30 ريال جرير'] },
];

// Flame Animation Component
const FlameIcon = () => {
  const flameAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Svg width={20} height={24} viewBox="0 0 20 24">
        <Defs>
          <SvgLinearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF4500" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M 10 2 Q 12 6 14 10 Q 16 14 14 18 Q 12 22 10 22 Q 8 22 6 18 Q 4 14 6 10 Q 8 6 10 2 Z"
          fill="url(#flameGrad)"
        />
        <Path
          d="M 10 8 Q 11 10 11 12 Q 11 14 10 16 Q 9 14 9 12 Q 9 10 10 8 Z"
          fill="#FFFFFF"
          opacity="0.7"
        />
      </Svg>
    </Animated.View>
  );
};

// Lock Icon
const LockIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Rect x="6" y="11" width="12" height="10" rx="2" fill="#888888" />
    <Path d="M 8 11 L 8 7 Q 8 4 12 4 Q 16 4 16 7 L 16 11" stroke="#888888" strokeWidth="2" fill="none" />
    <Circle cx="12" cy="16" r="2" fill="#FFFFFF" />
  </Svg>
);

interface BattlePassProps {
  currentLevel: number;
  currentStars: number;
  rewards: Reward[];
  gender: Gender;
  onClaimReward: (rewardId: string) => void;
  onOpenMessage: (level: number) => void;
}

export const BattlePass: React.FC<BattlePassProps> = ({
  currentLevel,
  currentStars,
  rewards,
  gender,
  onClaimReward,
  onOpenMessage,
}) => {
  const [selectedMystery, setSelectedMystery] = React.useState<string | null>(null);
  const [mysteryModalVisible, setMysteryModalVisible] = React.useState(false);

  const isBoy = gender === 'boy';
  const accentColor = isBoy ? '#4facfe' : '#f093fb';
  const gradientColors = isBoy
    ? ['#667eea', '#764ba2']
    : ['#f093fb', '#f5576c'];

  // Sort rewards by cost
  const sortedRewards = [...rewards].sort((a, b) => a.pointsCost - b.pointsCost);

  const handleMysteryGift = (level: number) => {
    const milestone = LEVEL_MILESTONES.find(m => m.level === level);
    if (milestone && milestone.type === 'mystery' && milestone.options) {
      setMysteryModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.battlePassContainer, { backgroundColor: gradientColors[0] }]}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>المستوى</Text>
            <Text style={styles.headerValue}>{currentLevel}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Battle Pass</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>النجوم</Text>
            <Text style={styles.headerValue}>⭐ {currentStars}</Text>
          </View>
        </View>

        {/* Scrollable Battle Pass Tracks */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tracksScrollView}
          contentContainerStyle={styles.tracksContainer}>

          {/* Left Track: Rewards (Stars) */}
          <View style={styles.track}>
            <Text style={styles.trackTitle}>🎁 الهدايا</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.trackScrollView}>
              {sortedRewards.map((reward, index) => {
                const isUnlocked = currentStars >= reward.pointsCost;
                const progressToThis = currentStars / reward.pointsCost;
                const showProgress = !isUnlocked && progressToThis > 0 && progressToThis < 1;

                return (
                  <View key={reward.id} style={styles.rewardNode}>
                    {/* Connection Line */}
                    {index > 0 && (
                      <View style={styles.connectionLine}>
                        {isUnlocked && (
                          <View
                            style={[styles.connectionLineFilled, { backgroundColor: '#FFD700' }]}
                          />
                        )}
                      </View>
                    )}

                    {/* Reward Box */}
                    <TouchableOpacity
                      activeOpacity={isUnlocked ? 0.7 : 1}
                      onPress={async () => {
                        if (isUnlocked) {
                          // تشغيل صوت الشراء/الحصول على الجائزة
                          await SoundManager.playSound('bonus');
                          onClaimReward(reward.id);
                        }
                      }}
                      style={[
                        styles.rewardBox,
                        isUnlocked && styles.rewardBoxUnlocked,
                      ]}>
                      <View
                        style={[styles.rewardBoxGradient, { backgroundColor: isUnlocked ? '#4CAF50' : reward.pointsCost <= 100 ? '#E0E0E0' : reward.pointsCost <= 500 ? '#90CAF9' : '#FFD54F' }]}>

                        {!isUnlocked && <LockIcon />}
                        {isUnlocked && (
                          <View style={styles.rewardContent}>
                            <Text style={styles.rewardEmoji}>🎁</Text>
                            <Text style={styles.rewardTitle} numberOfLines={2}>
                              {reward.title}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.rewardCost}>⭐ {reward.pointsCost}</Text>
                      </View>

                      {/* Progress Indicator */}
                      {showProgress && (
                        <View style={styles.progressIndicator}>
                          <View style={styles.progressFlame}>
                            <FlameIcon />
                          </View>
                          <Text style={styles.progressText}>
                            {Math.floor(progressToThis * 100)}%
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Track: Level Milestones */}
          <View style={styles.track}>
            <Text style={styles.trackTitle}>🏆 الإنجازات</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.trackScrollView}>
              {LEVEL_MILESTONES.map((milestone, index) => {
                const isUnlocked = currentLevel >= milestone.level;
                const progressToThis = currentLevel / milestone.level;
                const showProgress = !isUnlocked && progressToThis > 0 && progressToThis < 1;

                return (
                  <View key={milestone.level} style={styles.milestoneNode}>
                    {/* Connection Line */}
                    {index > 0 && (
                      <View style={styles.connectionLine}>
                        {isUnlocked && (
                          <View
                            style={[styles.connectionLineFilled, { backgroundColor: '#FFD700' }]}
                          />
                        )}
                      </View>
                    )}

                    {/* Milestone Box */}
                    <TouchableOpacity
                      activeOpacity={isUnlocked ? 0.7 : 1}
                      onPress={() => {
                        if (isUnlocked) {
                          if (milestone.type === 'message') {
                            onOpenMessage(milestone.level);
                          } else if (milestone.type === 'mystery') {
                            handleMysteryGift(milestone.level);
                          }
                        }
                      }}
                      style={[
                        styles.milestoneBox,
                        isUnlocked && styles.milestoneBoxUnlocked,
                        milestone.special && styles.milestoneBoxSpecial,
                      ]}>
                      <View
                        style={[styles.milestoneBoxGradient, { backgroundColor: isUnlocked ? milestone.type === 'message' ? milestone.special ? '#FFD700' : '#E91E63' : milestone.type === 'voucher' ? '#4CAF50' : '#9C27B0' : '#E0E0E0' }]}>

                        {!isUnlocked && <LockIcon />}
                        {isUnlocked && (
                          <View style={styles.milestoneContent}>
                            <Text style={styles.milestoneEmoji}>{milestone.emoji}</Text>
                            <Text style={styles.milestoneTitle} numberOfLines={2}>
                              {milestone.title}
                            </Text>
                            {milestone.value && (
                              <Text style={styles.milestoneValue}>{milestone.value}</Text>
                            )}
                          </View>
                        )}
                        <Text style={styles.milestoneLevel}>LVL {milestone.level}</Text>
                      </View>

                      {/* Progress Indicator */}
                      {showProgress && (
                        <View style={styles.progressIndicator}>
                          <View style={styles.progressFlame}>
                            <FlameIcon />
                          </View>
                          <Text style={styles.progressText}>
                            {Math.floor(progressToThis * 100)}%
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Mystery Gift Modal */}
      <AppModal
        visible={mysteryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMysteryModalVisible(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View
              style={[modalStyles.gradient, { backgroundColor: '#9C27B0' }]}>
              <Text style={modalStyles.title}>🎁 هدية غامضة!</Text>
              <Text style={modalStyles.subtitle}>اختر هديتك:</Text>

              <View style={modalStyles.options}>
                <TouchableOpacity
                  style={modalStyles.option}
                  activeOpacity={0.8}
                  onPress={async () => {
                    // تشغيل صوت الشراء عند الاختيار
                    await SoundManager.playSound('bonus');
                    setSelectedMystery('playstation');
                    setMysteryModalVisible(false);
                  }}>
                  <View
                    style={[modalStyles.optionGradient, { backgroundColor: '#2196F3' }]}>
                    <Text style={modalStyles.optionEmoji}>🎮</Text>
                    <Text style={modalStyles.optionText}>10$ PlayStation</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={modalStyles.option}
                  activeOpacity={0.8}
                  onPress={async () => {
                    // تشغيل صوت الشراء عند الاختيار
                    await SoundManager.playSound('bonus');
                    setSelectedMystery('jarir');
                    setMysteryModalVisible(false);
                  }}>
                  <View
                    style={[modalStyles.optionGradient, { backgroundColor: '#4CAF50' }]}>
                    <Text style={modalStyles.optionEmoji}>📚</Text>
                    <Text style={modalStyles.optionText}>30 ريال جرير</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={modalStyles.closeButton}
                onPress={() => setMysteryModalVisible(false)}>
                <Text style={modalStyles.closeButtonText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  battlePassContainer: {
    borderRadius: 25,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerLeft: {
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  headerValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tracksScrollView: {
    maxHeight: 500,
  },
  tracksContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  track: {
    width: width * 0.4,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  trackScrollView: {
    maxHeight: 420,
  },
  rewardNode: {
    marginBottom: 20,
    position: 'relative',
  },
  milestoneNode: {
    marginBottom: 20,
    position: 'relative',
  },
  connectionLine: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  connectionLineFilled: {
    width: '100%',
    height: '100%',
  },
  rewardBox: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  rewardBoxUnlocked: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.5,
  },
  rewardBoxGradient: {
    padding: 12,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardContent: {
    alignItems: 'center',
  },
  rewardEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  rewardCost: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6,
  },
  milestoneBox: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  milestoneBoxUnlocked: {
    shadowOpacity: 0.5,
  },
  milestoneBoxSpecial: {
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
  },
  milestoneBoxGradient: {
    padding: 12,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneContent: {
    alignItems: 'center',
  },
  milestoneEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneValue: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  milestoneLevel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6,
  },
  progressIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    alignItems: 'center',
  },
  progressFlame: {
    marginBottom: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  gradient: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  options: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  option: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
