import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChildDashboardScreen } from '../screens/child/ChildDashboardScreen';
import { ChildAchievementShelfScreen } from '../screens/child/ChildAchievementShelfScreen';
import { BattlePassScreen } from '../screens/child/BattlePassScreen';
import { ChildMapScreen } from '../screens/child/ChildMapScreen';
import { ProgressScreen } from '../screens/child/ProgressScreen';
import { FriendsScreen } from '../screens/child/FriendsScreen';
import { Child, Task, Reward } from '../types';
import { ApprovedTaskInfo } from '../../App';

const Stack = createNativeStackNavigator();

interface ChildNavigatorProps {
  child: Child;
  tasks: Task[];
  rewards: Reward[];
  childRewardsRaw?: any[];
  onCompleteTask: (taskId: string) => void;
  onClaimReward: (rewardId: string) => void;
  onRefreshTasks?: () => Promise<void>;
  onRefreshRewards?: () => Promise<void>;
  justApprovedTasks?: ApprovedTaskInfo[];
  onClearApprovedTasks?: () => void;
}

export const ChildNavigator: React.FC<ChildNavigatorProps> = ({
  child,
  tasks,
  rewards,
  childRewardsRaw,
  onCompleteTask,
  onClaimReward,
  onRefreshTasks,
  onRefreshRewards,
  justApprovedTasks,
  onClearApprovedTasks,
}) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChildDashboard">
        {({ navigation }) => (
          <ChildDashboardScreen
            child={child}
            tasks={tasks}
            rewards={rewards}
            childRewardsRaw={childRewardsRaw}
            onCompleteTask={onCompleteTask}
            onClaimReward={onClaimReward}
            navigation={navigation}
            onRefreshTasks={onRefreshTasks}
            justApprovedTasks={justApprovedTasks}
            onClearApprovedTasks={onClearApprovedTasks}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AchievementShelf"
        component={ChildAchievementShelfScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="BattlePass"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0a0e27' },
        }}
      >
        {({ navigation: bpNav }) => (
          <BattlePassScreen
            child={child}
            rewards={childRewardsRaw || []}
            onRefreshRewards={onRefreshRewards}
            navigation={bpNav}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="ChildMap"
        component={ChildMapScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: '#030012' },
        }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: '#030012' },
        }}
      />
    </Stack.Navigator>
  );
};
