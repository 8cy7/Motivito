import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { Child } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ChildCardProps {
  child: Child;
  onPress: () => void;
}

const PinIcon = ({ color = '#FF3CAC' }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"
      fill={color}
    />
  </Svg>
);

const LevelBadge = ({ level, color }: { level: number; color: string }) => (
  <Svg width="30" height="30" viewBox="0 0 30 30">
    <Circle cx="15" cy="15" r="14" fill={color} opacity="0.9" />
    <Circle cx="15" cy="15" r="11" fill="white" opacity="0.3" />
  </Svg>
);

export const ChildCard: React.FC<ChildCardProps> = ({ child, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (child.isPinned) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [child.isPinned, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Calculate progress to next level
  const pointsForNextLevel = child.level * 100;
  const progressPercentage = (child.points / pointsForNextLevel) * 100;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <LinearGradient
          colors={[child.color, `${child.color}dd`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}>

          {/* Pin Icon - Top Right */}
          {child.isPinned && (
            <Animated.View
              style={[
                styles.pinContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}>
              <PinIcon color="#FFD93D" />
            </Animated.View>
          )}

          {/* Avatar Circle */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FFFFFF', '#F0F0F0']}
              style={styles.avatar}>
              <Text style={styles.avatarText}>{child.avatar}</Text>
            </LinearGradient>

            {/* Level Badge */}
            <View style={styles.levelBadge}>
              <LevelBadge level={child.level} color={child.color} />
              <Text style={styles.levelText}>{child.level}</Text>
            </View>
          </View>

          {/* Child Name */}
          <Text style={styles.name} numberOfLines={1}>
            {child.name}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progressPercentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              المستوى {child.level}
            </Text>
          </View>

          {/* Points Display */}
          <View style={styles.pointsContainer}>
            <View style={styles.pointsRow}>
              <Svg width="16" height="16" viewBox="0 0 20 20">
                <Path
                  d="M 10 2 L 12 8 L 18 9 L 14 13 L 15 19 L 10 16 L 5 19 L 6 13 L 2 9 L 8 8 Z"
                  fill="#FFD93D"
                />
              </Svg>
              <Text style={styles.points}>{child.points}</Text>
            </View>
            <Text style={styles.totalPoints}>
              من {pointsForNextLevel}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 200,
  },
  pinContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD93D',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  points: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  totalPoints: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
