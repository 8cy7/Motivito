import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Child } from '../../types';
import { getLatestBadge } from '../../utils/badgeUtils';
import { getResponsiveSize, getResponsiveSpacing, getResponsiveFontSize, isTablet } from '../../utils/deviceUtils';

const StarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFD700"/>
  </Svg>
);

interface ChildProfileCardProps {
  child: Child;
  onPress?: () => void;
}

export const ChildProfileCard: React.FC<ChildProfileCardProps> = ({ child, onPress }) => {
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const badgeRotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Badge animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScaleAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(badgeScaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(badgeRotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const latestBadge = getLatestBadge(child.badges);
  const rotation = badgeRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });

  const cardColor = child.gender === 'girl' ? '#E91E63' : '#667eea';
  const isTabletDevice = isTablet();

  // Tablet Design (Horizontal like phone but taller and narrower)
  if (isTabletDevice) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.tabletCard, { backgroundColor: cardColor }]}
      >
        {/* Shimmer effect */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabletShimmerBar,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />

        <View style={styles.tabletContent}>
          {/* Avatar */}
          <View style={styles.tabletAvatarContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.tabletAvatar}
            >
              <Text style={styles.tabletEmoji}>{child.avatar}</Text>
            </LinearGradient>
          </View>

          {/* Info */}
          <View style={styles.tabletInfo}>
            <Text style={styles.tabletName}>{child.name}</Text>

            <View style={styles.tabletBadgeStarsSpacing} />

            <View style={styles.tabletLevelContainer}>
              <View style={styles.tabletLevelHeaderRow}>
                <Text style={styles.tabletLevelText}>المستوى {child.level}</Text>
                <View style={styles.tabletPointsBadge}>
                  <StarIcon />
                  <Text style={styles.tabletPointsText}>{child.stars || 0}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.tabletProgressContainer}>
                <View style={styles.tabletProgressBackground}>
                  <View
                    style={[
                      styles.tabletProgressFill,
                      { width: `${((child.xp || 0) / ((child.level + 1) * 100)) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.tabletProgressText}>
                  {child.xp || 0}/{(child.level + 1) * 100}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Phone Design (Original)
  return (
    <View style={styles.championSection}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.championCard, { backgroundColor: cardColor }]}
      >
        {/* Shimmer effect across the whole card */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmerBar,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />

        {/* Latest Badge - top right with animation */}
        {latestBadge && (
          <Animated.View
            style={[
              styles.badgeIconInCard,
              {
                transform: [
                  { scale: badgeScaleAnim },
                  { rotate: rotation },
                ],
              },
            ]}
          >
            <Text style={styles.badgeIconEmoji}>{latestBadge.emoji}</Text>
          </Animated.View>
        )}

        <View style={styles.championContent}>
          {/* Avatar */}
          <View style={styles.championAvatarContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.championAvatar}
            >
              <Text style={styles.championEmoji}>{child.avatar}</Text>
            </LinearGradient>
          </View>

          {/* Info */}
          <View style={styles.championInfo}>
            <Text style={styles.championName}>{child.name}</Text>

            {/* Space between badge and stars */}
            <View style={styles.badgeStarsSpacing} />

            <View style={styles.levelContainer}>
              <View style={styles.levelHeaderRow}>
                <Text style={styles.levelText}>المستوى {child.level}</Text>
                <View style={styles.championPointsBadge}>
                  <StarIcon />
                  <Text style={styles.championPointsText}>{child.stars || 0}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${((child.xp || 0) / ((child.level + 1) * 100)) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {child.xp || 0}/{(child.level + 1) * 100}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  championSection: {
    marginBottom: getResponsiveSpacing(16, 18),
    paddingHorizontal: getResponsiveSpacing(16, 20),
  },
  championCard: {
    borderRadius: getResponsiveSize(18, 20),
    padding: getResponsiveSpacing(16, 18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: getResponsiveSize(10, 15),
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 6,
    transform: [{ skewX: '-18deg' }],
    zIndex: 1,
  },
  badgeIconInCard: {
    position: 'absolute',
    top: getResponsiveSpacing(12, 14),
    right: getResponsiveSpacing(12, 14),
    width: getResponsiveSize(48, 54),
    height: getResponsiveSize(48, 54),
    borderRadius: getResponsiveSize(24, 27),
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeIconEmoji: {
    fontSize: getResponsiveFontSize(28, 32),
  },
  championContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  championAvatarContainer: {
    marginRight: getResponsiveSpacing(16, 18),
  },
  championAvatar: {
    width: getResponsiveSize(80, 90),
    height: getResponsiveSize(80, 90),
    borderRadius: getResponsiveSize(40, 45),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  championEmoji: {
    fontSize: getResponsiveFontSize(48, 54),
  },
  championInfo: {
    flex: 1,
  },
  championName: {
    fontSize: getResponsiveFontSize(24, 26),
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: getResponsiveSpacing(8, 10),
  },
  badgeStarsSpacing: {
    height: getResponsiveSpacing(12, 14),
  },
  levelContainer: {
    gap: getResponsiveSpacing(8, 10),
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontSize: getResponsiveFontSize(16, 17),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  championPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: getResponsiveSpacing(12, 14),
    paddingVertical: getResponsiveSpacing(6, 8),
    borderRadius: getResponsiveSize(12, 14),
    gap: getResponsiveSpacing(4, 5),
  },
  championPointsText: {
    fontSize: getResponsiveFontSize(14, 15),
    fontWeight: '900',
    color: '#FFD700',
  },
  progressBarContainer: {
    gap: getResponsiveSpacing(6, 8),
  },
  progressBarBackground: {
    height: getResponsiveSize(10, 12),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 5,
  },
  progressText: {
    fontSize: getResponsiveFontSize(12, 13),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
  },
  // Tablet Styles (Horizontal layout - taller and narrower)
  tabletCard: {
    width: 200,
    height: 220,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 7,
    position: 'relative',
    overflow: 'hidden',
  },
  tabletShimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 5,
    transform: [{ skewX: '-18deg' }],
    zIndex: 1,
  },
  tabletContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabletAvatarContainer: {
    marginRight: 12,
  },
  tabletAvatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  tabletEmoji: {
    fontSize: 38,
  },
  tabletInfo: {
    flex: 1,
  },
  tabletName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tabletBadgeStarsSpacing: {
    height: 8,
  },
  tabletLevelContainer: {
    gap: 6,
  },
  tabletLevelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabletLevelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabletPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 3,
  },
  tabletPointsText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFD700',
  },
  tabletProgressContainer: {
    gap: 5,
  },
  tabletProgressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tabletProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  tabletProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
  },
});
