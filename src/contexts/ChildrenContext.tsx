import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { Child, Task } from '../types';
import { calculateBadges } from '../utils/badgeUtils';
import { parentApi, childApi } from '../services/api';

// Reward Interface (kept for compatibility with existing screens)
export interface Reward {
  id: string;
  name: string;
  emoji: string;
  points: number;
  type: 'small' | 'medium' | 'large';
  childId: string;
  childName: string;
  childAvatar: string;
}

interface ChildrenContextType {
  children: Child[];
  tasks: Task[];
  rewards: Reward[];
  isPremium: boolean;
  loading: boolean;
  addChild: (child: Child) => void;
  updateChild: (child: Child) => void;
  deleteChild: (childId: string) => void;
  addTask: (task: Task) => void;
  addTasks: (tasks: Task[]) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  addReward: (reward: Reward) => void;
  deleteReward: (rewardId: string) => void;
  togglePremium: () => void;
  refreshChildren: () => Promise<void>;
  refreshPremiumStatus: () => Promise<void>;
}

const ChildrenContext = createContext<ChildrenContextType | undefined>(undefined);

// Map API child response to our local Child type
function mapApiChild(apiChild: any): Child {
  return {
    id: apiChild.id,
    name: apiChild.name,
    avatar: apiChild.avatar || '👦',
    isAvatarImage: apiChild.isAvatarImage || false,
    level: apiChild.level || 1,
    xp: apiChild.xp || 0,
    stars: apiChild.stars || 0,
    totalStars: apiChild.totalStars || 0,
    isPinned: apiChild.isPinned || false,
    color: apiChild.color || '#4facfe',
    gender: apiChild.gender || 'boy',
    badges: calculateBadges(apiChild.level || 1, apiChild.gender || 'boy'),
    unlockedEmojis: apiChild.unlockedEmojis || [],
  };
}

// Map API task response to our local Task type
function mapApiTask(apiTask: any): Task {
  return {
    id: apiTask.id,
    childId: apiTask.childId,
    title: apiTask.title,
    description: apiTask.description,
    difficulty: apiTask.difficulty || 'easy',
    points: apiTask.starsReward || 10,
    isCompleted: apiTask.isCompleted || false,
    dueDate: apiTask.dueDate ? new Date(apiTask.dueDate) : undefined,
    category: apiTask.frequency === 'daily' ? 'daily' : apiTask.frequency === 'weekly' ? 'weekly' : 'special',
    frequency: apiTask.frequency || 'once',
    createdAt: new Date(apiTask.createdAt),
    completedAt: apiTask.completedAt ? new Date(apiTask.completedAt) : undefined,
  };
}

export const ChildrenProvider = ({ children: reactChildren }: { children: ReactNode }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Fetch children from the API
  const refreshChildren = useCallback(async () => {
    let rewardsLoaded = false;

    // --- Parent API block (requires parent JWT) ---
    try {
      const res = await parentApi.get('/api/children');
      // Restore emoji unlocks from AsyncStorage if API doesn't return them
      const apiChildren: Child[] = await Promise.all(
        (res.data || []).map(async (c: any) => {
          const mapped = mapApiChild(c);
          // Restore emoji unlocks from AsyncStorage if API doesn't return them
          if (!mapped.unlockedEmojis?.length) {
            try {
              const saved = await AsyncStorage.getItem(`@bp_emojis_${mapped.id}`);
              if (saved) mapped.unlockedEmojis = JSON.parse(saved);
            } catch {}
          }
          // Restore avatar image URI from AsyncStorage (not stored on server)
          try {
            const savedAvatar = await AsyncStorage.getItem(`@avatar_image_${mapped.id}`);
            if (savedAvatar) {
              mapped.avatar = savedAvatar;
              mapped.isAvatarImage = true;
            }
          } catch {}
          return mapped;
        })
      );
      setChildren(apiChildren);

      // Fetch tasks for all children
      const taskPromises = apiChildren.map((c: Child) =>
        parentApi.get(`/api/tasks?childId=${c.id}`).then(r => r.data || []).catch(() => [])
      );
      const allTaskArrays = await Promise.all(taskPromises);
      const allTasks: Task[] = allTaskArrays.flat().map(mapApiTask);
      setTasks(allTasks);

      // Fetch rewards via parent API
      const rewardsRes = await parentApi.get('/api/rewards').catch(() => null);
      if (rewardsRes?.data) {
        const mappedRewards: Reward[] = (rewardsRes.data as any[]).map((r: any) => {
          const childData = apiChildren.find((c: Child) => c.id === r.childId);
          return {
            id: r.id,
            name: r.name,
            emoji: r.emoji,
            points: r.pointsCost,
            type: r.type as 'small' | 'medium' | 'large',
            childId: r.childId || '',
            childName: childData?.name || '',
            childAvatar: childData?.avatar || '👦',
          };
        });
        setRewards(mappedRewards);
        rewardsLoaded = true;
      }

    } catch {
      // Parent not authenticated on this device — normal for child-only devices
    }

    // --- Child API fallback for rewards (always runs if parent API didn't load rewards) ---
    if (!rewardsLoaded) {
      try {
        const childRewardsRes = await childApi.get('/api/rewards/mine');
        const mappedRewards: Reward[] = (childRewardsRes.data as any[]).map((r: any) => ({
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          points: r.pointsCost,
          type: r.type as 'small' | 'medium' | 'large',
          childId: r.childId || '',
          childName: '',
          childAvatar: '',
        }));
        setRewards(mappedRewards);
      } catch {
        // No child token either — rewards stay empty
      }
    }

    setLoading(false);
  }, []);

  // فحص حالة الاشتراك بشكل مستقل (لا يعتمد على تحميل الأطفال)
  const checkPremiumStatus = useCallback(async () => {
    // 1. جرّب parent API أولاً (subscriptions/status أو auth/me)
    try {
      const res = await parentApi.get('/api/subscriptions/status');
      if (res?.data?.isPremium !== undefined) {
        const premium = !!res.data.isPremium;
        setIsPremium(premium);
        await AsyncStorage.setItem('@parent_is_premium', premium ? '1' : '0').catch(() => {});
        return;
      }
    } catch {}
    try {
      const res = await parentApi.get('/api/auth/me');
      if (res?.data?.isPremium !== undefined) {
        const premium = !!res.data.isPremium;
        setIsPremium(premium);
        await AsyncStorage.setItem('@parent_is_premium', premium ? '1' : '0').catch(() => {});
        return;
      }
    } catch {}
    // 2. جرّب child API (جهاز الطفل المنفصل)
    try {
      const res = await childApi.get('/api/children/me');
      if (res?.data?.parentIsPremium !== undefined) {
        const premium = !!res.data.parentIsPremium;
        setIsPremium(premium);
        await AsyncStorage.setItem('@parent_is_premium', premium ? '1' : '0').catch(() => {});
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshChildren();
    checkPremiumStatus();
  }, [refreshChildren, checkPremiumStatus]);

  // Refresh children data when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshChildren();
        checkPremiumStatus();
      }
    });
    return () => sub.remove();
  }, [refreshChildren, checkPremiumStatus]);

  // Load locally saved tasks from AsyncStorage (offline fallback)
  useEffect(() => {
    if (!loading && tasks.length === 0) {
      AsyncStorage.getItem('@app_tasks').then(saved => {
        if (saved) {
          const parsed: Task[] = JSON.parse(saved).map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          }));
          setTasks(parsed);
        }
      }).catch(() => {});
    }
  }, [loading]);

  // Persist tasks locally for offline use
  useEffect(() => {
    AsyncStorage.setItem('@app_tasks', JSON.stringify(tasks)).catch(() => {});
  }, [tasks]);

  // ---- Local state mutators (optimistic updates) ----

  const addChild = (child: Child) => setChildren(prev => [...prev, child]);

  const updateChild = (updated: Child) => {
    setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));
    // Persist emoji unlocks to AsyncStorage so they survive API refreshes
    if (updated.unlockedEmojis?.length) {
      AsyncStorage.setItem(`@bp_emojis_${updated.id}`, JSON.stringify(updated.unlockedEmojis)).catch(() => {});
    }
    // Persist avatar image URI to AsyncStorage so it survives API refreshes
    if (updated.isAvatarImage && updated.avatar) {
      AsyncStorage.setItem(`@avatar_image_${updated.id}`, updated.avatar).catch(() => {});
    } else {
      // If switched back to emoji, clear the saved image
      AsyncStorage.removeItem(`@avatar_image_${updated.id}`).catch(() => {});
    }
  };

  const deleteChild = (childId: string) => {
    setChildren(prev => prev.filter(c => c.id !== childId));
    setTasks(prev => prev.filter(t => t.childId !== childId));
    setRewards(prev => prev.filter(r => r.childId !== childId));
  };

  const addTask = (task: Task) => setTasks(prev => [...prev, task]);
  const addTasks = (newTasks: Task[]) => setTasks(prev => [...prev, ...newTasks]);
  const updateTask = (updated: Task) =>
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  const deleteTask = (taskId: string) =>
    setTasks(prev => prev.filter(t => t.id !== taskId));

  const addReward = async (reward: Reward) => {
    // Optimistic update with temp ID
    setRewards(prev => [...prev, reward]);
    try {
      const res = await parentApi.post('/api/rewards', {
        childId: reward.childId,
        name: reward.name,
        emoji: reward.emoji,
        pointsCost: reward.points,
        type: reward.type,
      });
      // Replace temp ID with real DB ID
      const realId: string = res.data?.id;
      if (realId) {
        setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, id: realId } : r));
      }
    } catch {
      // silent — optimistic update already applied
    }
  };

  const deleteReward = async (rewardId: string) => {
    // Optimistic remove
    setRewards(prev => prev.filter(r => r.id !== rewardId));
    try {
      await parentApi.delete(`/api/rewards/${rewardId}`);
    } catch {
      // silent — optimistic update already applied
    }
  };

  const togglePremium = () => setIsPremium(prev => !prev);

  return (
    <ChildrenContext.Provider
      value={{
        children,
        tasks,
        rewards,
        isPremium,
        loading,
        addChild,
        updateChild,
        deleteChild,
        addTask,
        addTasks,
        updateTask,
        deleteTask,
        addReward,
        deleteReward,
        togglePremium,
        refreshChildren,
        refreshPremiumStatus: checkPremiumStatus,
      }}
    >
      {reactChildren}
    </ChildrenContext.Provider>
  );
};

export const useChildren = () => {
  const context = useContext(ChildrenContext);
  if (!context) throw new Error('useChildren must be used within ChildrenProvider');
  return context;
};
