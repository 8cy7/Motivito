// screens/Child/ChildDetailScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { AppModal } from '../../components/AppModal';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { AddTaskModal } from '../../components/AddTaskModal';
import { EditChildModal } from '../../components/EditChildModal';
import { Task, TaskDifficulty, TaskFrequency, Child, Badge } from '../../types';
import { getLatestBadge, getBadgeForLevel, calculateBadges, BOY_BADGE_TIERS, GIRL_BADGE_TIERS } from '../../utils/badgeUtils';
import { useChildren } from '../../contexts/ChildrenContext';
import { parentApi } from '../../services/api';

const { width, height } = Dimensions.get('window');

// Icons
const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#FFFFFF" />
  </Svg>
);

const StarIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill="#FFD700"
    />
  </Svg>
);

const CheckCircleIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#4CAF50" />
    <Path d="M9 12L11 14L15 10" stroke="#FFFFFF" strokeWidth="2" fill="none" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      fill="#FFD700"
    />
  </Svg>
);

const DeleteIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      fill="#F44336"
    />
  </Svg>
);

const LinkIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24">
    <Path
      d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
      fill="#8B5CF6"
    />
  </Svg>
);

const QRCodeIcon = () => (
  <Svg width="120" height="120" viewBox="0 0 120 120">
    {/* إطار خارجي */}
    <Rect x="10" y="10" width="100" height="100" fill="none" stroke="#8B5CF6" strokeWidth="3" rx="8" />

    {/* مربعات الـ QR Code */}
    <Rect x="20" y="20" width="25" height="25" fill="#8B5CF6" rx="2" />
    <Rect x="75" y="20" width="25" height="25" fill="#8B5CF6" rx="2" />
    <Rect x="20" y="75" width="25" height="25" fill="#8B5CF6" rx="2" />

    {/* نقاط داخلية */}
    <Rect x="28" y="28" width="9" height="9" fill="#FFF" rx="1" />
    <Rect x="83" y="28" width="9" height="9" fill="#FFF" rx="1" />
    <Rect x="28" y="83" width="9" height="9" fill="#FFF" rx="1" />

    {/* مربعات عشوائية للتصميم */}
    <Rect x="55" y="22" width="8" height="8" fill="#8B5CF6" rx="1" />
    <Rect x="67" y="22" width="5" height="5" fill="#8B5CF6" rx="1" />
    <Rect x="55" y="33" width="5" height="5" fill="#8B5CF6" rx="1" />
    <Rect x="62" y="33" width="8" height="8" fill="#8B5CF6" rx="1" />

    <Rect x="55" y="55" width="15" height="15" fill="#8B5CF6" rx="2" />
    <Rect x="60" y="60" width="5" height="5" fill="#FFF" rx="1" />

    <Rect x="77" y="55" width="8" height="8" fill="#8B5CF6" rx="1" />
    <Rect x="90" y="55" width="10" height="10" fill="#8B5CF6" rx="1" />
    <Rect x="77" y="68" width="5" height="5" fill="#8B5CF6" rx="1" />

    <Rect x="55" y="77" width="8" height="8" fill="#8B5CF6" rx="1" />
    <Rect x="67" y="77" width="5" height="5" fill="#8B5CF6" rx="1" />
    <Rect x="55" y="88" width="15" height="8" fill="#8B5CF6" rx="1" />
    <Rect x="75" y="88" width="8" height="8" fill="#8B5CF6" rx="1" />
    <Rect x="88" y="88" width="12" height="12" fill="#8B5CF6" rx="1" />
  </Svg>
);

type EditChildPayload = {
  name: string;
  avatar: string;
  isAvatarImage?: boolean;
};

// مكون زر إضافة مهمة بنفس تصميم إضافة طفل
const AddTaskButton = ({ onPress }: { onPress: () => void }) => {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, width + 50],
  });

  return (
    <View style={styles.addTaskButtonContainer}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.addTaskButtonCard}
      >
        <View style={styles.addTaskButtonContent}>
          <Text style={styles.addTaskButtonText}>إضافة مهمة +</Text>
        </View>

        {/* الشريط العمودي المتحرك */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sweepBar,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
};

// Link Instructions Modal Component
interface LinkModalProps {
  visible: boolean;
  onClose: () => void;
  childName: string;
  childId: string;
  qrCodeDataUrl?: string | null;
  qrToken?: string | null;
  qrLoading?: boolean;
  qrError?: string | null;
}

const LinkInstructionsModal: React.FC<LinkModalProps> = ({
  visible,
  onClose,
  childName,
  childId,
  qrCodeDataUrl,
  qrToken,
  qrLoading,
  qrError,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const qrSize = Math.min(width * 0.38, 150);
  const modalMaxHeight = height * 0.82;

  return (
    <AppModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
      }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={{
            width: width * 0.88,
            maxWidth: 400,
            maxHeight: modalMaxHeight,
            borderRadius: 22,
            overflow: 'hidden',
            transform: [{ scale: scaleAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 15,
          }}
        >
          {/* هيدر ثابت */}
          <View style={{
            backgroundColor: '#FFFFFF',
            paddingTop: 16,
            paddingHorizontal: 18,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(139, 92, 246, 0.1)',
          }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
              }}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22, color: '#888', fontWeight: '400', marginTop: -2 }}>×</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', paddingRight: 34 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '900',
                color: '#333',
                textAlign: 'center',
                marginBottom: 3,
              }}>ربط حساب {childName}</Text>
              <Text style={{
                fontSize: 12,
                color: '#888',
                textAlign: 'center',
                fontWeight: '600',
              }}>اتبع الخطوات التالية لربط حساب طفلك</Text>
            </View>
          </View>

          {/* محتوى قابل للتمرير */}
          <ScrollView
            style={{ backgroundColor: '#FFFFFF' }}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* QR Code */}
            <View style={{
              alignItems: 'center',
              marginBottom: 16,
              backgroundColor: 'rgba(139, 92, 246, 0.06)',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1.5,
              borderColor: 'rgba(139, 92, 246, 0.2)',
            }}>
              <View style={{ marginBottom: 10, width: qrSize, height: qrSize, justifyContent: 'center', alignItems: 'center' }}>
                {qrLoading ? (
                  <ActivityIndicator size="large" color="#8B5CF6" />
                ) : qrError ? (
                  <Text style={{ fontSize: 12, color: '#F44336', textAlign: 'center', fontWeight: '700' }}>{qrError}</Text>
                ) : qrCodeDataUrl ? (
                  <Image
                    source={{ uri: qrCodeDataUrl }}
                    style={{ width: qrSize, height: qrSize, borderRadius: 8 }}
                    resizeMode="contain"
                  />
                ) : (
                  <QRCodeIcon />
                )}
              </View>
              <Text style={{ fontSize: 12, color: '#8B5CF6', fontWeight: '700', textAlign: 'center' }}>
                امسح هذا الرمز من تطبيق الطفل
              </Text>
              <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '600', marginTop: 4, textAlign: 'center' }}>
                صالح لمدة 15 دقيقة
              </Text>
              {qrToken && (
                <View style={{ marginTop: 10, width: '100%', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#666', fontWeight: '600', marginBottom: 5, textAlign: 'center' }}>
                    أو شارك الرابط يدوياً:
                  </Text>
                  <View style={{
                    backgroundColor: 'rgba(139,92,246,0.06)',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(139,92,246,0.2)',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    width: '100%',
                  }}>
                    <Text style={{ fontSize: 10, color: '#555', textAlign: 'left', fontFamily: 'monospace' }} selectable>
                      {`motivito://link?token=${qrToken}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Share.share({ message: `motivito://link?token=${qrToken}` })}
                    style={{
                      marginTop: 7,
                      backgroundColor: '#8B5CF6',
                      borderRadius: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 18,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>📤 مشاركة الرابط</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* الخطوات */}
            {[
              { n: '1', title: 'حمّل التطبيق للطفل 📱', desc: 'قم بتحميل تطبيق Motivito على جهاز الطفل' },
              { n: '2', title: 'اختر "التحويل للطفل" 🎯', desc: 'في شاشة تسجيل الدخول، اضغط على زر التحويل للطفل' },
              { n: '3', title: 'وجّه الكاميرا نحو الرمز 📷', desc: 'امسح رمز الـ QR الموجود أعلاه باستخدام كاميرا جهاز الطفل' },
              { n: '4', title: 'تحقق من بريدك 📧', desc: 'ستصلك رسالة تحقق على بريدك لإكمال المصادقة الآمنة' },
            ].map((step, i) => (
              <View key={step.n} style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: i < 3 ? 12 : 16,
              }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#8B5CF6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 10,
                  flexShrink: 0,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFF' }}>{step.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#333', marginBottom: 2, textAlign: 'right' }}>
                    {step.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#777', lineHeight: 17, textAlign: 'right', fontWeight: '500' }}>
                    {step.desc}
                  </Text>
                </View>
              </View>
            ))}

            {/* زر الفهم */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              <View style={{
                backgroundColor: '#8B5CF6',
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFF' }}>فهمت! ✓</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </AppModal>
  );
};

// Badge Detail Modal Component
interface BadgeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  badge: Badge | null;
  childName: string;
  childGender: 'boy' | 'girl';
}

const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  visible,
  onClose,
  badge,
  childName,
  childGender,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // إعادة تعيين القيم
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);

      // بدء الأنيميشن
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, badge]);

  if (!badge) return null;

  const badgeInfo = getBadgeForLevel(badge.level, childGender);
  const badgeName = badgeInfo?.name || 'شارة';
  const badgeColor = badgeInfo?.color || '#FFD700';

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <AppModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            modalStyles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F5F5F5']}
            style={modalStyles.content}
          >
            {/* زر الإغلاق */}
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {/* الشارة المتحركة */}
            <Animated.View
              style={[
                modalStyles.badgeContainer,
                {
                  transform: [{ rotate: rotation }],
                },
              ]}
            >
              <LinearGradient
                colors={[badgeColor, `${badgeColor}CC`]}
                style={modalStyles.badgeCircle}
              >
                <Text style={modalStyles.badgeEmoji}>{badge.emoji}</Text>
              </LinearGradient>
            </Animated.View>

            {/* النجوم المحيطة */}
            <View style={modalStyles.starsContainer}>
              <Text style={modalStyles.star}>✨</Text>
              <Text style={modalStyles.star}>⭐</Text>
              <Text style={modalStyles.star}>✨</Text>
            </View>

            {/* معلومات الشارة */}
            <View style={modalStyles.infoContainer}>
              <Text style={modalStyles.title}>{badgeName}</Text>
              <Text style={modalStyles.subtitle}>
                حصل عليها {childName} في المستوى {badge.level}
              </Text>

              <View style={modalStyles.detailsBox}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
                  style={modalStyles.detailsGradient}
                >
                  <View style={modalStyles.detailRow}>
                    <Text style={modalStyles.detailValue}>المستوى {badge.level}</Text>
                    <Text style={modalStyles.detailLabel}>🎯 المستوى</Text>
                  </View>

                  <View style={modalStyles.divider} />

                  <View style={modalStyles.detailRow}>
                    <Text style={modalStyles.detailValue}>
                      {new Date(badge.earnedDate).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={modalStyles.detailLabel}>📅 تاريخ الحصول</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* رسالة تحفيزية */}
              <View style={modalStyles.messageBox}>
                <Text style={modalStyles.messageIcon}>💪</Text>
                <Text style={modalStyles.messageText}>
                  {childGender === 'boy' ? 'استمر' : 'استمري'} في التقدم للحصول على المزيد من الشارات!
                </Text>
              </View>
            </View>

            {/* زر الإغلاق السفلي */}
            <TouchableOpacity
              style={modalStyles.bottomButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[badgeColor, `${badgeColor}CC`]}
                style={modalStyles.bottomButtonGradient}
              >
                <Text style={modalStyles.bottomButtonText}>رائع! 🎉</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </AppModal>
  );
};

export const ChildDetailScreen = ({ route, navigation }: any) => {
  const { child, onUpdateChild, onDeleteChild } = route.params || {};
  const [currentChild, setCurrentChild] = useState<Child>(child);

  // استخدم context لحفظ البيانات
  const { tasks: contextTasks, addTasks: addTasksToContext, deleteTask: deleteTaskFromContext } = useChildren();

  // استخدم useRef لحفظ البيانات بين الرجوع والعودة
  const tasksRef = useRef<Task[]>(
    contextTasks.filter((t: Task) => t.childId === child.id),
  );

  // مهام الطفل من الـ context فقط
  const [tasks, setTasks] = useState<Task[]>(() => {
    const childTasks = contextTasks.filter((t: Task) => t.childId === child.id);
    tasksRef.current = childTasks;
    return childTasks;
  });

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  // QR Code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const linkButtonSweep = useRef(new Animated.Value(0)).current;

  // حدّث tasksRef عند تغيير tasks
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();

    // أنيميشن اللمعان لزر الربط
    Animated.loop(
      Animated.timing(linkButtonSweep, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const handleAddTask = async (taskData: any) => {
    try {
      const res = await parentApi.post('/api/tasks', {
        childId: currentChild.id,
        title: taskData.title,
        description: taskData.description || '',
        difficulty: taskData.difficulty,
        points: taskData.points,
        category: taskData.category,
        frequency: taskData.frequency,
      });

      const savedTask: Task = {
        id: res.data.id,
        childId: currentChild.id,
        title: res.data.title,
        description: res.data.description || '',
        difficulty: res.data.difficulty,
        points: res.data.points ?? res.data.starsReward ?? taskData.points,
        isCompleted: false,
        category: taskData.category,
        frequency: taskData.frequency,
        createdAt: new Date(res.data.createdAt),
      };

      addTasksToContext([savedTask]);
      setTasks(prev => [...prev, savedTask]);
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل إضافة المهمة، تأكد من الاتصال بالإنترنت');
    } finally {
      setShowAddTaskModal(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert('حذف المهمة', 'هل أنت متأكد من حذف هذه المهمة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          // احذف من الـ context إذا كانت موجودة
          try {
            deleteTaskFromContext(taskId);
          } catch (e) {
            // قد لا تكون موجودة في context
          }
          // احذف من الـ local state
          setTasks((prev) => prev.filter((task) => task.id !== taskId));
          tasksRef.current = tasksRef.current.filter((task) => task.id !== taskId);
        },
      },
    ]);
  };

  const handleViewAnalytics = () => {
    navigation.navigate('DetailedAnalytics', { childId: currentChild.id });
  };

  const handleEditChild = (updated: EditChildPayload) => {
    // لو المودال ما رجّع avatar نستخدم الموجود
    const avatar =
      updated.avatar && updated.avatar.length > 0
        ? updated.avatar
        : currentChild.avatar;

    // نحدد هل هو صورة ولا إيموجي
    let isImage: boolean;

    if (typeof updated.isAvatarImage === 'boolean') {
      isImage = updated.isAvatarImage;
    } else {
      isImage =
        /^https?:\/\//.test(avatar) ||
        avatar.startsWith('file:') ||
        avatar.startsWith('content:');
    }

    const updatedChild: Child = {
      ...currentChild,
      name: updated.name,
      avatar,
      isAvatarImage: isImage,
    };

    setCurrentChild(updatedChild);

    if (onUpdateChild) {
      onUpdateChild(updatedChild);
    }

    setShowEditModal(false);
  };

  const handleDeleteChild = () => {
    Alert.alert('حذف الطفل', `هل أنت متأكد من حذف ${currentChild.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          if (onDeleteChild) {
            onDeleteChild(currentChild.id);
          }
          navigation.goBack();
        },
      },
    ]);
  };

  // TEMPORARY: دالة مؤقتة لإضافة نقاط للاختبار
  const handleAddTestPoints = () => {
    const xpToAdd = 5000; // نضيف 100 XP
    const starsToAdd = 5000; // نضيف 100 نجمة

    const currentXP = currentChild.xp || currentChild.points || 0;
    const newXP = currentXP + xpToAdd;

    let newLevel = currentChild.level;
    let remainingXP = newXP;

    // حساب المستوى الجديد بناءً على XP
    while (remainingXP >= newLevel * 100) {
      remainingXP -= newLevel * 100;
      newLevel += 1;
    }

    const updatedChild: Child = {
      ...currentChild,
      level: newLevel,
      xp: remainingXP,
      stars: (currentChild.stars || currentChild.points || 0) + starsToAdd,
      totalStars: (currentChild.totalStars || currentChild.totalPoints || 0) + starsToAdd,
      badges: calculateBadges(newLevel, currentChild.gender),
    };

    setCurrentChild(updatedChild);

    if (onUpdateChild) {
      onUpdateChild(updatedChild);
    }
  };

  const completedTasks = tasks.filter((t) => t.isCompleted);
  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completionRate =
    tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // level progress
  const currentXP = currentChild.xp || currentChild.points || 0;
  const currentStars = currentChild.stars || currentChild.points || 0;
  const pointsForCurrentLevel = currentChild.level * 100;
  const levelProgress = (currentXP / pointsForCurrentLevel) * 100;

  // الحصول على آخر شارة
  const latestBadge = getLatestBadge(currentChild.badges);

  const getDifficultyColor = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
    }
  };

  const getDifficultyLabel = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'سهل';
      case 'medium':
        return 'متوسط';
      case 'hard':
        return 'صعب';
    }
  };

  const getFrequencyLabel = (frequency: TaskFrequency) => {
    switch (frequency) {
      case 'once':
        return 'مرة واحدة';
      case 'daily':
        return 'يومية';
      case 'weekly':
        return 'أسبوعية';
    }
  };

  const getFrequencyIcon = (frequency: TaskFrequency) => {
    switch (frequency) {
      case 'once':
        return '✓';
      case 'daily':
        return '🔄';
      case 'weekly':
        return '📅';
    }
  };

  const handleOpenLinkModal = async () => {
    setQrCodeDataUrl(null);
    setQrToken(null);
    setQrError(null);
    setQrLoading(true);
    setShowLinkModal(true);
    try {
      const res = await parentApi.get(`/api/children/${currentChild.id}/qr`);
      setQrCodeDataUrl(res.data.qrCodeDataUrl);
      setQrToken(res.data.token);
    } catch (err: any) {
      setQrError('فشل في توليد رمز QR، حاول مجدداً');
    } finally {
      setQrLoading(false);
    }
  };

  const handleBadgePress = (badge: any) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };

  const getBadgeName = (badge: any) => {
    const badgeInfo = getBadgeForLevel(badge.level, currentChild.gender);
    return badgeInfo?.name || 'شارة';
  };

  // التحقق هل الأفاتار صورة فعلاً
  const isCurrentAvatarImage =
    !!currentChild &&
    !!currentChild.avatar &&
    (currentChild.isAvatarImage === true ||
      /^https?:\/\//.test(currentChild.avatar) ||
      currentChild.avatar.startsWith('file:') ||
      currentChild.avatar.startsWith('content:'));

  return (
    <View style={styles.container}>
      {/* الخلفية */}
      <View style={styles.background}>
        <LinearGradient
          colors={['#7241c6', '#5c34a3', '#7241c6']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطفل</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowEditModal(true)}
            style={styles.actionButton}
          >
            <EditIcon />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteChild}
            style={styles.actionButton}
          >
            <DeleteIcon />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* بطاقة معلومات الطفل */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginHorizontal: 20, marginBottom: 30 }}>
          <View style={{
            backgroundColor: currentChild.color,
            borderRadius: 25,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
          }}>
            <View style={{
              padding: 25,
              alignItems: 'center',
            }}>
              {/* صورة / إيموجي */}
              <View style={{ marginBottom: 16 }}>
                <View style={{
                  backgroundColor: '#FFD700',
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }}>
                  {isCurrentAvatarImage ? (
                    <Image
                      source={{ uri: currentChild.avatar }}
                      style={{ width: 80, height: 80, borderRadius: 40 }}
                    />
                  ) : (
                    <Text style={{ fontSize: 45 }}>{currentChild.avatar}</Text>
                  )}
                </View>
              </View>

              {/* الاسم */}
              <Text style={{
                fontSize: 28,
                fontWeight: '900',
                color: '#FFFFFF',
                marginBottom: 20,
              }}>
                {currentChild.name}
              </Text>

              {/* إحصائيات */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 18,
                padding: 18,
                marginBottom: 20,
                width: '100%',
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '900',
                    color: '#FFFFFF',
                    marginBottom: 4,
                  }}>
                    {currentChild.level}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '600',
                  }}>
                    المستوى
                  </Text>
                </View>

                <View style={{
                  width: 1,
                  height: 30,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '900',
                    color: '#FFFFFF',
                    marginBottom: 4,
                  }}>
                    {currentStars}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '600',
                  }}>
                    النجوم
                  </Text>
                </View>

                <View style={{
                  width: 1,
                  height: 30,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }} />

                <View style={{ flex: 1, alignItems: 'center' }}>
                  {latestBadge ? (
                    <>
                      <Text style={{ fontSize: 28, marginBottom: 4 }}>
                        {latestBadge.emoji}
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: '600',
                      }}>
                        آخر شارة
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={{
                        fontSize: 24,
                        fontWeight: '900',
                        color: '#FFFFFF',
                        marginBottom: 4,
                      }}>
                        -
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: '600',
                      }}>
                        لا توجد شارات
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* تقدم المستوى */}
              <View style={{ width: '100%' }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}>
                    تقدم المستوى (XP)
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}>
                    {currentXP}/{pointsForCurrentLevel}
                  </Text>
                </View>
                <View style={{
                  height: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 5,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    height: '100%',
                    backgroundColor: '#FFD700',
                    borderRadius: 5,
                    width: `${levelProgress}%`,
                  }} />
                </View>
              </View>

              {/* زر ربط الحساب */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpenLinkModal}
                style={{
                  marginTop: 20,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  width: '100%',
                }}
              >
                <View style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  height: 52,
                }}>
                  <LinkIcon />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    marginRight: 10,
                  }}>
                    ربط حساب الطفل
                  </Text>
                </View>

                {/* الشريط العمودي المتحرك */}
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: 10,
                    backgroundColor: 'rgba(255,255,255,0.45)',
                    borderRadius: 6,
                    transform: [
                      { skewX: '-18deg' },
                      {
                        translateX: linkButtonSweep.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, width + 50],
                        }),
                      },
                    ],
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* الأزرار السريعة - مخفية مؤقتاً */}
        {false && (
        <View style={{
          flexDirection: 'row-reverse',
          gap: 12,
          marginHorizontal: 20,
          marginBottom: 20,
        }}>
          {/* زر الرسومات */}
          <TouchableOpacity
            onPress={handleViewAnalytics}
            activeOpacity={0.8}
            style={{ flex: 1 }}
          >
            <View style={{
              backgroundColor: '#7C3AED',
              paddingVertical: 14,
              paddingHorizontal: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              height: 50,
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#FFFFFF',
              }}>📊 الرسومات</Text>
            </View>
          </TouchableOpacity>

          {/* زر إضافة نقاط */}
          <TouchableOpacity
            onPress={handleAddTestPoints}
            activeOpacity={0.8}
            style={{ flex: 1 }}
          >
            <View style={{
              backgroundColor: '#FF6B6B',
              paddingVertical: 14,
              paddingHorizontal: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              height: 50,
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#FFFFFF',
              }}>إضافة نقاط +</Text>
            </View>
          </TouchableOpacity>

        </View>
        )}

        {/* سجل الشارات الأفقي */}
        {currentChild.badges && currentChild.badges.length > 0 && (
          <View style={styles.badgesSection}>
            {/* خط فاصل مع النص */}
            <View style={styles.badgesDividerContainer}>
              <View style={styles.badgesDividerLine} />
              <Text style={styles.badgesDividerText}>سجل الشارات</Text>
              <View style={styles.badgesDividerLine} />
            </View>

            <View style={styles.badgesScrollWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgesScrollContent}
              >
                {[...currentChild.badges]
                  .sort((a, b) => b.level - a.level)
                  .map((badge) => (
                    <TouchableOpacity
                      key={badge.id}
                      style={styles.badgeItem}
                      onPress={() => handleBadgePress(badge)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.badgeCircle}>
                        <Text style={styles.badgeItemEmoji}>{badge.emoji}</Text>
                      </View>
                      <Text style={styles.badgeLevel}>لفل {badge.level}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* خط فاصل بين الشارات والمهام مع النص */}
        <View style={styles.sectionDividerContainer}>
          <View style={styles.sectionDividerLine} />
          <Text style={styles.sectionDividerText}>المهام</Text>
          <View style={styles.sectionDividerLine} />
        </View>

        {/* قسم المهام */}
        <View style={styles.tasksSection}>
          {/* زر إضافة مهمة بنفس تصميم إضافة طفل */}
          <AddTaskButton onPress={() => setShowAddTaskModal(true)} />

          {/* المهام المعلقة */}
          {pendingTasks.length > 0 && (
            <View style={styles.tasksList}>
              <Text style={styles.tasksSubtitle}>
                المهام المعلقة ({pendingTasks.length})
              </Text>
              {pendingTasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 18,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <View style={styles.taskContent}>
                      {/* الجزء الأيسر – نقاط / صعوبة / تكرار */}
                      <View style={styles.taskInfo}>
                        <View style={styles.taskPoints}>
                          <StarIcon size={14} />
                          <Text style={styles.taskPointsText}>
                            {task.points} نقطة
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.difficultyBadge,
                            { backgroundColor: getDifficultyColor(task.difficulty) },
                          ]}
                        >
                          <Text style={styles.difficultyText}>
                            {getDifficultyLabel(task.difficulty)}
                          </Text>
                        </View>
                        <View style={styles.frequencyBadgeSingle}>
                          <Text style={styles.frequencyEmojiSingle}>
                            {getFrequencyIcon(task.frequency)}
                          </Text>
                          <Text style={styles.frequencyTextSingle}>
                            {getFrequencyLabel(task.frequency)}
                          </Text>
                        </View>
                      </View>

                      {/* الجزء الأيمن – العنوان والأكشن */}
                      <View style={styles.taskRight}>
                        <View style={styles.taskTitleRow}>
                          <View style={styles.taskActions}>
                            <TouchableOpacity
                              style={styles.taskActionButton}
                              onPress={() => handleDeleteTask(task.id)}
                            >
                              <DeleteIcon />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                        </View>
                        {task.description && (
                          <Text style={styles.taskDescription}>
                            {task.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* المهام المكتملة */}
          {completedTasks.length > 0 && (
            <View style={styles.tasksList}>
              <Text style={styles.tasksSubtitle}>
                المهام المكتملة ({completedTasks.length})
              </Text>
              {completedTasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View
                    style={{
                      backgroundColor: 'rgba(76, 175, 80, 0.12)',
                      borderRadius: 18,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: 'rgba(76, 175, 80, 0.25)',
                    }}
                  >
                    <View style={styles.completedBadge}>
                      <CheckCircleIcon />
                    </View>

                    <View style={styles.taskContent}>
                      <View style={[styles.taskInfo, { opacity: 0.6 }]}>
                        <View style={styles.taskPoints}>
                          <StarIcon size={14} />
                          <Text style={styles.taskPointsText}>
                            {task.points} نقطة
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.difficultyBadge,
                            { backgroundColor: getDifficultyColor(task.difficulty) },
                          ]}
                        >
                          <Text style={styles.difficultyText}>
                            {getDifficultyLabel(task.difficulty)}
                          </Text>
                        </View>
                        <View style={styles.frequencyBadgeSingle}>
                          <Text style={styles.frequencyEmojiSingle}>
                            {getFrequencyIcon(task.frequency)}
                          </Text>
                          <Text style={styles.frequencyTextSingle}>
                            {getFrequencyLabel(task.frequency)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.taskRight}>
                        <Text
                          style={[styles.taskTitle, styles.taskTitleCompleted]}
                        >
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text
                            style={[
                              styles.taskDescription,
                              styles.taskTitleCompleted,
                            ]}
                          >
                            {task.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* لو ما فيه مهام */}
          {tasks.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>لا توجد مهام حالياً</Text>
              <Text style={styles.emptySubtext}>ابدأ بإضافة مهمة جديدة</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* مودال إضافة مهمة */}
      <AddTaskModal
        visible={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
        childName={currentChild.name}
        childAvatar={currentChild.avatar}
        isAvatarImage={currentChild.isAvatarImage}
      />

      {/* مودال تعديل الطفل */}
      <EditChildModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditChild}
        child={currentChild}
      />

      {/* مودال تفاصيل الشارة */}
      <BadgeDetailModal
        visible={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        badge={selectedBadge}
        childName={currentChild.name}
        childGender={currentChild.gender}
      />

      {/* مودال تعليمات الربط */}
      <LinkInstructionsModal
        visible={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        childName={currentChild.name}
        childId={currentChild.id}
        qrCodeDataUrl={qrCodeDataUrl}
        qrToken={qrToken}
        qrLoading={qrLoading}
        qrError={qrError}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  infoCard: {
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  infoCardGradient: {
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  avatarEmoji: {
    fontSize: 45,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  childName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  levelProgressSection: {
    width: '100%',
  },
  levelProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelProgressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  levelProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  levelProgressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 5,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  linkButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  linkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // شريط اللمعة لزر الربط
  linkButtonSweepBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 6,
    transform: [{ skewX: '-18deg' }],
  },
  // TEMPORARY: styles للأزرار المؤقتة
  testButtonsContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  testButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  testButtonLeft: {
    shadowColor: '#FF6B6B',
  },
  testButtonRight: {
    shadowColor: '#667eea',
  },
  analyticsButton: {
    shadowColor: '#7C3AED',
  },
  testButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgesSection: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  // خط فاصل سجل الشارات
  badgesDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  badgesDividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  badgesDividerText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
  },
  badgesSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'right',
  },
  badgesScrollWrapper: {
    width: '100%',
  },
  badgesScrollContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  badgeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeItemEmoji: {
    fontSize: 32,
  },
  badgeLevel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  // خط فاصل بين الشارات والمهام مع النص
  sectionDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
    gap: 12,
  },
  sectionDividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  sectionDividerText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
  },
  tasksSection: {
    paddingHorizontal: 20,
  },
  tasksSectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  // ستايلات زر إضافة مهمة الجديد (بنفس لون إضافة طفل)
  addTaskButtonContainer: {
    marginBottom: 20,
  },
  addTaskButtonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
  },
  addTaskButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  // شريط اللمعة
  sweepBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 6,
    transform: [{ skewX: '-18deg' }],
  },
  // الستايلات القديمة (سنحتفظ بها للتوافق)
  addTaskButton: {
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#000000',
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 12,
  },
  addTaskButtonInner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
  },
  addTaskText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tasksList: {
    marginBottom: 25,
  },
  tasksSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'right',
  },
  taskCard: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  taskCardGradient: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  taskRight: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#333333',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'right',
  },
  taskDescription: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 18,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 6,
  },
  taskActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  taskPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  taskPointsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
  },
  frequencyBadgeSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    alignSelf: 'stretch',
  },
  frequencyEmojiSingle: {
    fontSize: 12,
  },
  frequencyTextSingle: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
  },
});

// Modal Styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  content: {
    padding: 30,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 30,
    color: '#666',
    fontWeight: '300',
    marginTop: -3,
  },
  badgeContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  badgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  badgeEmoji: {
    fontSize: 60,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  star: {
    fontSize: 24,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '600',
  },
  detailsBox: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  detailsGradient: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 15,
  },
  messageBox: {
    width: '100%',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  messageIcon: {
    fontSize: 24,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '700',
    textAlign: 'right',
  },
  bottomButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  bottomButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

// Link Modal Styles
const linkModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: width * 0.92,
    maxWidth: 450,
    maxHeight: '90%',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  content: {
    padding: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 30,
    color: '#666',
    fontWeight: '300',
    marginTop: -3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  qrContainer: {
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '700',
    textAlign: 'center',
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    textAlign: 'right',
    fontWeight: '600',
  },
  bottomButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  bottomButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
