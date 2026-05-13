import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { AppModal } from './AppModal';
import Svg, { Path } from 'react-native-svg';
import { parentApi } from '../services/api';

const { height } = Dimensions.get('window');

interface PendingTask {
  id: string;
  title: string;
  points: number;
  completedAt: string | null;
  child: { id: string; name: string; avatar: string; color: string };
}

interface PendingRewardRequest {
  id: string;
  starsCost: number;
  requestedAt: string;
  child: { id: string; name: string; avatar: string; color: string; stars: number };
  reward: { id: string; name: string; emoji: string; pointsCost: number };
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  childId: string;
  onAction?: () => void; // called after each approve/deliver so badge updates immediately
}

// Icons
const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="#FF0000"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20">
    <Path
      d="M7.5 14.5L3 10L4.41 8.59L7.5 11.67L15.59 3.59L17 5L7.5 14.5Z"
      fill="#FFFFFF"
    />
  </Svg>
);

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  return `منذ ${Math.floor(diffHours / 24)} يوم`;
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  childId,
  onAction,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards'>('tasks');
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [pendingRewards, setPendingRewards] = useState<PendingRewardRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, rewardsRes] = await Promise.all([
        parentApi.get('/api/tasks/pending-approval'),
        parentApi.get('/api/reward-requests'),
      ]);
      setPendingTasks(tasksRes.data || []);
      setPendingRewards(rewardsRes.data || []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) fetchAll();
  }, [visible, fetchAll]);

  const handleApproveTask = async (taskId: string) => {
    setApprovingId(taskId);
    try {
      await parentApi.post(`/api/tasks/${taskId}/approve`);
      setPendingTasks(prev => prev.filter(t => t.id !== taskId));
      onAction?.();
    } catch {
      // fail silently
    } finally {
      setApprovingId(null);
    }
  };

  const handleDeliverReward = async (requestId: string) => {
    setApprovingId(requestId);
    try {
      await parentApi.post(`/api/reward-requests/${requestId}/deliver`);
      setPendingRewards(prev => prev.filter(r => r.id !== requestId));
      onAction?.();
    } catch {
      // fail silently
    } finally {
      setApprovingId(null);
    }
  };

  // Filter by childId if provided
  const displayedTasks = childId
    ? pendingTasks.filter(t => t.child.id === childId)
    : pendingTasks;

  const displayedRewards = childId
    ? pendingRewards.filter(r => r.child.id === childId)
    : pendingRewards;

  return (
    <AppModal
      visible={visible}
      transparent={true}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={{
            width: '100%',
            height: height * 0.88,
            backgroundColor: '#7241c6',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 25,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.15)',
            }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CloseIcon />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF', textAlign: 'right' }}>
                  الإشعارات
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', padding: 20, gap: 12 }}>
              {/* هدايا بانتظار التسليم */}
              <TouchableOpacity
                onPress={() => setActiveTab('rewards')}
                style={{ flex: 1 }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 26, marginLeft: 4, marginBottom: -12, zIndex: 10 }}>🎁</Text>
                <View style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  borderWidth: 3,
                  borderColor: '#000000',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activeTab === 'rewards' ? '#FFD700' : 'rgba(255, 255, 255, 0.2)',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' }}>
                    هدايا بانتظار التسليم
                  </Text>
                  {displayedRewards.length > 0 && (
                    <View style={{
                      position: 'absolute', top: -8, right: -6,
                      backgroundColor: '#FF4444', borderRadius: 10,
                      width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFF' }}>{displayedRewards.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* مهام بانتظار الموافقة */}
              <TouchableOpacity
                onPress={() => setActiveTab('tasks')}
                style={{ flex: 1 }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 26, marginLeft: 4, marginBottom: -12, zIndex: 10 }}>📋</Text>
                <View style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  borderWidth: 3,
                  borderColor: '#000000',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activeTab === 'tasks' ? '#667eea' : 'rgba(255, 255, 255, 0.2)',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' }}>
                    مهام بانتظار الموافقة
                  </Text>
                  {displayedTasks.length > 0 && (
                    <View style={{
                      position: 'absolute', top: -8, right: -6,
                      backgroundColor: '#FF4444', borderRadius: 10,
                      width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFF' }}>{displayedTasks.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFD700" />
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              >
                {activeTab === 'tasks' ? (
                  <View style={{ gap: 16 }}>
                    {displayedTasks.length === 0 ? (
                      <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                          لا توجد مهام بانتظار الموافقة
                        </Text>
                      </View>
                    ) : (
                      displayedTasks.map((task) => (
                        <View key={task.id} style={{
                          borderRadius: 18,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 2,
                          borderColor: '#000000',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 8,
                          elevation: 4,
                        }}>
                          <View style={{
                            position: 'absolute', top: -12, left: 10,
                            width: 48, height: 48, borderRadius: 24,
                            backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000',
                            justifyContent: 'center', alignItems: 'center', zIndex: 10,
                            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
                          }}>
                            <Text style={{ fontSize: 24 }}>⏳</Text>
                          </View>
                          <View style={{ padding: 18 }}>
                            <View style={{
                              flexDirection: 'row', justifyContent: 'space-between',
                              alignItems: 'flex-start', marginBottom: 12,
                            }}>
                              <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#333', textAlign: 'right', marginBottom: 4 }}>
                                  {task.title}
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#9C6ADE', textAlign: 'right', marginBottom: 4 }}>
                                  {task.child.avatar} {task.child.name}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#999', textAlign: 'right' }}>
                                  {formatDate(task.completedAt)}
                                </Text>
                              </View>
                              <Text style={{
                                fontSize: 14, fontWeight: '700', color: '#FFD700',
                                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                                paddingHorizontal: 12, paddingVertical: 6,
                                borderRadius: 12, marginRight: 16,
                              }}>
                                ⭐ {task.points}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleApproveTask(task.id)}
                              disabled={approvingId === task.id}
                              style={{
                                borderRadius: 15,
                                shadowColor: '#4CAF50',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
                                opacity: approvingId === task.id ? 0.6 : 1,
                              }}
                            >
                              <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                justifyContent: 'center', gap: 8,
                                paddingVertical: 12, paddingHorizontal: 20,
                                borderWidth: 2, borderColor: '#000000',
                                borderRadius: 15, backgroundColor: '#4CAF50',
                              }}>
                                {approvingId === task.id
                                  ? <ActivityIndicator size="small" color="#FFF" />
                                  : <CheckIcon />
                                }
                                <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF' }}>موافقة</Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                ) : (
                  <View style={{ gap: 16 }}>
                    {displayedRewards.length === 0 ? (
                      <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎁</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                          لا توجد هدايا بانتظار التسليم
                        </Text>
                      </View>
                    ) : (
                      displayedRewards.map((req) => (
                        <View key={req.id} style={{
                          borderRadius: 18,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 2, borderColor: '#000000',
                          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
                        }}>
                          <View style={{
                            position: 'absolute', top: -12, left: 10,
                            width: 48, height: 48, borderRadius: 24,
                            backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000',
                            justifyContent: 'center', alignItems: 'center', zIndex: 10,
                            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
                          }}>
                            <Text style={{ fontSize: 24 }}>{req.reward.emoji || '🎁'}</Text>
                          </View>
                          <View style={{ padding: 18 }}>
                            <View style={{
                              flexDirection: 'row', justifyContent: 'space-between',
                              alignItems: 'flex-start', marginBottom: 12,
                            }}>
                              <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#333', textAlign: 'right', marginBottom: 4 }}>
                                  {req.reward.name}
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#9C6ADE', textAlign: 'right', marginBottom: 4 }}>
                                  {req.child.avatar} {req.child.name}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#999', textAlign: 'right' }}>
                                  {formatDate(req.requestedAt)}
                                </Text>
                              </View>
                              <Text style={{
                                fontSize: 14, fontWeight: '700', color: '#FFD700',
                                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                                paddingHorizontal: 12, paddingVertical: 6,
                                borderRadius: 12, marginRight: 16,
                              }}>
                                ⭐ {req.starsCost}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleDeliverReward(req.id)}
                              disabled={approvingId === req.id}
                              style={{
                                borderRadius: 15,
                                shadowColor: '#FF9800',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
                                opacity: approvingId === req.id ? 0.6 : 1,
                              }}
                            >
                              <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                justifyContent: 'center', gap: 8,
                                paddingVertical: 12, paddingHorizontal: 20,
                                borderWidth: 2, borderColor: '#000000',
                                borderRadius: 15, backgroundColor: '#FF9800',
                              }}>
                                {approvingId === req.id
                                  ? <ActivityIndicator size="small" color="#FFF" />
                                  : <Text style={{ fontSize: 18 }}>🎁</Text>
                                }
                                <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF' }}>تسليم</Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </AppModal>
  );
};
