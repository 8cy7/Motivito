import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ChildrenProvider } from './src/contexts/ChildrenContext';
import { isTablet } from './src/utils/deviceUtils';
import { childApi, parentApi } from './src/services/api';
import { addPendingApprovalTask, getPendingApprovalTasks, removePendingApprovalTasks } from './src/services/storage';
import { Task } from './src/types';

export type ApprovedTaskInfo = { id: string; title: string; points: number };

import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ParentAuthScreen } from './src/screens/ParentAuthScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ParentTabNavigator } from './src/navigation/ParentTabNavigator';
import { ChildNavigator } from './src/navigation/ChildNavigator';

const IS_TABLET = isTablet();

// =============================================
// Inner App — reads AuthContext
// =============================================
function InnerApp() {
  const { screen, childInfo } = useAuth();

  // On tablet: skip splash & onboarding, go straight to PIN screen
  const [showSplash, setShowSplash] = useState(!IS_TABLET);
  const [showOnboarding, setShowOnboarding] = useState(!IS_TABLET);
  const [isParentDashboard, setIsParentDashboard] = useState(false);
  const [isChildDashboard, setIsChildDashboard] = useState(false);
  const [childTasks, setChildTasks] = useState<Task[]>([]);
  const [childRewardsRaw, setChildRewardsRaw] = useState<any[]>([]);
  const [justApprovedTasks, setJustApprovedTasks] = useState<ApprovedTaskInfo[]>([]);
  const prevChildTasksRef = useRef<Task[]>([]);

  // Lock orientation: tablet → landscape only, phone → portrait only
  useEffect(() => {
    if (IS_TABLET) {
      Orientation.lockToLandscape();
    } else {
      Orientation.lockToPortrait();
    }
    return () => Orientation.unlockAllOrientations();
  }, []);

  // Reset dashboard flags when user logs out (screen returns to parentAuth)
  useEffect(() => {
    if (screen === 'parentAuth') {
      setIsParentDashboard(false);
      setIsChildDashboard(false);
      setChildTasks([]);
    }
  }, [screen]);

  // Fetch child tasks from backend using child JWT
  const fetchChildTasks = useCallback(async () => {
    try {
      const res = await childApi.get('/api/tasks/mine');
      const mapped: Task[] = (res.data || []).map((t: any) => ({
        id: t.id,
        childId: t.childId,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty || 'easy',
        points: t.starsReward || t.points || 10,
        isCompleted: t.isCompleted || false,
        approvalStatus: t.approvalStatus || undefined,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        category: t.frequency === 'daily' ? 'daily' : t.frequency === 'weekly' ? 'weekly' : 'special',
        frequency: t.frequency || 'once',
        createdAt: new Date(t.createdAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
      }));

      // Detect newly approved tasks using AsyncStorage (survives app restart)
      const pendingIds = await getPendingApprovalTasks();
      if (pendingIds.length > 0) {
        const newlyApproved: ApprovedTaskInfo[] = mapped
          .filter(t => t.approvalStatus === 'approved' && pendingIds.includes(t.id))
          .map(t => ({ id: t.id, title: t.title, points: t.points }));

        if (newlyApproved.length > 0) {
          await removePendingApprovalTasks(newlyApproved.map(t => t.id));
          setJustApprovedTasks(prev => [
            ...prev,
            ...newlyApproved.filter(n => !prev.find(p => p.id === n.id)),
          ]);
        }
      }

      prevChildTasksRef.current = mapped;
      setChildTasks(mapped);
    } catch {
      // fail silently — child stays with empty task list
    }
  }, []);

  useEffect(() => {
    if (isChildDashboard && childInfo) {
      fetchChildTasks();
    }
  }, [isChildDashboard, childInfo, fetchChildTasks]);

  // Fetch child rewards from parent API and filter for this child
  const fetchChildRewards = useCallback(async () => {
    const childId = childInfo?.id;
    if (!childId) return;
    try {
      const res = await parentApi.get('/api/rewards');
      if (res.data) {
        const filtered = res.data.filter((r: any) =>
          !r.childId || r.childId === '' || r.childId === childId
        );
        setChildRewardsRaw(filtered);
        return;
      }
    } catch {}
    try {
      const res = await childApi.get('/api/rewards/mine');
      setChildRewardsRaw(res.data || []);
    } catch {}
  }, [childInfo]);

  useEffect(() => {
    if (isChildDashboard && childInfo) {
      fetchChildRewards();
    }
  }, [isChildDashboard, childInfo, fetchChildRewards]);

  // Complete a task as child — call backend then show hourglass (not disappear)
  const handleChildCompleteTask = useCallback(async (taskId: string) => {
    try {
      await childApi.post(`/api/tasks/${taskId}/complete`);
      // Set approvalStatus to 'completed' so the hourglass persists without hiding the task
      setChildTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, approvalStatus: 'completed' as const } : t)
      );
      prevChildTasksRef.current = prevChildTasksRef.current.map(t =>
        t.id === taskId ? { ...t, approvalStatus: 'completed' as const } : t
      );
      // Persist task ID so celebration triggers even after app restart
      await addPendingApprovalTask(taskId);
    } catch {
      // fail silently
    }
  }, []);

  // ---- Splash ----
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  // ---- Loading auth state ----
  if (screen === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#7C3AED' }}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  // ---- Child dashboard (checked BEFORE screen-based auth checks so it works
  //      even when screen === 'parentAuth', e.g. on a dedicated child tablet) ----
  if (isChildDashboard && childInfo) {
    const child = {
      id: childInfo.id,
      name: childInfo.name,
      avatar: childInfo.avatar,
      gender: childInfo.gender as 'boy' | 'girl',
      color: childInfo.color,
      level: childInfo.level,
      xp: childInfo.xp,
      stars: childInfo.stars,
      totalStars: childInfo.stars,
      badges: [],
      unlockedEmojis: [],
    };

    return (
      <SafeAreaProvider>
        <ChildrenProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" />
            <ChildNavigator
              child={child}
              tasks={childTasks}
              rewards={[]}
              childRewardsRaw={childRewardsRaw}
              onCompleteTask={handleChildCompleteTask}
              onClaimReward={() => {}}
              onRefreshTasks={fetchChildTasks}
              onRefreshRewards={fetchChildRewards}
              justApprovedTasks={justApprovedTasks}
              onClearApprovedTasks={() => setJustApprovedTasks([])}
            />
          </NavigationContainer>
        </ChildrenProvider>
      </SafeAreaProvider>
    );
  }

  // ---- Parent: no account yet ----
  if (screen === 'parentAuth') {
    // On tablet: skip onboarding + registration, go directly to PIN screen
    if (IS_TABLET) {
      return (
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" />
          <LoginScreen
            onParentLogin={() => setIsParentDashboard(true)}
            onChildLogin={() => setIsChildDashboard(true)}
          />
        </SafeAreaProvider>
      );
    }
    // On phone: show onboarding first, then registration
    if (showOnboarding) {
      return (
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" />
          <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
        </SafeAreaProvider>
      );
    }
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <ParentAuthScreen />
      </SafeAreaProvider>
    );
  }

  // ---- Parent dashboard ----
  if (isParentDashboard) {
    return (
      <SafeAreaProvider>
        <ChildrenProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" />
            <ParentTabNavigator />
          </NavigationContainer>
        </ChildrenProvider>
      </SafeAreaProvider>
    );
  }

  // ---- PIN Login screen: parent PIN unlock or child PIN + QR ----
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <LoginScreen
        onParentLogin={() => setIsParentDashboard(true)}
        onChildLogin={() => setIsChildDashboard(true)}
      />
    </SafeAreaProvider>
  );
}

// =============================================
// Root App — wraps everything with AuthProvider
// =============================================
export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
