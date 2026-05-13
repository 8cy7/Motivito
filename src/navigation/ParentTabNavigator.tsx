import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { DashboardScreen } from '../screens/parent/DashboardScreen';
import { ChildDetailScreen } from '../screens/parent/ChildDetailScreen';
import { SettingsScreen } from '../screens/parent/SettingsScreen';
import { RewardsScreen } from '../screens/parent/RewardsScreen';
import { AchievementShelfScreen } from '../screens/parent/AchievementShelfScreen';
import { DetailedAnalyticsScreen } from '../screens/parent/DetailedAnalyticsScreen';
import { SiblingsComparisonScreen } from '../screens/parent/SiblingsComparisonScreen';
import { MotivitoAIChatScreen } from '../screens/parent/MotivitoAIChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Dashboard Stack
const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
      />
      <Stack.Screen
        name="ChildDetail"
        component={ChildDetailScreen}
      />
      <Stack.Screen
        name="AchievementShelf"
        component={AchievementShelfScreen}
      />
      {/* المحلل الذكي: يبدأ بـ المقارنات */}
      <Stack.Screen
        name="SmartAnalyzer"
        component={SiblingsComparisonScreen}
      />
      {/* تفاصيل الطفل الفردي */}
      <Stack.Screen
        name="DetailedAnalytics"
        component={DetailedAnalyticsScreen}
      />
      {/* شاشة الرسوم البيانية */}
      <Stack.Screen
        name="Charts"
        component={DetailedAnalyticsScreen}
      />
      {/* موتيفيتو AI Chat */}
      <Stack.Screen
        name="MotivitoAIChat"
        component={MotivitoAIChatScreen}
      />
    </Stack.Navigator>
  );
};


// Icons
const HomeIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="26" height="26" viewBox="0 0 24 24">
    <Path
      d="M12 3L4 9V21H20V9L12 3ZM12 5.69L18 10.19V19H6V10.19L12 5.69Z"
      fill={focused ? "#667eea" : "rgba(255,255,255,0.5)"}
    />
    {focused && (
      <Path
        d="M9 12H15V19H9V12Z"
        fill="#667eea"
      />
    )}
  </Svg>
);

const SettingsIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="26" height="26" viewBox="0 0 24 24">
    <Path
      d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33C5.02 5.25 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.08 2.66 9.34 2.86 9.48L4.89 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.87 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.75 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.15 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z"
      fill={focused ? "#9C27B0" : "rgba(255,255,255,0.5)"}
    />
  </Svg>
);

const GiftIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="26" height="26" viewBox="0 0 24 24">
    <Path
      d="M20 6H17.82C17.93 5.69 18 5.35 18 5C18 3.34 16.66 2 15 2C13.95 2 13.04 2.54 12.5 3.35L12 4.02L11.5 3.34C10.96 2.54 10.05 2 9 2C7.34 2 6 3.34 6 5C6 5.35 6.07 5.69 6.18 6H4C2.9 6 2.01 6.9 2.01 8L2 19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM15 4C15.55 4 16 4.45 16 5C16 5.55 15.55 6 15 6C14.45 6 14 5.55 14 5C14 4.45 14.45 4 15 4ZM9 4C9.55 4 10 4.45 10 5C10 5.55 9.55 6 9 6C8.45 6 8 5.55 8 5C8 4.45 8.45 4 9 4ZM20 19H4V8H11V10H13V8H20V19ZM13 11H11V19H13V11Z"
      fill={focused ? "#FFD700" : "rgba(255,255,255,0.5)"}
    />
  </Svg>
);

export const ParentTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => {
          switch (route.name) {
            case 'Dashboard':
              return <HomeIcon focused={focused} />;
            case 'Rewards':
              return <GiftIcon focused={focused} />;
            case 'Settings':
              return <SettingsIcon focused={focused} />;
            default:
              return null;
          }
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.98)', 'rgba(15, 15, 15, 0.98)']}
            style={StyleSheet.absoluteFill}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route);
          return {
            headerShown: false,
            title: '',
            tabBarLabel: 'الرئيسية',
            tabBarStyle: (routeName === 'AchievementShelf' || routeName === 'SmartAnalyzer' || routeName === 'MotivitoAIChat') ? { display: 'none' } : styles.tabBar,
          };
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ headerShown: false, title: '', tabBarLabel: 'الجوائز' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false, title: '', tabBarLabel: 'الإعدادات' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 80 : 75,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 0,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 0,
  },
});
