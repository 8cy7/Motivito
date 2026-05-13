import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path, Rect, Defs, RadialGradient, Stop, G, Ellipse } from 'react-native-svg';

// أيقونة صاروخ خرافية
const RocketIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <RadialGradient id="rocketGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="50" cy="50" r="45" fill="url(#rocketGlow)" />
    <Path d="M50 15 L60 45 L55 45 L55 70 L45 70 L45 45 L40 45 Z" fill="#FFFFFF" />
    <Path d="M40 55 L35 70 L45 65 Z" fill="#FF6B6B" />
    <Path d="M60 55 L65 70 L55 65 Z" fill="#FF6B6B" />
    <Ellipse cx="50" cy="40" rx="5" ry="8" fill="#4ECDC4" />
    <Path d="M45 70 L50 85 L55 70" fill="#FFD93D" />
    <Path d="M47 75 L50 90 L53 75" fill="#FF8C00" />
  </Svg>
);

// أيقونة كأس خرافية
const TrophyIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <RadialGradient id="trophyGlow" cx="50%" cy="30%" r="60%">
        <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
        <Stop offset="100%" stopColor="#FFA500" stopOpacity="0.3" />
      </RadialGradient>
    </Defs>
    <Circle cx="50" cy="50" r="45" fill="rgba(255,215,0,0.2)" />
    <Path d="M30 25 L70 25 L65 55 C65 65 55 70 50 70 C45 70 35 65 35 55 Z" fill="url(#trophyGlow)" />
    <Path d="M25 25 C15 25 15 45 30 45" fill="none" stroke="#FFD700" strokeWidth="4" />
    <Path d="M75 25 C85 25 85 45 70 45" fill="none" stroke="#FFD700" strokeWidth="4" />
    <Rect x="45" y="70" width="10" height="10" fill="#FFD700" />
    <Rect x="35" y="80" width="30" height="8" rx="2" fill="#FFD700" />
    <Circle cx="50" cy="45" r="8" fill="#FFFFFF" opacity="0.5" />
    <Path d="M46 42 L50 35 L54 42 L50 40 Z" fill="#FF6B6B" />
  </Svg>
);

// أيقونة نجوم خرافية
const StarsIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <RadialGradient id="starGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#FF69B4" stopOpacity="0.2" />
      </RadialGradient>
    </Defs>
    <Circle cx="50" cy="50" r="45" fill="url(#starGlow)" />
    <Path d="M50 10 L56 35 L82 35 L61 50 L68 75 L50 60 L32 75 L39 50 L18 35 L44 35 Z" fill="#FFD700" />
    <Path d="M25 20 L28 28 L36 28 L30 33 L32 41 L25 36 L18 41 L20 33 L14 28 L22 28 Z" fill="#FFFFFF" opacity="0.8" />
    <Path d="M75 65 L77 70 L82 70 L78 73 L79 78 L75 75 L71 78 L72 73 L68 70 L73 70 Z" fill="#FFFFFF" opacity="0.8" />
    <Circle cx="50" cy="42" r="6" fill="#FFFFFF" opacity="0.6" />
  </Svg>
);

// أيقونة هدية خرافية
const GiftIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <RadialGradient id="giftGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FF69B4" stopOpacity="0.6" />
        <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
      </RadialGradient>
    </Defs>
    <Circle cx="50" cy="50" r="45" fill="url(#giftGlow)" />
    <Rect x="25" y="40" width="50" height="40" rx="5" fill="#FF6B6B" />
    <Rect x="25" y="35" width="50" height="12" rx="3" fill="#FF8E8E" />
    <Rect x="47" y="35" width="6" height="45" fill="#FFD700" />
    <Rect x="25" y="38" width="50" height="6" fill="#FFD700" />
    <Circle cx="40" cy="28" r="10" fill="none" stroke="#FFD700" strokeWidth="4" />
    <Circle cx="60" cy="28" r="10" fill="none" stroke="#FFD700" strokeWidth="4" />
    <Circle cx="35" cy="55" r="3" fill="#FFFFFF" opacity="0.5" />
    <Circle cx="65" cy="65" r="2" fill="#FFFFFF" opacity="0.5" />
  </Svg>
);

interface OnboardingPage {
  id: string;
  title: string;
  description: string;
  icon: 'rocket' | 'trophy' | 'stars' | 'gift';
  colors: string[];
}

const onboardingData: OnboardingPage[] = [
  {
    id: '1',
    title: 'أطلق العنان لإمكانياتك!',
    description: 'رحلة مذهلة تبدأ اليوم.. حيث كل خطوة تقربك من أحلامك',
    icon: 'rocket',
    colors: ['#7C3AED', '#A78BFA'],
  },
  {
    id: '2',
    title: 'تحديات تستحق الفخر',
    description: 'كل مهمة تنجزها خطوة نحو النجاح',
    icon: 'trophy',
    colors: ['#6366F1', '#8B5CF6'],
  },
  {
    id: '3',
    title: 'نجومك.. بوابة أحلامك',
    description: 'اجمع النجوم مع كل إنجاز وحولها لجوائز',
    icon: 'stars',
    colors: ['#EC4899', '#F472B6'],
  },
  {
    id: '4',
    title: 'جوائز تليق بإنجازاتك',
    description: 'استبدل نجومك بما تحب.. كل نجمة تساوي حلماً',
    icon: 'gift',
    colors: ['#8B5CF6', '#EC4899'],
  },
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const { width, height } = useWindowDimensions();

  // Responsive calculations
  const isLandscape = width > height;
  const shortSide = Math.min(width, height);
  const scale = shortSide / 375;
  const clampedScale = Math.min(Math.max(scale, 0.8), 1.8);

  // Responsive sizes
  const emojiSize = Math.round(80 * clampedScale);
  const titleSize = Math.round(28 * clampedScale);
  const descSize = Math.round(16 * clampedScale);
  const buttonSize = Math.round(16 * clampedScale);
  const dotSize = Math.round(8 * clampedScale);
  const spacing = Math.round(20 * clampedScale);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const renderDot = (index: number) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const dotWidth = scrollX.interpolate({
      inputRange,
      outputRange: [dotSize, dotSize * 2.5, dotSize],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          {
            width: dotWidth,
            height: dotSize,
            borderRadius: dotSize / 2,
            opacity,
            marginHorizontal: dotSize / 2,
          },
        ]}
      />
    );
  };

  const renderIcon = (iconType: string, size: number) => {
    switch (iconType) {
      case 'rocket':
        return <RocketIcon size={size} color="#FFF" />;
      case 'trophy':
        return <TrophyIcon size={size} color="#FFF" />;
      case 'stars':
        return <StarsIcon size={size} color="#FFF" />;
      case 'gift':
        return <GiftIcon size={size} color="#FFF" />;
      default:
        return <RocketIcon size={size} color="#FFF" />;
    }
  };

  const renderItem = ({ item, index }: { item: OnboardingPage; index: number }) => {
    return (
      <LinearGradient
        colors={item.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.page, { width }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[
            styles.content,
            isLandscape && styles.contentLandscape
          ]}>
            <Animated.View style={[
              styles.emojiContainer,
              {
                width: emojiSize * 2,
                height: emojiSize * 2,
                borderRadius: emojiSize,
              }
            ]}>
              {renderIcon(item.icon, emojiSize * 1.5)}
            </Animated.View>

            <View style={[styles.textContent, { marginTop: spacing }]}>
              <Text style={[styles.title, { fontSize: titleSize, marginBottom: spacing / 2 }]}>
                {item.title}
              </Text>
              <Text style={[styles.description, { fontSize: descSize, lineHeight: descSize * 1.6 }]}>
                {item.description}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <SafeAreaView style={styles.footerSafe}>
        <View style={[styles.footer, { paddingHorizontal: spacing, paddingBottom: spacing }]}>
          {/* زر تخطي */}
          <TouchableOpacity
            onPress={handleSkip}
            style={{ paddingVertical: spacing / 2, paddingHorizontal: spacing / 2 }}
          >
            <Text style={{ fontSize: buttonSize, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
              تخطي
            </Text>
          </TouchableOpacity>

          {/* النقاط */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {onboardingData.map((_, index) => renderDot(index))}
          </View>

          {/* زر التالي - بناء جديد تماماً */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#FBBF24',
              paddingHorizontal: spacing * 1.2,
              paddingVertical: spacing * 0.6,
              borderRadius: spacing,
              shadowColor: '#F59E0B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text style={{
              fontSize: buttonSize,
              color: '#FFFFFF',
              fontWeight: '700',
            }}>
              {currentIndex === onboardingData.length - 1 ? 'ابدأ' : 'التالي'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '8%',
  },
  contentLandscape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  emojiContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    alignItems: 'center',
    maxWidth: 500,
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  footerSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  dot: {
    backgroundColor: '#FFFFFF',
  },
});
