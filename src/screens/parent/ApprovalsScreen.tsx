import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { parentApi } from '../../services/api';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingTask {
  id: string;
  title: string;
  description?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  child: { id: string; name: string; avatar: string; color: string };
}

interface PendingRewardRequest {
  id: string;
  child: { id: string; name: string; avatar: string; color: string; stars: number };
  reward: { id: string; name: string; emoji: string; pointsCost: number };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#FFFFFF" />
  </Svg>
);

const CloseIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="#FFFFFF"
    />
  </Svg>
);

const GiftIcon = ({ color = '#667eea' }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M20 6H17.82C17.93 5.69 18 5.35 18 5C18 3.34 16.66 2 15 2C13.95 2 13.04 2.54 12.5 3.35L12 4.02L11.5 3.34C10.96 2.54 10.05 2 9 2C7.34 2 6 3.34 6 5C6 5.35 6.07 5.69 6.18 6H4C2.9 6 2.01 6.9 2.01 8L2 19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM15 4C15.55 4 16 4.45 16 5C16 5.55 15.55 6 15 6C14.45 6 14 5.55 14 5C14 4.45 14.45 4 15 4ZM9 4C9.55 4 10 4.45 10 5C10 5.55 9.55 6 9 6C8.45 6 8 5.55 8 5C8 4.45 8.45 4 9 4ZM20 19H4V8H11V10H13V8H20V19ZM13 11H11V19H13V11Z"
      fill={color}
    />
  </Svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const difficultyColor = (d: 'easy' | 'medium' | 'hard') =>
  d === 'easy' ? '#4CAF50' : d === 'medium' ? '#FF9800' : '#F44336';

const difficultyLabel = (d: 'easy' | 'medium' | 'hard') =>
  d === 'easy' ? 'سهل' : d === 'medium' ? 'متوسط' : 'صعب';

// ─── Component ────────────────────────────────────────────────────────────────

export const ApprovalsScreen = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards'>('tasks');
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [pendingRewards, setPendingRewards] = useState<PendingRewardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, rewardsRes] = await Promise.all([
        parentApi.get('/api/tasks/pending-approval'),
        parentApi.get('/api/reward-requests'),
      ]);
      setPendingTasks(tasksRes.data ?? []);
      setPendingRewards(rewardsRes.data ?? []);
    } catch {
      Alert.alert('خطأ', 'تعذّر تحميل البيانات، تأكد من الاتصال بالإنترنت');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleApproveTask = (task: PendingTask) => {
    Alert.alert(
      'الموافقة على المهمة',
      `هل تريد الموافقة على "${task.title}" لـ ${task.child.name}؟\nسيحصل على ${task.points} نقطة`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'موافقة',
          onPress: async () => {
            try {
              await parentApi.post(`/api/tasks/${task.id}/approve`);
              setPendingTasks(prev => prev.filter(t => t.id !== task.id));
            } catch (err: any) {
              Alert.alert('خطأ', err?.response?.data?.error || 'فشلت العملية');
            }
          },
        },
      ]
    );
  };

  const handleRejectTask = (task: PendingTask) => {
    Alert.alert(
      'رفض المهمة',
      `هل تريد رفض "${task.title}" لـ ${task.child.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            try {
              await parentApi.post(`/api/tasks/${task.id}/reject`);
              setPendingTasks(prev => prev.filter(t => t.id !== task.id));
            } catch (err: any) {
              Alert.alert('خطأ', err?.response?.data?.error || 'فشلت العملية');
            }
          },
        },
      ]
    );
  };

  const handleDeliverReward = (req: PendingRewardRequest) => {
    Alert.alert(
      'تسليم الهدية',
      `هل تريد تسليم "${req.reward.name}" لـ ${req.child.name}؟\nسيتم خصم ${req.reward.pointsCost} نقطة`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسليم',
          onPress: async () => {
            try {
              await parentApi.post(`/api/reward-requests/${req.id}/deliver`);
              setPendingRewards(prev => prev.filter(r => r.id !== req.id));
            } catch (err: any) {
              Alert.alert('خطأ', err?.response?.data?.error || 'فشلت العملية');
            }
          },
        },
      ]
    );
  };

  const handleRejectReward = (req: PendingRewardRequest) => {
    Alert.alert(
      'رفض الهدية',
      `هل تريد رفض طلب "${req.reward.name}" لـ ${req.child.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            try {
              await parentApi.post(`/api/reward-requests/${req.id}/reject`);
              setPendingRewards(prev => prev.filter(r => r.id !== req.id));
            } catch (err: any) {
              Alert.alert('خطأ', err?.response?.data?.error || 'فشلت العملية');
            }
          },
        },
      ]
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7241c6', '#5c34a3', '#7241c6']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('rewards')}
          style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>
            هدايا بانتظار التسليم
          </Text>
          {pendingRewards.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRewards.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('tasks')}
          style={[styles.tab, activeTab === 'tasks' && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
            مهام بانتظار الموافقة
          </Text>
          {pendingTasks.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingTasks.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
            />
          }
        >
          {activeTab === 'tasks' ? (
            pendingTasks.length > 0 ? (
              pendingTasks.map(task => (
                <View key={task.id} style={styles.card}>
                  <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.cardGradient}>
                    <View style={styles.cardHeader}>
                      <View style={styles.childInfo}>
                        <Text style={styles.childAvatar}>{task.child.avatar}</Text>
                        <Text style={styles.childName}>{task.child.name}</Text>
                      </View>
                      <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor(task.difficulty) }]}>
                        <Text style={styles.difficultyText}>{difficultyLabel(task.difficulty)}</Text>
                      </View>
                    </View>

                    <View style={styles.taskDetails}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      {task.description ? (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      ) : null}
                    </View>

                    <View style={styles.pointsContainer}>
                      <Text style={styles.pointsLabel}>النقاط:</Text>
                      <Text style={styles.pointsValue}>⭐ {task.points}</Text>
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        onPress={() => handleRejectTask(task)}
                        style={[styles.actionButton, styles.rejectButton]}
                        activeOpacity={0.8}
                      >
                        <CloseIcon />
                        <Text style={styles.rejectButtonText}>رفض</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleApproveTask(task)}
                        style={[styles.actionButton, styles.approveButton]}
                        activeOpacity={0.8}
                      >
                        <CheckIcon />
                        <Text style={styles.approveButtonText}>موافقة</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              ))
            ) : (
              <EmptyState emoji="✅" title="لا توجد موافقات معلقة" subtitle="المهام المكتملة ستظهر هنا للموافقة عليها" />
            )
          ) : (
            pendingRewards.length > 0 ? (
              pendingRewards.map(req => (
                <View key={req.id} style={styles.card}>
                  <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.cardGradient}>
                    <View style={styles.cardHeader}>
                      <View style={styles.childInfo}>
                        <Text style={styles.childAvatar}>{req.child.avatar}</Text>
                        <Text style={styles.childName}>{req.child.name}</Text>
                      </View>
                      <GiftIcon />
                    </View>

                    <View style={styles.rewardDetails}>
                      <Text style={styles.rewardEmoji}>{req.reward.emoji}</Text>
                      <Text style={styles.rewardName}>{req.reward.name}</Text>
                    </View>

                    <View style={styles.pointsContainer}>
                      <Text style={styles.pointsLabel}>التكلفة:</Text>
                      <Text style={styles.pointsValue}>⭐ {req.reward.pointsCost}</Text>
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        onPress={() => handleRejectReward(req)}
                        style={[styles.actionButton, styles.rejectButton]}
                        activeOpacity={0.8}
                      >
                        <CloseIcon />
                        <Text style={styles.rejectButtonText}>رفض</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeliverReward(req)}
                        style={[styles.actionButton, styles.deliverButton]}
                        activeOpacity={0.8}
                      >
                        <GiftIcon color="#FFFFFF" />
                        <Text style={styles.deliverButtonText}>تسليم</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              ))
            ) : (
              <EmptyState emoji="🎁" title="لا توجد هدايا معلقة" subtitle="الهدايا التي يطلبها الأطفال ستظهر هنا" />
            )
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EmptyState = ({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) => (
  <View style={styles.emptyState}>
    <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.emptyGradient}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySubtext}>{subtitle}</Text>
    </LinearGradient>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 60,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    gap: 6,
  },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  tabTextActive: { color: '#667eea', fontWeight: '900' },
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  content: { flex: 1 },
  contentContainer: { paddingTop: 10, paddingBottom: 120 },
  emptyState: { alignItems: 'center', paddingHorizontal: 20 },
  emptyGradient: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 10, textAlign: 'center' },
  emptySubtext: { fontSize: 15, fontWeight: '600', color: '#666', textAlign: 'center', lineHeight: 22 },
  card: { width: width - 40, marginHorizontal: 20, marginBottom: 16 },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  childInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  childAvatar: { fontSize: 32 },
  childName: { fontSize: 18, fontWeight: '700', color: '#333' },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  difficultyText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  taskDetails: { marginBottom: 16 },
  taskTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 6 },
  taskDescription: { fontSize: 14, fontWeight: '500', color: '#666', lineHeight: 20 },
  rewardDetails: { alignItems: 'center', marginBottom: 16 },
  rewardEmoji: { fontSize: 48, marginBottom: 8 },
  rewardName: { fontSize: 18, fontWeight: '700', color: '#333' },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  pointsLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  pointsValue: { fontSize: 16, fontWeight: '800', color: '#667eea' },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  approveButton: { backgroundColor: '#4CAF50' },
  approveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  deliverButton: { backgroundColor: '#667eea' },
  deliverButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  rejectButton: { backgroundColor: '#F44336' },
  rejectButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
