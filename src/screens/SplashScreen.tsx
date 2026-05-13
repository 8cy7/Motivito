import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MotivitoLogo } from '../components/MotivitoLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { width, height } = useWindowDimensions();
  
  // Responsive calculations using percentages
  const isLandscape = width > height;
  const shortSide = Math.min(width, height);
  
  // Scale factor based on screen size (base: iPhone 375pt width)
  const scale = shortSide / 375;
  const clampedScale = Math.min(Math.max(scale, 0.8), 1.8);
  
  // Responsive sizes
  const logoSize = Math.round(120 * clampedScale);
  const titleSize = Math.round(36 * clampedScale);
  const subtitleSize = Math.round(16 * clampedScale);
  const spacing = Math.round(24 * clampedScale);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in text after logo
    setTimeout(() => {
      Animated.timing(textFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 400);

    // Navigate after delay
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => onFinish());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[
        styles.content,
        isLandscape && styles.contentLandscape
      ]}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <MotivitoLogo size={logoSize} />
        </Animated.View>

        <Animated.View
          style={[
            styles.textWrapper,
            { 
              opacity: textFade,
              marginTop: spacing,
            },
          ]}
        >
          <Text style={[styles.title, { fontSize: titleSize }]}>
            MOTIVITO
          </Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize, marginTop: spacing / 3 }]}>
            رحلة التحفيز والإنجاز تبدأ هنا
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '10%',
  },
  contentLandscape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});
