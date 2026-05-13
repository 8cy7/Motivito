import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getResponsiveSize, getResponsiveSpacing, getResponsiveFontSize, isTablet } from '../../utils/deviceUtils';

const HomeIcon = ({ active }: { active: boolean }) => {
  const iconSize = getResponsiveSize(28, 32);
  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Path
        d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
        fill={active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
      />
    </Svg>
  );
};

const SettingsIcon = ({ active }: { active: boolean }) => {
  const iconSize = getResponsiveSize(28, 32);
  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Path
        d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
        fill={active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
      />
    </Svg>
  );
};

interface BottomNavBarProps {
  activeTab: 'home' | 'settings';
  onTabChange: (tab: 'home' | 'settings') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const isTabletDevice = isTablet();

  return (
    <View style={[styles.outerContainer, isTabletDevice && styles.tabletOuterContainer]}>
      <View style={[styles.container, isTabletDevice && styles.tabletContainer]}>
        <TouchableOpacity
          style={styles.tab}
          activeOpacity={0.7}
          onPress={() => onTabChange('home')}
        >
          <HomeIcon active={activeTab === 'home'} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>
            الرئيسية
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          activeOpacity={0.7}
          onPress={() => onTabChange('settings')}
        >
          <SettingsIcon active={activeTab === 'settings'} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            الإعدادات
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabletOuterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    height: getResponsiveSize(70, 80),
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: getResponsiveSpacing(10, 12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  tabletContainer: {
    width: 400,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSpacing(4, 6),
  },
  tabText: {
    fontSize: getResponsiveFontSize(12, 14),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});
