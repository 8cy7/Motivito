import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Animated,
  Image,
} from 'react-native';
import { AppModal } from '../../components/AppModal';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import Svg, { Path } from 'react-native-svg';
import { useChildren, Reward as RewardType } from '../../contexts/ChildrenContext';
import { Child } from '../../types';
import { SUGGESTED_REWARDS, SuggestedReward } from '../../constants/suggestedRewards';
import { MotivitoLogo } from '../../components/MotivitoLogo';

const { width, height } = Dimensions.get('window');

// Close Icon
const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="#FF0000"
    />
  </Svg>
);

// Gift Icon
const GiftIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24">
    <Path
      d="M20 6H17.82C17.93 5.69 18 5.35 18 5C18 3.34 16.66 2 15 2C13.95 2 13.04 2.54 12.5 3.35L12 4.02L11.5 3.34C10.96 2.54 10.05 2 9 2C7.34 2 6 3.34 6 5C6 5.35 6.07 5.69 6.18 6H4C2.9 6 2.01 6.9 2.01 8L2 19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM15 4C15.55 4 16 4.45 16 5C16 5.55 15.55 6 15 6C14.45 6 14 5.55 14 5C14 4.45 14.45 4 15 4ZM9 4C9.55 4 10 4.45 10 5C10 5.55 9.55 6 9 6C8.45 6 8 5.55 8 5C8 4.45 8.45 4 9 4ZM20 19H4V8H11V10H13V8H20V19ZM13 11H11V19H13V11Z"
      fill="#FFFFFF"
    />
  </Svg>
);

// Add Button Icon
const AddIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
      fill="#FFFFFF"
    />
  </Svg>
);

// AI Assistant Icon (Robot/Sparkles)
const AiAssistantIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      fill="#FFD700"
    />
    <Path
      d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
      fill="#FFD700"
    />
    <Path
      d="M9 13.5c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm6 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"
      fill="#FFD700"
    />
    <Path
      d="M12 15c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"
      fill="#FFD700"
    />
  </Svg>
);

// Emoji list - متنوعة ومختصرة
const EMOJI_LIST = [
  '🎮', '🎯', '🏆', '⚽', '🏀', '🎾', '🏐', '⚾',
  '🎨', '🖍️', '✏️', '📚', '📖', '📝',
  '🎵', '🎸', '🎹', '🎤', '🎧', '🎬',
  '🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🎂', '🍰', '🍦', '🍫', '🍩', '🧃',
  '⭐', '🌟', '✨', '💫', '🔥', '⚡', '💎', '👑', '🏅', '🥇',
  '🎁', '🎈', '🎉', '🎊', '🎀',
  '🚗', '🚙', '🏎️', '🚓', '🚑', '🚒',
  '✈️', '🚁', '🚀', '🚢', '⛵',
  '🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁',
  '🎲', '🧩', '🎱', '🕹️', '🧸', '🪁',
  '💻', '📱', '🖥️', '⌨️', '📺', '⏰'
];

// Helper function to get gender colors
const getGenderColors = (gender: 'boy' | 'girl') => {
  if (gender === 'boy') {
    return {
      primary: ['#4A90E2', '#357ABD'],
      light: '#4A90E2',
      dark: '#357ABD',
    };
  } else {
    return {
      primary: ['#FF69B4', '#E91E8C'],
      light: '#FF69B4',
      dark: '#E91E8C',
    };
  }
};

export const RewardsScreen = () => {
  const { children, rewards, addReward, deleteReward } = useChildren();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'small' | 'medium' | 'large'>('small');
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState(false);

  // تحديث الـ index عند تغير عدد الأطفال
  useEffect(() => {
    if (selectedChildIndex >= children.length && children.length > 0) {
      setSelectedChildIndex(children.length - 1);
    }
  }, [children.length, selectedChildIndex]);

  // أنيميشن الكرت (سلايد + سكَيْل + فِيد + ميلان)
  const cardSlide = useRef(new Animated.Value(0)).current;   // + يمين / - يسار
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // التأكد من وجود أطفال
  if (children.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#7241c6', '#5c34a3', '#7241c6']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 60 }}>
          <Text style={{ fontSize: 64, marginBottom: 20 }}>🎁</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>
            لا يوجد أطفال بعد!
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
            أضف طفلاً أولاً من الشاشة الرئيسية لتتمكن من تخصيص الجوائز له
          </Text>
        </View>
      </View>
    );
  }

  // التأكد من أن الـ index صحيح
  const validIndex = Math.min(selectedChildIndex, children.length - 1);
  const selectedChild = children[validIndex];
  const childColors = getGenderColors(selectedChild.gender);

  const cardRotate = cardSlide.interpolate({
    inputRange: [-80, 0, 80],
    outputRange: ['8deg', '0deg', '-8deg'],
  });

  const handleChildChange = (direction: -1 | 1) => {
    if (isAnimating) return;

    let actualIndex = selectedChildIndex + direction;
    if (actualIndex < 0) actualIndex = children.length - 1;
    if (actualIndex >= children.length) actualIndex = 0;

    const slideOutTo = -direction * 80; // يطلع عكس اتجاه الحركة
    const slideInFrom = direction * 80; // يدخل من نفس جهة السهم

    setIsAnimating(true);

    // المرحلة الأولى: خروج الكرت الحالي
    Animated.parallel([
      Animated.timing(cardSlide, {
        toValue: slideOutTo,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // غيّر الطفل
      setSelectedChildIndex(actualIndex);

      // حضّر قيم الدخول للكرت الجديد
      cardSlide.setValue(slideInFrom);
      cardScale.setValue(0.9);
      cardOpacity.setValue(0);

      // المرحلة الثانية: دخول الكرت الجديد بحركة خفيفة
      Animated.parallel([
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };


  const handleAddReward = (type: 'small' | 'medium' | 'large') => {
    setSelectedType(type);
    setShowAddModal(true);
  };

  const handleSubmitReward = (reward: {
    name: string;
    emoji: string;
    points: number;
  }) => {
    const newReward: RewardType = {
      id: Date.now().toString(),
      name: reward.name,
      emoji: reward.emoji,
      points: reward.points,
      type: selectedType,
      childId: selectedChild.id,
      childName: selectedChild.name,
      childAvatar: selectedChild.avatar,
    };
    addReward(newReward);
    setShowAddModal(false);
  };

  const handleDeleteReward = (id: string) => {
    deleteReward(id);
  };

  const getRewardsByType = (type: 'small' | 'medium' | 'large') => {
    return rewards.filter(r => r.type === type && r.childId === selectedChild.id);
  };

  return (
    <View style={styles.container}>
      {/* Background */}
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
      >
        {/* Child "Carousel" مع أنيميشن خفيف */}
        <View style={styles.carouselSection}>
          {/* Right Arrow - خارج البطاقة */}
          {children.length > 1 && (
            <TouchableOpacity
              style={[styles.arrowButton, styles.arrowRight]}
              onPress={() => handleChildChange(-1)}
              disabled={isAnimating}
              activeOpacity={0.7}
            >
              <View
                style={[styles.arrowGradient, { backgroundColor: '#667eea' }]}
              >
                <Text style={styles.arrowText}>‹</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.carouselWrapper}>
            {/* Animated Card */}
            <Animated.View
              style={[
                styles.cardWrapper,
                {
                  transform: [
                    { translateX: cardSlide },
                    { scale: cardScale },
                    { rotateZ: cardRotate },
                  ],
                  opacity: cardOpacity,
                },
              ]}
            >
              <View style={styles.cardContainer}>
                <View style={styles.cardTouchable}>
                  {/* Golden Frame */}
                  <View style={styles.goldenFrame}>
                    <View
                      style={[styles.goldenFrameGradient, { backgroundColor: '#FFD700' }]}
                    >
                      {/* Inner Card */}
                      <View style={styles.cardInner}>
                        <View
                          style={[
                            styles.cardGradient,
                            { backgroundColor: childColors.light },
                          ]}
                        >
                          {/* Shimmer */}
                          <View style={styles.shimmerOverlay} />

                          {/* Avatar */}
                          <View style={styles.avatarContainer}>
                            <View style={styles.avatarGlow}>
                              <View
                                style={{
                                  width: 70,
                                  height: 70,
                                  borderRadius: 35,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  backgroundColor: selectedChild.isAvatarImage ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                                  borderWidth: 2,
                                  borderColor: '#000',
                                  overflow: 'hidden',
                                }}
                              >
                                {selectedChild.isAvatarImage ? (
                                  <Image
                                    source={{ uri: selectedChild.avatar }}
                                    style={{ width: 66, height: 66, borderRadius: 33 }}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <Text style={styles.avatarText}>{selectedChild.avatar}</Text>
                                )}
                              </View>
                            </View>
                          </View>

                          {/* Name */}
                          <Text style={styles.cardName}>{selectedChild.name}</Text>

                          {/* Points Badge */}
                          <View style={styles.pointsBadgeContainer}>
                            <View
                              style={[styles.pointsBadge, { backgroundColor: '#FFD700' }]}
                            >
                              <Text style={styles.pointsIcon}>⭐</Text>
                              <Text style={styles.pointsText}>{selectedChild.stars}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Left Arrow - خارج البطاقة */}
          {children.length > 1 && (
            <TouchableOpacity
              style={[styles.arrowButton, styles.arrowLeft]}
              onPress={() => handleChildChange(1)}
              disabled={isAnimating}
              activeOpacity={0.7}
            >
              <View
                style={[styles.arrowGradient, { backgroundColor: '#667eea' }]}
              >
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {children.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === validIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Text */}
        <Text style={styles.customizeText}>
          خصص لـ <Text style={styles.customizeTextName}>{selectedChild.name}</Text> الهدايا المناسبة
        </Text>

        {/* AI Assistant Button */}
        <View style={styles.aiAssistantButton}>
          <AiAssistantButton onPress={() => setShowAiAssistantModal(true)} />
        </View>

        {/* Small Rewards Section */}
        <RewardSection
          key={`small-${selectedChild.id}`}
          title="هدايا صغيرة"
          emoji="🎈"
          baseColor="#4ADE80"
          addButtonColor="rgba(74, 222, 128, 0.3)"
          cardColor="#4ADE80"
          rewards={getRewardsByType('small')}
          onAddPress={() => handleAddReward('small')}
          onDeleteReward={handleDeleteReward}
        />

        {/* Medium Rewards Section */}
        <RewardSection
          key={`medium-${selectedChild.id}`}
          title="هدايا متوسطة"
          emoji="🎁"
          baseColor="#3B82F6"
          addButtonColor="rgba(59, 130, 246, 0.3)"
          cardColor="#3B82F6"
          rewards={getRewardsByType('medium')}
          onAddPress={() => handleAddReward('medium')}
          onDeleteReward={handleDeleteReward}
        />

        {/* Large Rewards Section */}
        <RewardSection
          key={`large-${selectedChild.id}`}
          title="هدايا كبيرة"
          emoji="🏆"
          baseColor="#FFD700"
          addButtonColor="rgba(255, 215, 0, 0.3)"
          cardColor="#FFD700"
          rewards={getRewardsByType('large')}
          onAddPress={() => handleAddReward('large')}
          onDeleteReward={handleDeleteReward}
        />
      </ScrollView>

      <AddRewardModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitReward}
        type={selectedType}
        selectedChild={selectedChild}
      />

      <AiAssistantModal
        visible={showAiAssistantModal}
        onClose={() => setShowAiAssistantModal(false)}
        selectedChild={selectedChild}
        onAddRewards={(selectedRewards) => {
          // إضافة الجوائز المختارة
          selectedRewards.forEach(reward => {
            const newReward: RewardType = {
              id: Date.now().toString() + Math.random(),
              name: reward.name,
              emoji: reward.emoji,
              points: reward.stars,
              type: reward.type,
              childId: selectedChild.id,
              childName: selectedChild.name,
              childAvatar: selectedChild.avatar,
            };
            addReward(newReward);
          });
          setShowAiAssistantModal(false);
        }}
      />
    </View>
  );
};

// مكون زر المساعد الذكي بنفس تصميم إضافة مهمة
const AiAssistantButton = ({ onPress }: { onPress: () => void }) => {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-(width - 40) - 50, (width - 40) + 50],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.aiAssistantButtonCard}
    >
      <View style={styles.aiAssistantButtonContent}>
        <Text style={styles.aiAssistantButtonText}>مساعد الجوائز الذكي</Text>
        <View style={styles.aiAssistantLogoContainer}>
          <MotivitoLogo size={50} />
        </View>
      </View>

      {/* الشريط العمودي المتحرك */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sweepBar,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

// Reward Section Component
interface RewardSectionProps {
  title: string;
  emoji: string;
  baseColor: string;
  addButtonColor: string;
  cardColor: string;
  rewards: RewardType[];
  onAddPress: () => void;
  onDeleteReward: (id: string) => void;
}

const RewardSection: React.FC<RewardSectionProps> = ({
  title,
  emoji,
  baseColor,
  addButtonColor,
  cardColor,
  rewards,
  onAddPress,
  onDeleteReward,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={styles.sectionLine} />
          <Text style={[styles.sectionTitle, { color: baseColor }]}>{title}</Text>
          <Text style={styles.sectionEmoji}>{emoji}</Text>
          <View style={styles.sectionLine} />
        </View>
      </View>

      <View style={styles.cardsWrapperRewards}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rewardsContainer}
        >
          {/* الجوائز */}
          {rewards.map((reward, index) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              color={cardColor}
              index={index}
              onDelete={onDeleteReward}
            />
          ))}

          {/* كرت الإضافة (ثابت يمين) */}
          <View style={styles.addButtonWrapper}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddPress}
              activeOpacity={0.8}
            >
              <View style={[styles.addButtonGradient, { backgroundColor: addButtonColor }]}>
                <AddIcon />
                <Text style={styles.addButtonText}>إضافة جائزة</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// Animated Reward Card Component
interface RewardCardProps {
  reward: RewardType;
  color: string;
  index: number;
  onDelete: (id: string) => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, color, index, onDelete }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        delay: index * 100,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        delay: index * 100,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.rewardCardWrapper,
        {
          opacity: animatedValue,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <View style={styles.rewardCard}>
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowOpacity,
              shadowColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.rewardCardGradient,
            { backgroundColor: color, overflow: 'hidden' },
          ]}
        >
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(reward.id)}
            activeOpacity={0.8}
          >
            <View
              style={[styles.deleteButtonGradient, { backgroundColor: '#FF4444', overflow: 'hidden' }]}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.rewardContent}>
            <View style={styles.rewardIconContainer}>
              <Text style={styles.rewardIcon}>{reward.emoji}</Text>
            </View>

            <Text style={styles.rewardName} numberOfLines={2}>
              {reward.name}
            </Text>

            <View style={styles.pointsBadgeReward}>
              <View style={styles.pointsBadgeContent}>
                <Text style={styles.pointsBadgeIcon}>⭐</Text>
                <Text style={styles.pointsBadgeValue}>{reward.points}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Add Reward Modal Component
interface AddRewardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reward: {
    name: string;
    emoji: string;
    points: number;
  }) => void;
  type: 'small' | 'medium' | 'large';
  selectedChild: Child;
}

const AddRewardModal: React.FC<AddRewardModalProps> = ({
  visible,
  onClose,
  onSubmit,
  type,
  selectedChild,
}) => {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎁');
  const [points, setPoints] = useState(0);

  const getPointsRange = () => {
    switch (type) {
      case 'small':
        return { min: 5, max: 100, step: 5 };
      case 'medium':
        return { min: 100, max: 500, step: 25 };
      case 'large':
        return { min: 500, max: 1500, step: 50 };
    }
  };

  const getColor = () => {
    switch (type) {
      case 'small':
        return '#4ADE80';
      case 'medium':
        return '#3B82F6';
      case 'large':
        return '#FFD700';
    }
  };

  const getTitleText = () => {
    switch (type) {
      case 'small':
        return 'هدية صغيرة';
      case 'medium':
        return 'هدية متوسطة';
      case 'large':
        return 'هدية كبيرة';
    }
  };

  const range = getPointsRange();
  const color = getColor();

  useEffect(() => {
    if (visible) {
      setName('');
      setSelectedEmoji('🎁');
      setPoints(range.min);
    }
  }, [visible, type]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      emoji: selectedEmoji,
      points,
    });
    onClose();
  };

  return (
    <AppModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#7241c6', '#5c34a3', '#7241c6']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View
                  style={[styles.modalIconContainer, { backgroundColor: color, overflow: 'hidden' }]}
                >
                  <GiftIcon />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    إضافة {getTitleText()} لـ <Text style={{ color: selectedChild.gender === 'boy' ? '#4A90E2' : '#FF69B4' }}>{selectedChild.name}</Text>
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {range.min}-{range.max} نقطة
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>اسم الهدية</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="مثال: لعبة جديدة"
                    placeholderTextColor="#999999"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>اختر الأيقونة</Text>
                <ScrollView
                  style={styles.emojiGrid}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  scrollEnabled
                >
                  <View style={styles.emojiGridContent}>
                    {EMOJI_LIST.map((emoji, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.emojiOption,
                          selectedEmoji === emoji && {
                            backgroundColor: color,
                            borderColor: color,
                          },
                        ]}
                        onPress={() => setSelectedEmoji(emoji)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.emojiOptionText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>النقاط المطلوبة</Text>
                <View style={styles.sliderOuterContainer}>
                  <Text style={[styles.pointsValueDisplay, { color }]}>⭐ {points}</Text>
                  <View style={styles.sliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={range.min}
                      maximumValue={range.max}
                      step={range.step}
                      value={points}
                      onValueChange={setPoints}
                      minimumTrackTintColor={color}
                      maximumTrackTintColor="rgba(0,0,0,0.1)"
                      thumbTintColor={color}
                    />
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>{range.min}</Text>
                    <Text style={styles.sliderLabel}>{range.max}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                style={styles.submitButton}
                activeOpacity={0.8}
                disabled={!name.trim()}
              >
                <View
                  style={[
                    styles.submitGradient,
                    {
                      backgroundColor: name.trim() ? '#4A90E2' : '#999999',
                      overflow: 'hidden',
                    },
                  ]}
                >
                  <Text style={styles.submitText}>إضافة الهدية ✓</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </AppModal>
  );
};

// AI Assistant Modal Component
interface AiAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  selectedChild: Child;
  onAddRewards: (rewards: Array<{ name: string; stars: number; emoji: string; type: 'small' | 'medium' | 'large' }>) => void;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  visible,
  onClose,
  selectedChild,
  onAddRewards,
}) => {
  const [selectedSmall, setSelectedSmall] = useState<Set<number>>(new Set());
  const [selectedMedium, setSelectedMedium] = useState<Set<number>>(new Set());
  const [selectedLarge, setSelectedLarge] = useState<Set<number>>(new Set());

  const gender = selectedChild.gender === 'boy' ? 'boys' : 'girls';
  const suggestions = SUGGESTED_REWARDS[gender];

  const toggleSelection = (
    index: number,
    type: 'small' | 'medium' | 'large',
    selectedSet: Set<number>,
    setSelected: (set: Set<number>) => void
  ) => {
    const newSet = new Set(selectedSet);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      if (newSet.size < 5) {
        newSet.add(index);
      }
    }
    setSelected(newSet);
  };

  const handleSubmit = () => {
    const selectedRewards: Array<{ name: string; stars: number; emoji: string; type: 'small' | 'medium' | 'large' }> = [];

    selectedSmall.forEach(index => {
      selectedRewards.push({
        name: suggestions.small[index].name,
        stars: suggestions.small[index].stars,
        emoji: suggestions.small[index].emoji,
        type: 'small',
      });
    });

    selectedMedium.forEach(index => {
      selectedRewards.push({
        name: suggestions.medium[index].name,
        stars: suggestions.medium[index].stars,
        emoji: suggestions.medium[index].emoji,
        type: 'medium',
      });
    });

    selectedLarge.forEach(index => {
      selectedRewards.push({
        name: suggestions.large[index].name,
        stars: suggestions.large[index].stars,
        emoji: suggestions.large[index].emoji,
        type: 'large',
      });
    });

    onAddRewards(selectedRewards);

    // Reset selections
    setSelectedSmall(new Set());
    setSelectedMedium(new Set());
    setSelectedLarge(new Set());
  };

  const totalSelected = selectedSmall.size + selectedMedium.size + selectedLarge.size;

  return (
    <AppModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalContainer, { maxHeight: height * 0.95 }]}>
          <LinearGradient
            colors={['#7241c6', '#5c34a3', '#7241c6']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.modalContent, { maxHeight: height * 0.95 }]}
          >
            {/* Header */}
            <View style={styles.aiModalHeader}>
              <View style={styles.aiModalHeaderContent}>
                <View style={styles.aiModalLogoContainer}>
                  <MotivitoLogo size={50} />
                </View>
                <View style={styles.aiModalTextContainer}>
                  <Text style={styles.aiModalTitle}>
                    مساعد الجوائز الذكي
                  </Text>
                  <Text style={[
                    styles.aiModalChildName,
                    { color: selectedChild.gender === 'boy' ? '#4A90E2' : '#FF69B4' }
                  ]}>
                    لـ {selectedChild.name}
                  </Text>
                  <Text style={styles.aiModalCounter}>
                    المختارة: {totalSelected} / 15
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.aiModalScrollContent}
            >
              {/* Small Rewards Section */}
              <View style={styles.aiSection}>
                <View style={styles.aiSectionTitleContainer}>
                  <Text style={styles.aiSectionTitle}>هدايا صغيرة</Text>
                  <Text style={styles.aiSectionEmoji}>🎈</Text>
                  <Text style={styles.aiSectionCounter}>({selectedSmall.size}/5)</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.aiRewardsScrollContainer}
                >
                  {suggestions.small.map((reward, index) => (
                    <SuggestedRewardCard
                      key={index}
                      reward={reward}
                      isSelected={selectedSmall.has(index)}
                      onPress={() =>
                        toggleSelection(index, 'small', selectedSmall, setSelectedSmall)
                      }
                      color="#4ADE80"
                    />
                  ))}
                </ScrollView>
                <View style={styles.aiSectionDivider} />
              </View>

              {/* Medium Rewards Section */}
              <View style={styles.aiSection}>
                <View style={styles.aiSectionTitleContainer}>
                  <Text style={styles.aiSectionTitle}>هدايا متوسطة</Text>
                  <Text style={styles.aiSectionEmoji}>🎁</Text>
                  <Text style={styles.aiSectionCounter}>({selectedMedium.size}/5)</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.aiRewardsScrollContainer}
                >
                  {suggestions.medium.map((reward, index) => (
                    <SuggestedRewardCard
                      key={index}
                      reward={reward}
                      isSelected={selectedMedium.has(index)}
                      onPress={() =>
                        toggleSelection(index, 'medium', selectedMedium, setSelectedMedium)
                      }
                      color="#3B82F6"
                    />
                  ))}
                </ScrollView>
                <View style={styles.aiSectionDivider} />
              </View>

              {/* Large Rewards Section */}
              <View style={styles.aiSection}>
                <View style={styles.aiSectionTitleContainer}>
                  <Text style={styles.aiSectionTitle}>هدايا كبيرة</Text>
                  <Text style={styles.aiSectionEmoji}>🏆</Text>
                  <Text style={styles.aiSectionCounter}>({selectedLarge.size}/5)</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.aiRewardsScrollContainer}
                >
                  {suggestions.large.map((reward, index) => (
                    <SuggestedRewardCard
                      key={index}
                      reward={reward}
                      isSelected={selectedLarge.has(index)}
                      onPress={() =>
                        toggleSelection(index, 'large', selectedLarge, setSelectedLarge)
                      }
                      color="#FFD700"
                    />
                  ))}
                </ScrollView>
                <View style={styles.aiSectionDivider} />
              </View>
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.aiSubmitButton}
              activeOpacity={0.8}
              disabled={totalSelected === 0}
            >
              <View
                style={[
                  styles.aiSubmitGradient,
                  totalSelected > 0
                    ? { backgroundColor: '#667eea' }
                    : { backgroundColor: '#999' },
                ]}
              >
                <Text style={styles.aiSubmitText}>
                  إضافة {totalSelected} جائزة ✓
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </AppModal>
  );
};

// Suggested Reward Card Component
interface SuggestedRewardCardProps {
  reward: SuggestedReward;
  isSelected: boolean;
  onPress: () => void;
  color: string;
}

const SuggestedRewardCard: React.FC<SuggestedRewardCardProps> = ({
  reward,
  isSelected,
  onPress,
  color,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.suggestedRewardCard,
        { backgroundColor: color },
        isSelected && {
          borderColor: '#000',
          borderWidth: 4,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.suggestedRewardGradient}>
        {isSelected && (
          <View style={styles.checkmarkBadge}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
        <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
        <Text style={styles.suggestedRewardName} numberOfLines={2}>
          {reward.name}
        </Text>
        <View style={styles.suggestedRewardStars}>
          <Text style={styles.suggestedRewardStarIcon}>⭐</Text>
          <Text style={styles.suggestedRewardStarValue}>{reward.stars}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 65,
    paddingBottom: 60,
  },
  titleBar: {
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  titleBarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Carousel Styles
  carouselSection: {
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  carouselWrapper: {
    flex: 1,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  arrowGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  arrowLeft: {
    marginLeft: 0,
  },
  arrowRight: {
    marginRight: 0,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  carouselContent: {
    paddingHorizontal: (width - 200) / 2,
    gap: 20,
  },
  cardWrapper: {
    width: 200,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: 200,
    height: 240,
  },
  cardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  goldenFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 15,
  },
  goldenFrameGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 3,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    overflow: 'hidden',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatarGlow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  avatarText: {
    fontSize: 36,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pointsBadgeContainer: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    gap: 6,
  },
  pointsIcon: {
    fontSize: 18,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // Wooden Back Styles (لو حبيت تستخدمها لاحقًا)
  woodenBack: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FFD700',
    position: 'relative',
  },
  woodGrain1: {
    position: 'absolute',
    top: '20%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 1,
  },
  woodGrain2: {
    position: 'absolute',
    top: '50%',
    left: 15,
    right: 15,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 1.5,
  },
  woodGrain3: {
    position: 'absolute',
    top: '70%',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 1,
  },
  goldCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  goldCornerTL: {
    top: 8,
    left: 8,
  },
  goldCornerTR: {
    top: 8,
    right: 8,
  },
  goldCornerBL: {
    bottom: 8,
    left: 8,
  },
  goldCornerBR: {
    bottom: 8,
    right: 8,
  },
  // Dots Indicator
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 3,
    marginBottom: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    width: 30,
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  // Customize Text
  customizeText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 5,
  },
  customizeTextName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
  },
  // AI Assistant Button Styles (بنفس تصميم زر إضافة مهمة)
  aiAssistantButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  aiAssistantButtonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
  },
  aiAssistantButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiAssistantButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiAssistantLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // شريط اللمعة
  sweepBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 6,
    transform: [{ skewX: '-18deg' }],
  },
  // Section Styles
  section: {
    marginBottom: 8,
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  sectionTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#000000',
  },
  sectionEmoji: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    paddingHorizontal: 8,
  },
  cardsWrapperRewards: {
    minHeight: 150,
  },
  rewardsContainer: {
    paddingHorizontal: 20,
    gap: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexGrow: 1,
  },
  addButtonWrapper: {
    marginRight: 0,
  },
  addButton: {
    width: 121,
    height: 134,
    borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  rewardCardWrapper: {
    position: 'relative',
  },
  rewardCard: {
    width: 121,
    height: 134,
    borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },
  glowEffect: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  rewardCardGradient: {
    flex: 1,
    padding: 11,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 21,
    height: 21,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000000',
    zIndex: 10,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  deleteButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '900',
    marginTop: -2,
  },
  rewardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardIconContainer: {
    marginBottom: 8,
  },
  rewardIcon: {
    fontSize: 32,
  },
  rewardName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pointsBadgeReward: {
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pointsBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsBadgeIcon: {
    fontSize: 11,
  },
  pointsBadgeValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxHeight: height * 0.9,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#000000',
  },
  modalContent: {
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 15,
  },
  modalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'right',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    padding: 25,
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'right',
  },
  inputContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
    textAlign: 'right',
  },
  emojiGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#000000',
    padding: 8,
    maxHeight: 280,
  },
  emojiGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingBottom: 20,
  },
  emojiOption: {
    width: (width - 110) / 8,
    height: (width - 110) / 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#CCCCCC',
  },
  emojiOptionText: {
    fontSize: 22,
  },
  sliderOuterContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  sliderContainer: {
    marginVertical: 8,
  },
  pointsValueDisplay: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  submitButton: {
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#000000',
    overflow: 'hidden',
    marginTop: 10,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // AI Assistant Modal Styles
  aiModalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  aiModalHeaderContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  aiModalLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  aiModalTextContainer: {
    flex: 1,
  },
  aiModalTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiModalRobotEmoji: {
    fontSize: 20,
  },
  aiModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  aiModalChildName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginVertical: 3,
  },
  aiModalCounter: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'right',
  },
  aiModalScrollContent: {
    paddingVertical: 20,
  },
  aiSection: {
    marginBottom: 10,
  },
  aiSectionTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  aiSectionEmoji: {
    fontSize: 20,
  },
  aiSectionCounter: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiSectionDivider: {
    height: 2,
    backgroundColor: '#000',
    marginHorizontal: 0,
    marginTop: 25,
  },
  aiRewardsScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  suggestedRewardCard: {
    width: 160,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  suggestedRewardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkmarkText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rewardEmoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  suggestedRewardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  suggestedRewardStars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  suggestedRewardStarIcon: {
    fontSize: 14,
  },
  suggestedRewardStarValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  aiSubmitButton: {
    margin: 20,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#000000',
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  aiSubmitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 18,
  },
  aiSubmitText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
