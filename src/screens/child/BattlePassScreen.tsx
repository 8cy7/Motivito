import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Animated,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { AppModal } from '../../components/AppModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { useChildren } from '../../contexts/ChildrenContext';
import { useAuth } from '../../contexts/AuthContext';
import { Child } from '../../types';
import { childApi, parentApi } from '../../services/api';
import { SoundManager } from '../../utils/soundUtils';

// Gender-specific rewards configuration
interface RewardTier {
  level: number;
  emoji: string;
  type: 'message' | 'voucher' | 'emoji' | 'mystery';
  title: string;
  description: string;
}

const BOYS_REWARDS: RewardTier[] = [
  { level: 10, emoji: '💌', type: 'message', title: 'شكر 1', description: 'أنت قدوتي ! 💪' },
  { level: 20, emoji: '💌', type: 'message', title: 'شكر 2', description: 'كل يوم أتعلم منك ! 📚' },
  { level: 30, emoji: '😎', type: 'emoji', title: 'ايموجي: الواثق', description: 'تم فتح الايموجي ' },
  { level: 40, emoji: '💌', type: 'message', title: 'شكر 3', description: 'أنا فخور بك ! 🌟' },
  { level: 50, emoji: '🎟️', type: 'voucher', title: 'قسيمة', description: '10 ريال' },
  { level: 60, emoji: '🦸‍♂️', type: 'emoji', title: 'ايموجي: البطل', description: 'تم فتح الايموجي ' },
  { level: 70, emoji: '💌', type: 'message', title: 'شكر 4 ', description: '5%' },
  { level: 80, emoji: '🎟️', type: 'voucher', title: 'قسيمة', description: '20 ريال' },
  { level: 90, emoji: '🤴', type: 'emoji', title: 'ايموجي: الملك', description: 'تم فتح الايموجي ' },
  { level: 100, emoji: '🎁', type: 'mystery', title: 'غامضة', description: 'PlayStation أو جرير' },
];

const GIRLS_REWARDS: RewardTier[] = [
  { level: 10, emoji: '💌', type: 'message', title: 'شكر 1', description: 'إبداعاتي من تعليمك ! ✨' },
  { level: 20, emoji: '💌', type: 'message', title: 'شكر 2', description: 'انت مصدر الهام ! 💖' },
  { level: 30, emoji: '🦋', type: 'emoji', title: 'ايموجي: الفراشة', description: 'تم فتح الايموجي ' },
  { level: 40, emoji: '💌', type: 'message', title: 'شكر 3', description: 'كل لحظة مليئة بالفرح ! 🌸' },
  { level: 50, emoji: '🎟️', type: 'voucher', title: 'قسيمة', description: '10 ريال' },
  { level: 60, emoji: '🧚', type: 'emoji', title: 'ايموجي: الرشيقة', description: 'تم فتح الايموجي ' },
  { level: 70, emoji: '💌', type: 'message', title: 'شكر 4', description: 'شكرا على كل ما يقدم لي , وجودك بحياتي هو أعظم نعمة 💖 ' },
  { level: 80, emoji: '🎟️', type: 'voucher', title: 'قسيمة', description: '20 ريال' },
  { level: 90, emoji: '👸', type: 'emoji', title: ' ايموجي: الملكة', description: 'تم فتح الايموجي ' },
  { level: 100, emoji: '🎁', type: 'mystery', title: 'غامضة', description: 'PlayStation أو جرير' },
];

// Flame animation component
const FlameIcon: React.FC = () => {
  const flameAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(flameAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Text style={{ fontSize: 24 }}>🔥</Text>
    </Animated.View>
  );
};

// Star Icon for rewards
const StarIcon: React.FC = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24">
    <Path
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      fill="#FFD700"
    />
  </Svg>
);

// Starfield background — uses dynamic dimensions to fill any screen size/orientation
const StarfieldBackground: React.FC = () => {
  const { width: w, height: h } = useWindowDimensions();
  const stars = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: Math.random() * w,
    y: Math.random() * h * 1.5,
    opacity: Math.random() * 0.7 + 0.3,
    size: Math.random() * 1.5 + 0.5,
  }));

  return (
    <Svg width={w} height={h * 1.5} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <SvgLinearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0a0e27" stopOpacity="1" />
          <Stop offset="50%" stopColor="#1a1a3e" stopOpacity="1" />
          <Stop offset="100%" stopColor="#16213e" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Rect width={w} height={h * 1.5} fill="url(#skyGrad)" />
      {stars.map(star => (
        <Circle key={star.id} cx={star.x} cy={star.y} r={star.size} fill="#ffffff" opacity={star.opacity} />
      ))}
    </Svg>
  );
};

// Reward box component
interface RewardBoxProps {
  tier: RewardTier;
  isUnlocked: boolean;
  isClaimed: boolean;
  progress: number;
  onPress: () => void;
  genderColor: string;
}

const RewardBox: React.FC<RewardBoxProps> = ({ tier, isUnlocked, isClaimed, progress, onPress, genderColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isUnlocked) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isUnlocked, scaleAnim]);

  return (
    <TouchableOpacity onPress={onPress} disabled={!isUnlocked} activeOpacity={isUnlocked ? 0.7 : 1}>
      <Animated.View
        style={[
          styles.rewardBox,
          {
            transform: [{ scale: scaleAnim }],
            opacity: isUnlocked ? 1 : 0.5,
          },
        ]}
      >
        <LinearGradient
          colors={isUnlocked ? [genderColor, '#8B7355'] : ['#333333', '#1a1a1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rewardGradient}
        >
          <Text style={styles.rewardEmoji}>{tier.emoji}</Text>
          <Text style={[styles.rewardLevel, { color: isUnlocked ? '#FFD700' : '#666666' }]}>
            {tier.level}
          </Text>

          {!isUnlocked && progress > 0 && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: genderColor,
                  },
                ]}
              />
            </View>
          )}

          {isUnlocked && progress > 85 && (
            <View style={styles.flameContainer}>
              <FlameIcon />
            </View>
          )}

          {!isUnlocked && !isClaimed && (
            <View style={styles.lockIcon}>
              <Text style={{ fontSize: 16 }}>🔒</Text>
            </View>
          )}

          {isClaimed && (
            <>
              <View style={styles.claimedOverlay} />
              <View style={styles.checkmarkIcon}>
                <Text style={{ fontSize: 64, color: '#FFD700', fontWeight: 'bold' }}>✓</Text>
              </View>
            </>
          )}
        </LinearGradient>

        <Text style={styles.rewardTitle} numberOfLines={1}>
          {tier.title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const PURCHASE_LOCK_SECS = 120; // 2 minutes

const formatCountdown = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Parent Gift Card Component
interface ParentGiftCardProps {
  name: string;
  emoji: string;
  stars: number;
  tier: 'small' | 'medium' | 'large';
  canAfford: boolean;
  onPress: () => void;
  purchasedAt?: number; // timestamp ms — when set, card is locked for PURCHASE_LOCK_SECS
}

const TIER_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  small:  { bg: '#0d3d2e', border: '#22c55e', badge: '#22c55e' },
  medium: { bg: '#1a1456', border: '#818cf8', badge: '#818cf8' },
  large:  { bg: '#3d2000', border: '#fbbf24', badge: '#fbbf24' },
};
const TIER_LABEL: Record<string, string> = {
  small: 'صغيرة', medium: 'متوسطة', large: 'كبيرة',
};

const ParentGiftCard: React.FC<ParentGiftCardProps> = ({ name, emoji, stars, tier, canAfford, onPress, purchasedAt }) => {
  const { bg, border, badge } = TIER_COLORS[tier];
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!purchasedAt) { setRemaining(0); return; }
    const calc = () => {
      const left = Math.max(PURCHASE_LOCK_SECS - Math.floor((Date.now() - purchasedAt) / 1000), 0);
      setRemaining(left);
      return left;
    };
    if (calc() <= 0) return;
    const iv = setInterval(() => { if (calc() <= 0) clearInterval(iv); }, 1000);
    return () => clearInterval(iv);
  }, [purchasedAt]);

  const isPurchased = remaining > 0;

  return (
    <TouchableOpacity onPress={(!isPurchased && canAfford) ? onPress : undefined} activeOpacity={0.8}>
      <View style={{
        width: 120,
        height: 160,
        borderRadius: 16,
        backgroundColor: isPurchased ? '#1a1a2e' : bg,
        borderWidth: 2,
        borderColor: isPurchased ? 'rgba(255,255,255,0.15)' : (canAfford ? border : 'rgba(255,255,255,0.12)'),
        opacity: (isPurchased || !canAfford) ? 0.5 : 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        overflow: 'hidden',
      }}>
        {/* Tier badge */}
        <View style={{ alignSelf: 'flex-end', backgroundColor: isPurchased ? '#555' : badge, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>{TIER_LABEL[tier]}</Text>
        </View>

        {/* Emoji */}
        <Text style={{ fontSize: 44 }}>{emoji}</Text>

        {/* Name */}
        <Text numberOfLines={2} style={{ fontSize: 11, color: isPurchased ? '#888' : '#fff', fontWeight: '700', textAlign: 'center', lineHeight: 15 }}>
          {name}
        </Text>

        {/* Stars */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 3 }}>
          <Text style={{ fontSize: 11 }}>⭐</Text>
          <Text style={{ fontSize: 13, fontWeight: '900', color: isPurchased ? '#888' : '#FFD700' }}>{stars}</Text>
        </View>

        {/* Lock overlay when purchased */}
        {isPurchased && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14 }}>
            <Text style={{ fontSize: 22 }}>🔒</Text>
            <Text style={{ fontSize: 13, color: '#FFD700', fontWeight: '900', marginTop: 4 }}>
              {formatCountdown(remaining)}
            </Text>
          </View>
        )}

        {/* Lock when can't afford (no purchase) */}
        {!isPurchased && !canAfford && (
          <View style={{ position: 'absolute', top: 8, left: 8 }}>
            <Text style={{ fontSize: 14 }}>🔒</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Main screen component
interface BattlePassScreenProps {
  child: Child;
  rewards: any[];
  onRefreshRewards?: () => Promise<void>;
  navigation: any;
}

export const BattlePassScreen: React.FC<BattlePassScreenProps> = ({ child, rewards: rewardsProp, onRefreshRewards, navigation }) => {
  const { updateChild, isPremium } = useChildren();
  const { updateChildStars } = useAuth();

  const [selectedReward, setSelectedReward] = useState<RewardTier | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [selectedGift, setSelectedGift] = useState<{ id: string; name: string; emoji: string; stars: number; tier: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rewards, setRewards] = useState<any[]>(rewardsProp || []);
  const [purchasedGifts, setPurchasedGifts] = useState<Record<string, number>>({}); // giftId → purchasedAt ms

  // Load claimed levels: AsyncStorage first (instant), then sync from API if available
  useEffect(() => {
    const storageKey = `@bp_claimed_${child.id}`;
    AsyncStorage.getItem(storageKey)
      .then(saved => { if (saved) setClaimedRewards(JSON.parse(saved)); })
      .catch(() => {});

    // Try to sync from API (no-op if endpoint not deployed yet)
    childApi.get('/api/battle-pass/my-unlocks')
      .then(res => {
        if (res.data?.claimedLevels?.length > 0) {
          setClaimedRewards(res.data.claimedLevels);
          AsyncStorage.setItem(storageKey, JSON.stringify(res.data.claimedLevels)).catch(() => {});
        }
      })
      .catch(() => {});
  }, [child.id]);

  // Fetch rewards: child API first (7d JWT), fallback to parent API
  const fetchRewards = useCallback(async () => {
    try {
      const res = await childApi.get('/api/rewards/mine');
      if (res.data) { setRewards(res.data); return; }
    } catch {}
    try {
      const res = await parentApi.get('/api/rewards');
      if (res.data) {
        const filtered = res.data.filter((r: any) =>
          !r.childId || r.childId === '' || r.childId === child.id
        );
        setRewards(filtered);
      }
    } catch {}
  }, [child.id]);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  // Keep in sync if parent passes fresh data
  useEffect(() => {
    if (rewardsProp && rewardsProp.length > 0) setRewards(rewardsProp);
  }, [rewardsProp]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRewards();
    if (onRefreshRewards) await onRefreshRewards();
    setRefreshing(false);
  }, [fetchRewards, onRefreshRewards]);

  // Filter rewards by tier — same data from parent dashboard
  const smallGifts = rewards
    .filter((r: any) => r.type === 'small')
    .sort((a: any, b: any) => a.pointsCost - b.pointsCost);
  const mediumGifts = rewards
    .filter((r: any) => r.type === 'medium')
    .sort((a: any, b: any) => a.pointsCost - b.pointsCost);
  const largeGifts = rewards
    .filter((r: any) => r.type === 'large')
    .sort((a: any, b: any) => a.pointsCost - b.pointsCost);
  const hasAnyGifts = rewards.length > 0;

  const battlePassTiers = child.gender === 'boy' ? BOYS_REWARDS : GIRLS_REWARDS;
  const genderColor = child.gender === 'boy' ? '#4facfe' : '#f093fb';

  const handleClaimReward = (tier: RewardTier) => {
    if (!claimedRewards.includes(tier.level) && child.level >= tier.level) {
      SoundManager.playSound('openbox');
      setSelectedReward(tier);
    }
  };

  const confirmClaim = async () => {
    if (!selectedReward || child.level < selectedReward.level) return;
    const tier = selectedReward;
    setSelectedReward(null);

    // 1. Update state immediately
    const newClaimed = [...claimedRewards, tier.level];
    setClaimedRewards(newClaimed);

    // 2. Persist to AsyncStorage (primary store — works offline)
    const storageKey = `@bp_claimed_${child.id}`;
    AsyncStorage.setItem(storageKey, JSON.stringify(newClaimed)).catch(() => {});

    // 3. Handle emoji unlock locally + persist
    if (tier.type === 'emoji') {
      const emojiKey = `@bp_emojis_${child.id}`;
      try {
        const saved = await AsyncStorage.getItem(emojiKey);
        const currentEmojis: string[] = saved ? JSON.parse(saved) : [];
        if (!currentEmojis.includes(tier.emoji)) {
          const newEmojis = [...currentEmojis, tier.emoji];
          await AsyncStorage.setItem(emojiKey, JSON.stringify(newEmojis));
          updateChild({ ...child, unlockedEmojis: newEmojis });
        }
      } catch {}
    }

    // 4. Message reward: save to device queue for parent (same-device scenario)
    if (tier.type === 'message') {
      const queueKey = '@parent_msg_queue';
      try {
        const saved = await AsyncStorage.getItem(queueKey);
        const queue = saved ? JSON.parse(saved) : [];
        if (!queue.find((m: any) => m.data?.level === tier.level)) {
          queue.push({
            id: `${child.id}_${tier.level}_${Date.now()}`,
            title: `رسالة من ${child.name} 💌`,
            body: tier.description,
            data: { category: 'child_message', childName: child.name, level: tier.level },
          });
          await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
        }
      } catch {}
    }

    // 5. Try API sync (fire and forget — no rollback)
    childApi.post('/api/battle-pass/claim', { level: tier.level }).catch(() => {});
  };

  const handleGiftPress = (gift: { id: string; name: string; emoji: string; stars: number; tier: string }) => {
    if (child.stars >= gift.stars) {
      SoundManager.playSound('openbox');
      setSelectedGift(gift);
    }
  };

  const confirmGiftPurchase = async () => {
    if (!selectedGift || child.stars < selectedGift.stars) return;
    const gift = selectedGift;
    setSelectedGift(null);
    SoundManager.playSound('starsspend');
    setPurchasedGifts(prev => ({ ...prev, [gift.id]: Date.now() }));
    try {
      const res = await childApi.post('/api/reward-requests', { rewardId: gift.id });
      const newStars = res.data?.newStars ?? (child.stars - gift.stars);
      updateChildStars(newStars);
      updateChild({ ...child, stars: newStars });
    } catch {
      updateChildStars(child.stars - gift.stars);
      updateChild({ ...child, stars: child.stars - gift.stars });
    }
  };

  const progressPercent = Math.min((child.level / 100) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundContainer}>
        <StarfieldBackground />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>موتيفيتو باس</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Child Stats - من الصفر */}
      <View style={{ marginHorizontal: 16, marginVertical: 12 }}>
        <View style={{ backgroundColor: '#1a3a52', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', height: 70 }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#b0c4de', fontSize: 12 }}>النجوم</Text>
              <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{child.stars}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#ffffff33', marginVertical: 10 }} />
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#b0c4de', fontSize: 12 }}>التقدم</Text>
              <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{Math.min(child.level, 100)}%</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#ffffff33', marginVertical: 10 }} />
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#b0c4de', fontSize: 12 }}>المستوى</Text>
              <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{child.level}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main progress bar */}
      <View style={styles.mainProgressContainer}>
        <View style={styles.progressLineContainer}>
          <View
            style={[
              styles.progressLine,
              {
                backgroundColor: genderColor,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.min(child.level, 100)} / 100</Text>
      </View>

      {/* Main content area — scrollable with pull-to-refresh */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
      >
        {/* Battle Pass Rewards Scroll — المسار العلوي (مقفل بدون اشتراك) */}
        <View style={{ position: 'relative' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
            style={{ maxHeight: 200 }}
            scrollEnabled={isPremium}
          >
            <View style={styles.rewardsContainer}>
              {battlePassTiers.map((tier, index) => {
                const isUnlocked = isPremium && child.level >= tier.level;
                const isClaimed = isPremium && claimedRewards.includes(tier.level);
                let progress = 0;

                if (isPremium && !isUnlocked) {
                  const prevTierLevel = index > 0 ? battlePassTiers[index - 1].level : 0;
                  const levelDiff = tier.level - prevTierLevel;
                  const currentProgress = child.level - prevTierLevel;
                  progress = (currentProgress / levelDiff) * 100;
                }

                return (
                  <View key={tier.level} style={styles.rewardItemContainer}>
                    <RewardBox
                      tier={tier}
                      isUnlocked={isUnlocked && !isClaimed}
                      isClaimed={isClaimed}
                      progress={progress}
                      onPress={() => isPremium && handleClaimReward(tier)}
                      genderColor={genderColor}
                    />
                    {index < battlePassTiers.length - 1 && (
                      <View
                        style={[
                          styles.connector,
                          { backgroundColor: isUnlocked ? '#FFD700' : '#333333' },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Overlay حجب المسار العلوي */}
          {!isPremium && (
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(10,14,39,0.88)',
              justifyContent: 'center', alignItems: 'center',
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🔒</Text>
              <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                المسار المميز
              </Text>
              <Text style={{ color: '#b0c4de', fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: 24 }}>
                اشترك في موتيفيتو بـ ﷼14.99/شهر لفتح المسار
              </Text>
            </View>
          )}
        </View>

        {/* Parent Gifts Row — from DB */}
        {hasAnyGifts ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              {/* Small (green) */}
              {smallGifts.map((gift: any, index: number) => (
                <React.Fragment key={`small-${gift.id}`}>
                  <View style={{ marginHorizontal: 2 }}>
                    <ParentGiftCard
                      name={gift.name}
                      emoji={gift.emoji}
                      stars={gift.pointsCost}
                      tier="small"
                      canAfford={child.stars >= gift.pointsCost}
                      onPress={() => handleGiftPress({ id: gift.id, name: gift.name, emoji: gift.emoji, stars: gift.pointsCost, tier: 'small' })}
                      purchasedAt={purchasedGifts[gift.id]}
                    />
                  </View>
                  {index < smallGifts.length - 1 && <View style={{ width: 8, marginHorizontal: 2 }} />}
                </React.Fragment>
              ))}
              {smallGifts.length > 0 && mediumGifts.length > 0 && <View style={{ width: 28, marginHorizontal: 2 }} />}
              {/* Medium (blue) */}
              {mediumGifts.map((gift: any, index: number) => (
                <React.Fragment key={`medium-${gift.id}`}>
                  <View style={{ marginHorizontal: 2 }}>
                    <ParentGiftCard
                      name={gift.name}
                      emoji={gift.emoji}
                      stars={gift.pointsCost}
                      tier="medium"
                      canAfford={child.stars >= gift.pointsCost}
                      onPress={() => handleGiftPress({ id: gift.id, name: gift.name, emoji: gift.emoji, stars: gift.pointsCost, tier: 'medium' })}
                      purchasedAt={purchasedGifts[gift.id]}
                    />
                  </View>
                  {index < mediumGifts.length - 1 && <View style={{ width: 8, marginHorizontal: 2 }} />}
                </React.Fragment>
              ))}
              {mediumGifts.length > 0 && largeGifts.length > 0 && <View style={{ width: 28, marginHorizontal: 2 }} />}
              {/* Large (gold) */}
              {largeGifts.map((gift: any, index: number) => (
                <React.Fragment key={`large-${gift.id}`}>
                  <View style={{ marginHorizontal: 2 }}>
                    <ParentGiftCard
                      name={gift.name}
                      emoji={gift.emoji}
                      stars={gift.pointsCost}
                      tier="large"
                      canAfford={child.stars >= gift.pointsCost}
                      onPress={() => handleGiftPress({ id: gift.id, name: gift.name, emoji: gift.emoji, stars: gift.pointsCost, tier: 'large' })}
                      purchasedAt={purchasedGifts[gift.id]}
                    />
                  </View>
                  {index < largeGifts.length - 1 && <View style={{ width: 8, marginHorizontal: 2 }} />}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#b0c4de', fontSize: 13, textAlign: 'center' }}>لم يُضف والدك أي هدايا بعد 🎁</Text>
          </View>
        )}

      </ScrollView>

      {/* Info Card — ثابتة في الأسفل */}
      <View style={{ alignItems: 'center', paddingBottom: 12, paddingTop: 6 }}>
        <View style={{ backgroundColor: '#0d1b2a', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: 'bold' }}>💡</Text>
          <Text style={{ color: '#b0c4de', fontSize: 12 }}>أكمل المهام اليومية لكسب المزيد من النجوم!</Text>
        </View>
      </View>

      {/* Reward Modal - الحل السحري */}
      <AppModal visible={selectedReward !== null} transparent={true} animationType="slide" presentationStyle="overFullScreen">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setSelectedReward(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{
              backgroundColor: '#1a1a3e',
              width: 300,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 64, marginBottom: 16 }}>{selectedReward?.emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 8, textAlign: 'center' }}>{selectedReward?.title}</Text>

              {(selectedReward?.type === 'voucher' || selectedReward?.type === 'mystery') ? (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFD700', textAlign: 'center' }}>قريبًا</Text>
                  <Text style={{ fontSize: 12, color: '#b0c4de', textAlign: 'center', marginTop: 6 }}>نحن نعمل على توفير هذه المكافأة قريبًا!</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 14, color: '#FFFFFF', textAlign: 'center', marginBottom: 16, lineHeight: 20 }}>{selectedReward?.description}</Text>
              )}

              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#333333', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#666666' }}
                  onPress={() => setSelectedReward(null)}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: (selectedReward?.type === 'voucher' || selectedReward?.type === 'mystery') ? '#555555' : '#FFD700', paddingVertical: 12, borderRadius: 8 }}
                  onPress={(selectedReward?.type === 'voucher' || selectedReward?.type === 'mystery') ? undefined : confirmClaim}
                  disabled={selectedReward?.type === 'voucher' || selectedReward?.type === 'mystery'}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: (selectedReward?.type === 'voucher' || selectedReward?.type === 'mystery') ? '#999999' : '#000000', textAlign: 'center' }}>استلام</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </AppModal>

      {/* Gift Purchase Modal - الحل السحري */}
      <AppModal visible={selectedGift !== null} transparent={true} animationType="slide" presentationStyle="overFullScreen">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setSelectedGift(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{
              backgroundColor: '#1a1a3e',
              width: 300,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 64, marginBottom: 16 }}>{selectedGift?.emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 8, textAlign: 'center' }}>{selectedGift?.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, gap: 8, marginBottom: 24 }}>
                <StarIcon />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700' }}>{selectedGift?.stars}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#333333', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#666666' }}
                  onPress={() => setSelectedGift(null)}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#FFD700', paddingVertical: 12, borderRadius: 8 }}
                  onPress={confirmGiftPurchase}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#000000', textAlign: 'center' }}>شراء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statsCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    zIndex: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#b0c4de',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  mainProgressContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    zIndex: 10,
  },
  progressLineContainer: {
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressLine: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#b0c4de',
    textAlign: 'right',
  },
  scrollView: {
    zIndex: 5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardBox: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  rewardGradient: {
    width: 120,
    height: 144,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    position: 'relative',
  },
  rewardEmoji: {
    fontSize: 52,
    marginBottom: 6,
  },
  rewardLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  rewardTitle: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 120,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
  },
  flameContainer: {
    position: 'absolute',
    top: -12,
    right: -8,
  },
  lockIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  checkmarkIcon: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  claimedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 9,
    zIndex: 1,
  },
  connector: {
    width: 28,
    height: 3,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#b0c4de',
    lineHeight: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  modalContent: {
    width: '70%',
    maxWidth: 280,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  mysteryOptions: {
    width: '100%',
    marginBottom: 16,
  },
  mysteryLabel: {
    fontSize: 12,
    color: '#b0c4de',
    marginBottom: 8,
    fontWeight: '600',
  },
  optionButton: {
    backgroundColor: '#1a3a52',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4facfe',
  },
  optionText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#666666',
  },
  confirmButton: {
    backgroundColor: '#FFD700',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 50,
  },
  // Parent Gifts Styles
  giftsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftCard: {
    alignItems: 'center',
  },
  giftCardGradient: {
    width: 120,
    height: 144,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    padding: 8,
    position: 'relative',
  },
  giftEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  giftName: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 14,
  },
  giftStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  giftStarsNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  giftLockIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  giftModalStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
  },
  giftModalStarsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
});
