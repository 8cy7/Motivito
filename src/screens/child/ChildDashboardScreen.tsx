import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
  Image,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { AppModal } from '../../components/AppModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { MotivationalMessage } from '../../components/child/MotivationalMessage';
import { SimpleTaskBoard, TaskDetailModal } from '../../components/child/SimpleTaskBoard';
// BottomNavBar removed - using settings button only
import { ChildSettingsScreen } from './ChildSettingsScreen';
import { AvatarPicker } from '../../components/child/AvatarPicker';
import { Child, Task, Reward } from '../../types';
import { ApprovedTaskInfo } from '../../../App';
import { getLatestBadge, calculateBadges } from '../../utils/badgeUtils';
import { useChildren } from '../../contexts/ChildrenContext';
import { useAuth } from '../../contexts/AuthContext';
import { SoundManager } from '../../utils/soundUtils';

interface ChildDashboardScreenProps {
  child: Child;
  tasks: Task[];
  rewards: Reward[];
  childRewardsRaw?: any[];
  onCompleteTask: (taskId: string) => void;
  onClaimReward: (rewardId: string) => void;
  navigation?: any;
  onRefreshTasks?: () => Promise<void>;
  justApprovedTasks?: ApprovedTaskInfo[];
  onClearApprovedTasks?: () => void;
}

export const ChildDashboardScreen: React.FC<ChildDashboardScreenProps> = ({
  child: initialChild,
  tasks,
  rewards,
  childRewardsRaw,
  onCompleteTask,
  onClaimReward,
  navigation,
  onRefreshTasks,
  justApprovedTasks,
  onClearApprovedTasks,
}) => {
  const { width, height } = useWindowDimensions();
  const { children, updateChild, isPremium } = useChildren();
  const { logoutChild, refreshChildInfo } = useAuth();
  const child = children.find(c => c.id === initialChild.id) || initialChild;

  const isLandscape = width > height;
  const shortSide = Math.min(width, height);
  const scale = shortSide / 375;
  const clampedScale = Math.min(Math.max(scale, 0.8), 1.6);

  // ========== SIZES ==========
  // Portrait sizes
  const pAvatarSize = Math.round(70 * clampedScale);
  const pNameSize = Math.round(22 * clampedScale);
  const pCircleSize = Math.round(75 * clampedScale);
  const pEmojiSize = Math.round(36 * clampedScale);
  const pNumSize = Math.round(22 * clampedScale);
  const pLabelSize = Math.round(9 * clampedScale);
  const pCardSize = Math.round(100 * clampedScale);
  const pCardEmoji = Math.round(32 * clampedScale);
  const pCardText = Math.round(11 * clampedScale);
  
  // Landscape sizes (أكبر من قبل)
  const lAvatarSize = Math.round(50 * clampedScale);
  const lNameSize = Math.round(16 * clampedScale);
  const lCircleSize = Math.round(55 * clampedScale);
  const lEmojiSize = Math.round(26 * clampedScale);
  const lNumSize = Math.round(16 * clampedScale);
  const lLabelSize = Math.round(7 * clampedScale);
  const lCardSize = Math.round(100 * clampedScale);
  const lCardEmoji = Math.round(32 * clampedScale);
  const lCardText = Math.round(11 * clampedScale);

  // Use appropriate sizes
  const avatarSize = isLandscape ? lAvatarSize : pAvatarSize;
  const nameSize = isLandscape ? lNameSize : pNameSize;
  const circleSize = isLandscape ? lCircleSize : pCircleSize;
  const emojiSize = isLandscape ? lEmojiSize : pEmojiSize;
  const numSize = isLandscape ? lNumSize : pNumSize;
  const labelSize = isLandscape ? lLabelSize : pLabelSize;
  const cardSize = isLandscape ? lCardSize : pCardSize;
  const cardEmoji = isLandscape ? lCardEmoji : pCardEmoji;
  const cardText = isLandscape ? lCardText : pCardText;
  const gap = Math.round(12 * clampedScale);

  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(child.avatar);
  const [unlockedEmojis, setUnlockedEmojis] = useState<string[]>(child.unlockedEmojis || []);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  // Load emoji unlocks from AsyncStorage (persists after BattlePass claim)
  const loadEmojis = useCallback(() => {
    AsyncStorage.getItem(`@bp_emojis_${child.id}`)
      .then(saved => { if (saved) setUnlockedEmojis(JSON.parse(saved)); })
      .catch(() => {});
  }, [child.id]);

  useEffect(() => { loadEmojis(); }, [loadEmojis]);

  // Refresh emojis every time we come back from another screen (e.g. BattlePass)
  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', loadEmojis);
    return unsubscribe;
  }, [navigation, loadEmojis]);
  const [lastCompletedTaskId, setLastCompletedTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Celebration state
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('');
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const celebrationQueue = useRef<ApprovedTaskInfo[]>([]);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationStars = useRef(new Animated.Value(0)).current;
  const celebrationPointsAnim = useRef(new Animated.Value(0)).current;
  // 5 floating star animations (y position + opacity)
  const floatingStars = useRef(
    [0, 1, 2, 3, 4].map(() => ({
      y: new Animated.Value(0),
      x: new Animated.Value((Math.random() - 0.5) * 160),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const shimmerAnim = useRef(new Animated.Value(-200)).current;
  useEffect(() => {
    // إعادة تشغيل الأنيميشن كل ما نرجع للداشبورد
    if (activeTab === 'home') {
      shimmerAnim.setValue(-200);
      Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 400, duration: 2000, useNativeDriver: true })
      ).start();
    }
  }, [activeTab, shimmerAnim]);

  // Queue celebration when new approvals arrive
  useEffect(() => {
    if (!justApprovedTasks || justApprovedTasks.length === 0) return;
    // Add new items not already in queue
    const existing = new Set(celebrationQueue.current.map(q => q.id));
    const toAdd = justApprovedTasks.filter(t => !existing.has(t.id));
    celebrationQueue.current = [...celebrationQueue.current, ...toAdd];
    if (!celebrationVisible) showNextCelebration();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justApprovedTasks]);

  const showNextCelebration = useCallback(() => {
    const next = celebrationQueue.current.shift();
    if (!next) return;
    setCelebrationTitle(next.title);
    setCelebrationPoints(next.points);
    // Play LevelUp sound
    SoundManager.playSound('levelup');
    // Reset all animations
    celebrationScale.setValue(0);
    celebrationStars.setValue(0);
    celebrationPointsAnim.setValue(0);
    floatingStars.forEach(s => { s.y.setValue(0); s.opacity.setValue(0); });
    setCelebrationVisible(true);
    // Float stars upward with stagger
    const starAnims = floatingStars.map((star, i) =>
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.parallel([
          Animated.timing(star.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(star.y, { toValue: -180, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.timing(star.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );
    Animated.parallel([
      Animated.spring(celebrationScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(celebrationStars, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(celebrationPointsAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      ]),
      ...starAnims,
    ]).start();
  }, [celebrationScale, celebrationStars, celebrationPointsAnim, floatingStars]);

  const handleCelebrationClose = useCallback(() => {
    setCelebrationVisible(false);
    if (celebrationQueue.current.length > 0) {
      setTimeout(showNextCelebration, 300);
    } else {
      onClearApprovedTasks?.();
    }
  }, [showNextCelebration, onClearApprovedTasks]);

  // Handlers
  const handleBattlePassPress = () => { SoundManager.playSound('openbox'); navigation?.navigate('BattlePass', { childId: child.id, child: child, rewardsRaw: childRewardsRaw || [] }); };
  const handleAchievementsPress = () => {
    if (!isPremium) { setShowPremiumModal(true); return; }
    SoundManager.playSound('openbox');
    navigation?.navigate('AchievementShelf', { singleChild: child });
  };
  const handleMapPress = () => {
    if (!isPremium) { setShowPremiumModal(true); return; }
    SoundManager.playSound('openbox');
    navigation?.navigate('ChildMap', { childId: child.id, childName: child.name, childGender: child.gender });
  };
  const handleLogout = () => logoutChild();
  const handleAvatarSelect = (emoji: string) => setCurrentAvatar(emoji);
  
  const handleTaskPress = (task: Task) => {
    SoundManager.playSound('openbox');
    setSelectedTask(task);
    setTaskModalVisible(true);
  };

  const handleTaskComplete = () => {
    if (selectedTask) {
      SoundManager.playSound('openbox');
      setLastCompletedTaskId(selectedTask.id);
      onCompleteTask(selectedTask.id);
      setTaskModalVisible(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([onRefreshTasks?.(), refreshChildInfo()]);
    setRefreshing(false);
  }, [onRefreshTasks, refreshChildInfo]);

  const handleImageUpload = async () => {
    try {
      const ImagePicker = require('react-native-image-picker');
      
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: false,
      };

      ImagePicker.launchImageLibrary(options, (response: any) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('خطأ', response.errorMessage || 'حدث خطأ أثناء فتح الاستديو');
          return;
        }
        if (response.assets && response.assets[0]?.uri) {
          setCurrentAvatar(response.assets[0].uri);
        }
      });
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء رفع الصورة');
    }
  };

  const handleDebugBonus = () => {
    let newXP = (child.xp || 0) + 1000;
    let newLevel = child.level;
    let xpNeeded = (newLevel + 1) * 100;
    while (newXP >= xpNeeded) { newXP -= xpNeeded; newLevel++; xpNeeded = (newLevel + 1) * 100; }
    updateChild({ ...child, level: newLevel, stars: (child.stars || 0) + 100, totalStars: (child.totalStars || 0) + 100, xp: newXP, badges: calculateBadges(newLevel, child.gender) });
  };

  if (activeTab === 'settings') {
    return (
      <View style={{ flex: 1 }}>
        <ChildSettingsScreen onLogout={handleLogout} />
        {/* زر الرجوع للداشبورد */}
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 24 }}>🏠</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latestBadge = getLatestBadge(child.badges);
  const xpProgress = (child.xp || 0) / ((child.level + 1) * 100);
  const circumference = 2 * Math.PI * (circleSize / 2 - 4);

  // ========== COMPONENTS ==========
  const AvatarComp = () => (
    <TouchableOpacity onPress={() => { SoundManager.playSound('openbox'); setAvatarPickerVisible(true); }} activeOpacity={0.8}>
      <LinearGradient colors={['#FFD700', '#FFA500']} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, justifyContent: 'center', alignItems: 'center' }}>
        {currentAvatar.startsWith('file://') || currentAvatar.startsWith('content://') 
          ? <Image source={{ uri: currentAvatar }} style={{ width: '100%', height: '100%', borderRadius: avatarSize / 2 }} />
          : <Text style={{ fontSize: avatarSize * 0.55 }}>{currentAvatar}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );

  const StarsCircle = () => (
    <View style={[styles.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
      <Text style={{ fontSize: emojiSize * 0.85 }}>⭐</Text>
      <Text style={[styles.circleNum, { fontSize: numSize }]}>{child.stars || 0}</Text>
    </View>
  );

  const LevelCircle = () => (
    <TouchableOpacity onPress={handleDebugBonus} activeOpacity={0.7} style={[styles.levelCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
      <Svg width={circleSize} height={circleSize} style={StyleSheet.absoluteFill}>
        <Circle cx={circleSize / 2} cy={circleSize / 2} r={circleSize / 2 - 4} stroke="rgba(255,255,255,0.2)" strokeWidth={4} fill="none" />
        <Circle cx={circleSize / 2} cy={circleSize / 2} r={circleSize / 2 - 4} stroke="#FFD700" strokeWidth={4} fill="none" strokeDasharray={`${xpProgress * circumference} ${circumference}`} strokeLinecap="round" transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`} />
      </Svg>
      <Text style={{ fontSize: labelSize, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>المستوى</Text>
      <Text style={[styles.circleNum, { fontSize: numSize }]}>{child.level}</Text>
      <Text style={{ fontSize: labelSize * 0.85, color: 'rgba(255,255,255,0.6)' }}>{child.xp || 0}/{(child.level + 1) * 100}</Text>
    </TouchableOpacity>
  );

  const BadgeCircle = () => latestBadge ? (
    <View style={[styles.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
      <Text style={{ fontSize: emojiSize }}>{latestBadge.emoji}</Text>
    </View>
  ) : null;

  const QuickCard = ({ emoji, title, colors, onPress }: { emoji: string; title: string; colors: string[]; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ width: cardSize, height: cardSize, borderRadius: gap, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
      <LinearGradient colors={colors} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, width: 50, backgroundColor: 'rgba(255,255,255,0.2)', transform: [{ translateX: shimmerAnim }, { skewX: '-20deg' }] }} />
        <Text style={{ fontSize: cardEmoji }}>{emoji}</Text>
        <Text style={{ fontSize: cardText, fontWeight: '700', color: '#FFF', textAlign: 'center' }}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  // ========== RENDER ==========
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#7241c6', '#5c34a3', '#7241c6']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFD700"
              colors={['#FFD700']}
            />
          }
        >
          
          {isLandscape ? (
            // ========== LANDSCAPE ==========
            <View style={{ flex: 1, padding: gap }}>
              {/* Row 1: Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: gap }}>
                {/* Left: Avatar + Name */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: gap * 0.6 }}>
                  <AvatarComp />
                  <Text style={{ fontSize: nameSize, fontWeight: '700', color: '#FFF' }}>{child.name}</Text>
                </View>
                
                {/* Center: Message */}
                <View style={{ flex: 1, marginHorizontal: gap, alignItems: 'center' }}>
                  <MotivationalMessage gender={child.gender} />
                </View>
                
                {/* Right: Circles */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: gap * 0.5 }}>
                  <StarsCircle />
                  <LevelCircle />
                  <BadgeCircle />
                </View>
              </View>

              {/* Row 2: Content - Cards على اليمين، Board على اليسار */}
              <View style={{ flex: 1, flexDirection: 'row-reverse', gap: gap }}>
                {/* Cards Column - يمين */}
                <View style={{ justifyContent: 'flex-start', gap: gap * 0.8, paddingTop: gap * 0.5 }}>
                  <QuickCard emoji="🎁" title="موتيفيتو باس" colors={['#9C27B0', '#7B1FA2']} onPress={handleBattlePassPress} />
                  <QuickCard emoji="🏆" title="رف الإنجازات" colors={['#A0745B', '#8B6347']} onPress={handleAchievementsPress} />
                  <QuickCard emoji="🗺️" title="الخريطة" colors={['#4CAF50', '#2E7D32']} onPress={handleMapPress} />
                </View>
                
                {/* Task Board - يسار */}
                <View style={{ flex: 1 }}>
                  <SimpleTaskBoard tasks={tasks} onCompleteTask={onCompleteTask} onTaskPress={handleTaskPress} completedTaskId={lastCompletedTaskId} />
                </View>
              </View>
            </View>
          ) : (
            // ========== PORTRAIT ==========
            <View style={{ padding: gap }}>
              {/* Header Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: gap }}>
                <AvatarComp />
                <Text style={{ fontSize: nameSize, fontWeight: '700', color: '#FFF', marginLeft: gap * 0.6 }}>{child.name}</Text>
                <View style={{ flex: 1 }} />
                <View style={{ flexDirection: 'row', gap: gap * 0.5 }}>
                  <StarsCircle />
                  <LevelCircle />
                  <BadgeCircle />
                </View>
              </View>

              {/* Message */}
              <View style={{ marginBottom: gap }}>
                <MotivationalMessage gender={child.gender} />
              </View>

              {/* Task Board */}
              <SimpleTaskBoard tasks={tasks} onCompleteTask={onCompleteTask} onTaskPress={handleTaskPress} completedTaskId={lastCompletedTaskId} />

              {/* Cards Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: gap, marginTop: gap }}>
                <QuickCard emoji="🎁" title="موتيفيتو باس" colors={['#9C27B0', '#7B1FA2']} onPress={handleBattlePassPress} />
                <QuickCard emoji="🏆" title="رف الإنجازات" colors={['#A0745B', '#8B6347']} onPress={handleAchievementsPress} />
                <QuickCard emoji="🗺️" title="الخريطة" colors={['#4CAF50', '#2E7D32']} onPress={handleMapPress} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* زر الإعدادات - أسفل اليمين */}
        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 24 }}>⚙️</Text>
        </TouchableOpacity>

        {/* زر الأصدقاء - أسفل اليسار */}
        <TouchableOpacity
          onPress={() =>
            navigation?.navigate('Friends', {
              childId:     child.id,
              childName:   child.name,
              childGender: child.gender,
            })
          }
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'rgba(109,40,217,0.75)',
            borderWidth: 2,
            borderColor: 'rgba(196,181,253,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#6d28d9',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          <Text style={{ fontSize: 24 }}>👥</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <AvatarPicker
        visible={avatarPickerVisible}
        currentAvatar={currentAvatar}
        onSelect={handleAvatarSelect}
        onClose={() => setAvatarPickerVisible(false)}
        onImageUpload={handleImageUpload}
        gender={child.gender}
        unlockedEmojis={unlockedEmojis}
      />

      <TaskDetailModal
        visible={taskModalVisible}
        task={selectedTask}
        onComplete={handleTaskComplete}
        onClose={() => setTaskModalVisible(false)}
      />

      {/* Celebration Modal — تهنئة عند اعتماد المهمة */}
      <AppModal
        visible={celebrationVisible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={handleCelebrationClose}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={handleCelebrationClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <Animated.View style={{
              transform: [{ scale: celebrationScale }],
              backgroundColor: '#4C1D95',
              borderRadius: 30,
              padding: 28,
              alignItems: 'center',
              width: 310,
              borderWidth: 3,
              borderColor: '#FFD700',
              shadowColor: '#FFD700',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 24,
              elevation: 24,
              overflow: 'visible',
            }}>

              {/* نجوم طائرة */}
              {floatingStars.map((star, i) => (
                <Animated.Text
                  key={i}
                  style={{
                    position: 'absolute',
                    fontSize: 22,
                    top: '50%',
                    left: '50%',
                    opacity: star.opacity,
                    transform: [
                      { translateX: star.x },
                      { translateY: star.y },
                    ],
                    zIndex: 20,
                  }}
                >
                  ⭐
                </Animated.Text>
              ))}

              {/* نجمة كبيرة متحركة */}
              <Animated.Text style={{
                fontSize: 64,
                marginBottom: 4,
                transform: [{
                  scale: celebrationStars.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0.3, 1.4, 1],
                  }),
                }],
                opacity: celebrationStars,
              }}>
                ⭐
              </Animated.Text>

              {/* عنوان */}
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFD700', marginBottom: 10, textAlign: 'center' }}>
                تمت الموافقة! 🎉
              </Text>

              {/* اسم المهمة */}
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.13)',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 18,
                width: '100%',
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFF', textAlign: 'center' }} numberOfLines={2}>
                  {celebrationTitle}
                </Text>
              </View>

              {/* النقاط المكتسبة — تظهر بانيميشن */}
              <Animated.View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
                transform: [{
                  scale: celebrationPointsAnim.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0.4, 1.3, 1],
                  }),
                }],
                opacity: celebrationPointsAnim,
              }}>
                <Text style={{ fontSize: 38, fontWeight: '900', color: '#FFD700' }}>
                  +{celebrationPoints}
                </Text>
                <Text style={{ fontSize: 34 }}>⭐</Text>
              </Animated.View>

              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 22 }}>
                تمت إضافة النجوم لرصيدك ✨
              </Text>

              <TouchableOpacity
                onPress={handleCelebrationClose}
                style={{
                  backgroundColor: '#FFD700',
                  borderRadius: 18,
                  paddingVertical: 13,
                  paddingHorizontal: 44,
                  borderWidth: 2.5,
                  borderColor: '#000',
                  shadowColor: '#FFD700',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                  elevation: 8,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#000' }}>رائع! 🌟</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </AppModal>

      {/* Premium Upgrade Modal — للطفل */}
      <AppModal visible={showPremiumModal} transparent animationType="fade" presentationStyle="overFullScreen">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowPremiumModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: '#1a1a3e', width: 300, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 8, textAlign: 'center' }}>
                ميزة مدفوعة
              </Text>
              <Text style={{ fontSize: 14, color: '#b0c4de', textAlign: 'center', marginBottom: 20, lineHeight: 22 }}>
                هذه الميزة متاحة لأصحاب الاشتراك المدفوع.{'\n'}اطلب من والدك الاشتراك في موتيفيتو 🚀
              </Text>
              <View style={{ backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 12, padding: 12, width: '100%', marginBottom: 20 }}>
                <Text style={{ color: '#b0c4de', fontSize: 12, textAlign: 'center', marginBottom: 4 }}>السعر الشهري</Text>
                <Text style={{ color: '#FFD700', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>﷼ 14.99</Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, width: '100%' }}
                onPress={() => setShowPremiumModal(false)}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000', textAlign: 'center' }}>حسناً</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelCircle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleNum: {
    fontWeight: '800',
    color: '#FFD700',
  },
});
