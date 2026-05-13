// screens/home/DashboardScreen.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  AppState,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { AppModal } from '../../components/AppModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Child } from '../../types';
import { AddChildModal } from '../../components/AddChildModal';
import { NotificationsModal } from '../../components/NotificationsModal';
import { MotivitoLogo } from '../../components/MotivitoLogo';
import { useChildren } from '../../contexts/ChildrenContext';
import { getLatestBadge, calculateBadges } from '../../utils/badgeUtils';
import { parentApi } from '../../services/api';
import { iapManager, PRODUCT_IDS } from '../../services/iap';

const { width, height } = Dimensions.get('window');

// Icons
const StarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFD700"/>
  </Svg>
);
const TrophyIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24">
    <Path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z" fill="#FFD700"/>
  </Svg>
);
const BellIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#667eea"/>
  </Svg>
);
const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="#FF0000"
    />
  </Svg>
);


// رسائل تحفيزية
const GIRL_MOTIVATIONAL_MESSAGES = [
  'ابنتك {name} تتقدم بثقة وتثبت أنها قادرة على تحقيق المزيد كل يوم',
  'إنجاز جديد يضاف لابنتك {name}… حماسها يلهم الجميع',
  'ابنتك {name} تُظهر قوة رائعة في تقدمها وتستمر في طريق النجاح',
  'خطوة مميزة من ابنتك {name} اليوم… وتستحق كل إشادة',
  'ابنتك {name} تبذل جهدًا ملحوظًا وتثبت شغفها بالتطور',
  'تقدم جميل من ابنتك {name}… دافعها الداخلي يصنع الفارق',
  'ابنتك {name} تحقق نتائج رائعة وتستحق كل التقدير',
  'إبداع ملموس من ابنتك {name}… استمرارها يبني مستقبلها',
  'ابنتك {name} تُثبت يومياً أنها مثابرة وطموحة',
  'نجاح جديد لابنتك {name}… عزيمتها تفتح لها أبواب التميز',
];
const BOY_MOTIVATIONAL_MESSAGES = [
  'ابنك {name} يتقدم بخطى واثقة ويثبت قدرته على تحقيق الأهداف كل يوم',
  'إنجاز مميز من ابنك {name}… اصراره يصنع الفرق',
  'ابنك {name} يُظهر عزيمة قوية في تقدمه و مستمر في طريق التفوق',
  'خطوة رائعة من ابنك {name} اليوم… ويستحق كل تشجيع',
  'ابنك {name} يبذل جهدًا واضحًا ويثبت حماسه للتطور',
  'تقدم ملحوظ من ابنك {name}… إصراره الداخلي يقوده للنجاح',
  'ابنك {name} يحقق نتائج مبهرة ويستحق كل الفخر',
  'إبداع حقيقي من ابنك {name}… استمراره يبني شخصيته القوية',
  'ابنك {name} يُثبت يومياً أنه مجتهد وطموح',
  'نجاح جديد لابنك {name}… تصميمه يفتح له أبواب التميز',
];

const getMotivationalMessage = (childName: string, gender: 'boy' | 'girl', badgeEmoji: string, msgIdx: number) => {
  const messages = gender === 'girl' ? GIRL_MOTIVATIONAL_MESSAGES : BOY_MOTIVATIONAL_MESSAGES;
  const msg = messages[msgIdx % messages.length];
  const parts = msg.split('{name}');
  return (
    <>
      {parts[0]}
      <Text style={{ color: '#FFD700', fontWeight: '900' }}>{childName}</Text>
      {parts[1]} {badgeEmoji}
    </>
  );
};

/* ============== كرت الإضافة بنفس حجم بطاقة الطفل بالضبط ============== */
/* نمرّر ارتفاع البطاقة المطلوب ونستخدمه حرفياً. وفيه شريط عمودي يلمع ويمشي أفقياً. */
const AddChildRow = ({ onPress, targetHeight }: { onPress: () => void; targetHeight: number }) => {
  const sweep = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 2200, useNativeDriver: false })).start();
  }, []);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, (width - 40) + 50], // تقريبي لعرض الكرت داخل الهوامش
  });

  return (
    <View style={styles.childCardWrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.addChildCard}
      >
        {/* الشريط العمودي النحيف يمشي أفقياً */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sweepBar,
            {
              transform: [{ translateX }],
            },
          ]}
        />

        <View style={styles.childCardContent}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderWidth: 2,
              borderColor: '#000',
              overflow: 'hidden',
              marginRight: 14,
            }}
          >
            <Text style={styles.addChildEmoji}>➕</Text>
          </View>

          <View style={styles.childInfo}>
            <View style={styles.childHeader}>
              <Text style={styles.addChildText}>إضافة طفل</Text>
              <View style={styles.addChildPointsEmpty}>
                <Svg width="16" height="16" viewBox="0 0 24 24">
                  <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                </Svg>
              </View>
            </View>

            <View style={[styles.childLevelContainer, { marginTop: 4 }]}>
              <View style={styles.childProgressBar}>
                <View style={[styles.childProgressBackground, { borderColor: 'rgba(255,255,255,0.5)' }]}>
                  <View style={[styles.childProgressFill, { width: '0%', backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                </View>
                <Text style={styles.childProgressText}> </Text>
              </View>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* جرس وهمي شفاف لضبط العرض مثل بقية المربعات */}
      <View style={[styles.bellButton, { opacity: 0 }]} pointerEvents="none" />
    </View>
  );
};
/* ======================================================================= */

export const DashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { children, loading, addChild, updateChild, deleteChild, isPremium, togglePremium, refreshChildren, refreshPremiumStatus } = useChildren();
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<{ [childId: string]: { tasks: number; rewards: number } }>({});
  const [motivationalMsgIdx, setMotivationalMsgIdx] = useState(() => Math.floor(Math.random() * 10));
  const [refreshing, setRefreshing] = useState(false);

  // Child message queue (battle pass messages from child to parent)
  const [pendingMessages, setPendingMessages] = useState<Array<{ id: string; title: string; body: string; data: any }>>([]);
  const [currentMessage, setCurrentMessage] = useState<{ id: string; title: string; body: string; data: any } | null>(null);
  const msgScaleAnim = useRef(new Animated.Value(0)).current;
  const msgOpacityAnim = useRef(new Animated.Value(0)).current;
  const msgFloatAnim = useRef(new Animated.Value(0)).current;

  // Directly show a message (bypasses useEffect chain)
  const showMessage = useCallback((msgs: Array<{ id: string; title: string; body: string; data: any }>) => {
    if (msgs.length === 0) return;
    setPendingMessages(msgs);
    setCurrentMessage(prev => (prev === null ? msgs[0] : prev));
  }, []);

  const fetchPendingMessages = useCallback(async () => {
    // 1. Check AsyncStorage queue first (same-device: child claimed → parent sees it)
    try {
      const saved = await AsyncStorage.getItem('@parent_msg_queue');
      if (saved) {
        const queue: Array<{ id: string; title: string; body: string; data: any }> = JSON.parse(saved);
        if (queue.length > 0) {
          showMessage(queue);
          return;
        }
      }
    } catch {}

    // 2. Try new /parent-messages endpoint (works after Railway deployment)
    try {
      const res = await parentApi.get('/api/notifications/parent-messages');
      if (res.data && res.data.length > 0) {
        const msgs = (res.data as any[]).map((n: any) => ({
          id: n.id, title: n.title, body: n.body, data: n.data,
        }));
        showMessage(msgs);
        return;
      }
    } catch {}

    // 3. Fallback: existing /api/notifications endpoint (always on Railway)
    try {
      const res = await parentApi.get('/api/notifications');
      const all: any[] = res.data?.notifications || [];
      const childMsgs = all
        .filter(n => n.type === 'battle_pass_unlock' && !n.isRead && n.data?.category === 'child_message')
        .map(n => ({ id: n.id, title: n.title, body: n.body, data: n.data }));
      if (childMsgs.length > 0) showMessage(childMsgs);
    } catch {}
  }, [showMessage]);

  // Animation starts AFTER currentMessage is set (Modal is visible)
  useEffect(() => {
    if (!currentMessage) return;
    msgScaleAnim.setValue(0);
    msgOpacityAnim.setValue(0);
    msgFloatAnim.setValue(30);
    Animated.parallel([
      Animated.spring(msgScaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(msgOpacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(msgFloatAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, [currentMessage]);

  const dismissCurrentMessage = async () => {
    if (!currentMessage) return;
    const msgId = currentMessage.id;

    // Remove from AsyncStorage queue
    try {
      const saved = await AsyncStorage.getItem('@parent_msg_queue');
      if (saved) {
        const queue = JSON.parse(saved).filter((m: any) => m.id !== msgId);
        await AsyncStorage.setItem('@parent_msg_queue', JSON.stringify(queue));
      }
    } catch {}

    // Mark as read on backend (if API is available)
    parentApi.put(`/api/notifications/${msgId}/read`).catch(() => {});

    // Show next message if any, otherwise clear
    const remaining = pendingMessages.filter(m => m.id !== msgId);
    setPendingMessages(remaining);
    setCurrentMessage(remaining.length > 0 ? remaining[0] : null);
  };

  // Change motivational message every 5 minutes only
  useEffect(() => {
    const iv = setInterval(() => {
      setMotivationalMsgIdx(Math.floor(Math.random() * 10));
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const fetchNotificationCounts = useCallback(async () => {
    try {
      const [tasksRes, rewardsRes] = await Promise.all([
        parentApi.get('/api/tasks/pending-approval').catch(() => ({ data: [] })),
        parentApi.get('/api/reward-requests').catch(() => ({ data: [] })),
      ]);
      const counts: { [childId: string]: { tasks: number; rewards: number } } = {};
      for (const task of (tasksRes.data || [])) {
        const cid = task.child?.id;
        if (!cid) continue;
        if (!counts[cid]) counts[cid] = { tasks: 0, rewards: 0 };
        counts[cid].tasks += 1;
      }
      for (const req of (rewardsRes.data || [])) {
        const cid = req.child?.id;
        if (!cid) continue;
        if (!counts[cid]) counts[cid] = { tasks: 0, rewards: 0 };
        counts[cid].rewards += 1;
      }
      setNotificationCounts(counts);
    } catch {}
  }, []);

  const refreshAll = useCallback(() => {
    refreshChildren();
    fetchNotificationCounts();
    fetchPendingMessages();
  }, [refreshChildren, fetchNotificationCounts, fetchPendingMessages]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshChildren(), fetchNotificationCounts(), fetchPendingMessages()]);
    setRefreshing(false);
  }, [refreshChildren, fetchNotificationCounts, fetchPendingMessages]);

  // Initial load
  useEffect(() => {
    fetchNotificationCounts();
    fetchPendingMessages();
  }, [fetchNotificationCounts, fetchPendingMessages]);

  // Refresh when screen is focused (e.g. coming back from child detail)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refreshAll);
    return unsubscribe;
  }, [navigation, refreshAll]);

  // Refresh when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refreshAll();
    });
    return () => sub.remove();
  }, [refreshAll]);

  // نقيس ارتفاع أول بطاقة طفل لنطبّقه على كرت الإضافة
  const [rowHeight, setRowHeight] = useState<number>(92); // قيمة افتراضية معقولة

  // أنيميشن اللمعان للزر البسيط
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false
      })
    ).start();
  }, []);

  const getChildWithLatestBadge = () => {
    const childrenWithBadges = children.filter(c => getLatestBadge(c.badges) !== null);
    if (childrenWithBadges.length === 0) return null;
    return childrenWithBadges.sort((a, b) => {
      const aB = getLatestBadge(a.badges);
      const bB = getLatestBadge(b.badges);
      return (bB?.level || 0) - (aB?.level || 0);
    })[0];
  };

  const topChild = getChildWithLatestBadge();
  const otherChildren = topChild ? children.filter(c => c.id !== topChild.id) : children;

  // أنيميشن للبادج فقط
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const badgeRotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScaleAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(badgeScaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(Animated.timing(badgeRotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })).start();
  }, []);

  const handleBellPress = (childId: string) => {
    setSelectedChildId(childId);
    setShowNotificationsModal(true);
  };

  const handleNotificationsClose = () => {
    setShowNotificationsModal(false);
    refreshAll();
  };
  const getLevelProgress = (child: Child) => {
    const currentXP = child.xp || 0;
    const pointsForCurrentLevel = (child.level + 1) * 100;
    return currentXP / pointsForCurrentLevel;
  };

  const handleAddChildPress = () => {
    if (!isPremium && children.length >= 1) {
      Alert.alert(
        'عذراً',
        'لا يمكنك إضافة طفل آخر في الخطة المجانية',
        [
          { text: 'حسناً', onPress: () => setShowUpgradeModal(true) },
        ]
      );
      return;
    }
    if (isPremium && children.length >= 4) {
      Alert.alert('تنبيه', 'وصلت للحد الأقصى وهو ٥ أطفال');
      return;
    }
    setShowAddChildModal(true);
  };

  const handleAddChild = async (newChild: { name: string; avatar: string; isAvatarImage?: boolean; gender: 'boy'|'girl' }) => {
    try {
      const res = await parentApi.post('/api/children', {
        name: newChild.name,
        avatar: newChild.avatar,
        gender: newChild.gender,
        color: newChild.gender === 'boy' ? '#4facfe' : '#f093fb',
        isAvatarImage: newChild.isAvatarImage || false,
      });
      const apiChild = res.data;
      const child: Child = {
        id: apiChild.id,
        name: apiChild.name,
        avatar: apiChild.avatar || newChild.avatar,
        isAvatarImage: apiChild.isAvatarImage || false,
        level: apiChild.level || 1,
        xp: apiChild.xp || 0,
        stars: apiChild.stars || 0,
        totalStars: apiChild.totalStars || 0,
        color: apiChild.color || (newChild.gender === 'boy' ? '#4facfe' : '#f093fb'),
        gender: newChild.gender,
        badges: calculateBadges(1, newChild.gender),
      };
      addChild(child);
      setShowAddChildModal(false);
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل في إضافة الطفل، حاول مجدداً');
    }
  };

  const handleUpdateChild = (updated: Child) => updateChild(updated);
  const handleDeleteChild = async (childId: string) => {
    try {
      await parentApi.delete(`/api/children/${childId}`);
    } catch {
      // إذا فشل الحذف من الـ API، ما نحذفه من الـ local
      Alert.alert('خطأ', 'فشل في حذف الطفل من السيرفر');
      return;
    }
    deleteChild(childId);
  };
  const handleChildPress = (child: Child) =>
    navigation.navigate('ChildDetail', { child, onUpdateChild: handleUpdateChild, onDeleteChild: handleDeleteChild });

  const handleUpgrade = async () => {
    setShowUpgradeModal(false);
    setPurchasing(true);
    try {
      await iapManager.purchase(PRODUCT_IDS.MONTHLY, async () => {
        await refreshPremiumStatus();
        await refreshChildren();
      });
      Alert.alert('مبروك! 🎉', 'تم تفعيل اشتراكك بنجاح');
    } catch (err: any) {
      if (err !== null) {
        Alert.alert('خطأ', err || 'تعذّر إتمام عملية الشراء، حاول مرة أخرى');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setShowUpgradeModal(false);
    setPurchasing(true);
    try {
      await iapManager.restore(async () => {
        await refreshPremiumStatus();
        await refreshChildren();
      });
      Alert.alert('تمّ! 🎉', 'تم استعادة اشتراكك بنجاح');
    } catch (err: any) {
      Alert.alert('تنبيه', err?.response?.data?.error || err?.message || 'لا توجد مشتريات سابقة لاستعادتها');
    } finally {
      setPurchasing(false);
    }
  };

  const latestBadge = topChild ? getLatestBadge(topChild.badges) : null;

  // Loading spinner while fetching children for the first time
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#7241c6', justifyContent: 'center', alignItems: 'center' }}>
        <LinearGradient
          colors={['#7241c6','#5c34a3','#7241c6']}
          locations={[0,0.5,1]}
          start={{x:0,y:0}} end={{x:1,y:1}}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  // إذا لم يكن هناك أطفال على الإطلاق، نعرض شاشة الترحيب
  if (children.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.background}>
          <LinearGradient colors={['#7241c6','#5c34a3','#7241c6']}
                          locations={[0,0.5,1]}
                          start={{x:0,y:0}} end={{x:1,y:1}}
                          style={StyleSheet.absoluteFill}/>
        </View>

        {/* شاشة الترحيب للمستخدم الجديد - ثابتة بدون سكرول */}
        <View style={styles.welcomeScreenContainer}>
          <View style={styles.welcomeContentTop}>
            <View style={styles.welcomeLogoContainer}>
              <MotivitoLogo size={140}/>
            </View>

            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>مرحباً في Motivito</Text>
              <Text style={styles.welcomeSubtitle}>ابدأ رحلة التحفيز مع أطفالك</Text>
              <Text style={styles.welcomeDescription}>
                أضف أول طفل لك وابدأ في تتبع إنجازاته ومكافأته على تقدمه اليومي
              </Text>
            </View>

            <View style={styles.welcomeFeaturesContainer}>
              <View style={styles.welcomeFeatureItem}>
                <View style={styles.welcomeFeatureIcon}>
                  <TrophyIcon />
                </View>
                <Text style={styles.welcomeFeatureText}>تتبع الإنجازات</Text>
              </View>
              <View style={styles.welcomeFeatureItem}>
                <View style={styles.welcomeFeatureIcon}>
                  <StarIcon />
                </View>
                <Text style={styles.welcomeFeatureText}>نظام المكافآت</Text>
              </View>
              <View style={styles.welcomeFeatureItem}>
                <View style={styles.welcomeFeatureIcon}>
                  <Svg width="16" height="16" viewBox="0 0 24 24">
                    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#FFD700"/>
                  </Svg>
                </View>
                <Text style={styles.welcomeFeatureText}>رسائل تحفيزية</Text>
              </View>
            </View>
          </View>

          {/* زر الإضافة في الأسفل بتصميم بسيط مع لمعان */}
          <View style={styles.welcomeAddButtonContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddChildPress}
              style={styles.simpleAddButton}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.simpleAddButtonSweep,
                  {
                    transform: [{
                      translateX: sweep.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-(width - 40) - 50, (width - 40) + 50],
                      })
                    }],
                  },
                ]}
              />
              <Text style={styles.simpleAddButtonIcon}>+</Text>
              <Text style={styles.simpleAddButtonText}>إضافة طفل</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AddChildModal visible={showAddChildModal} onClose={() => setShowAddChildModal(false)} onSubmit={handleAddChild}/>
        <NotificationsModal visible={showNotificationsModal} childId={selectedChildId || ''} onClose={handleNotificationsClose} onAction={refreshAll}/>
      </View>
    );
  }

  // شاشة الداش بورد الرئيسية
  return (
    <View style={styles.container}>
      {purchasing && (
        <Modal transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        </Modal>
      )}
      <View style={styles.background}>
        <LinearGradient colors={['#7241c6','#5c34a3','#7241c6']} locations={[0,0.5,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 15 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFD700"
            colors={['#FFD700']}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* خط فاصل الطفل المتقدم */}
        <View style={styles.topChildDividerContainer}>
          <View style={styles.topChildDividerLine} />
          <Text style={styles.topChildDividerText}>الطفل المتقدم</Text>
          <View style={styles.topChildDividerLine} />
        </View>

        {/* بطاقة المتصدر أو رسالة تحفيزية */}
        {topChild && latestBadge ? (
          <>
            <ChampionCard child={topChild} onPress={() => handleChildPress(topChild)} badgeScaleAnim={badgeScaleAnim} badgeRotateAnim={badgeRotateAnim} />

            {/* تحفيز */}
            <View style={styles.motivationalSection}>
              <View style={styles.motivationalCard}>
                <View style={styles.logoContainerCardCenter}><MotivitoLogo size={60}/></View>
                <Text style={styles.motivationalText}>
                  {getMotivationalMessage(topChild.name, topChild.gender, latestBadge.emoji, motivationalMsgIdx)}
                </Text>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine}/>
                <Text style={styles.dividerText}>الأطفال</Text>
                <View style={styles.dividerLine}/>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.motivationalSection}>
            <View style={styles.motivationalCard}>
              <View style={styles.logoContainerCardCenter}><MotivitoLogo size={60}/></View>
              <Text style={styles.motivationalText}>
                أضف مهام لأطفالك وتابع تقدمهم لتكتشف من سيكون الأول بينهم!
              </Text>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine}/>
              <Text style={styles.dividerText}>الأطفال</Text>
              <View style={styles.dividerLine}/>
            </View>
          </View>
        )}

        {/* قائمة الأطفال */}
        <View style={styles.childrenSection}>
          {children.map((child, idx) => {
            const progress = getLevelProgress(child);
            const childNotifications = notificationCounts[child.id] || { tasks: 0, rewards: 0 };
            const notificationCount = childNotifications.tasks + childNotifications.rewards;

            return (
              <View key={child.id} style={styles.childCardWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleChildPress(child)}
                  style={styles.childCard}
                  onLayout={e => {
                    if (idx === 0 && rowHeight !== e.nativeEvent.layout.height) {
                      setRowHeight(e.nativeEvent.layout.height);
                    }
                  }}
                >
                  <View style={styles.childCardContent}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: child.isAvatarImage ? 'rgba(255,255,255,0.2)' : (child.gender === 'boy' ? '#4facfe' : '#f093fb'),
                        borderWidth: 2,
                        borderColor: '#000',
                        overflow: 'hidden',
                        marginRight: 14,
                      }}
                    >
                      {child.isAvatarImage
                        ? <Image source={{ uri: child.avatar }} style={styles.childAvatarImage} resizeMode="cover"/>
                        : <Text style={styles.childEmoji}>{child.avatar}</Text>}
                    </View>

                    <View style={styles.childInfo}>
                      <View style={styles.childHeader}>
                        <Text style={styles.childName}>{child.name}</Text>
                        <View style={styles.childPoints}><StarIcon/><Text style={styles.childPointsText}>{child.stars || 0}</Text></View>
                      </View>

                      <View style={styles.childLevelContainer}>
                        <Text style={styles.childLevelText}>المستوى {child.level}</Text>
                        <View style={styles.childProgressBar}>
                          <View style={styles.childProgressBackground}>
                            <Animated.View style={[styles.childProgressFill, { width: `${progress * 100}%`, backgroundColor: child.color }]}/>
                          </View>
                          <Text style={styles.childProgressText}>{child.xp || 0}/{(child.level + 1) * 100}</Text>
                        </View>
                      </View>
                    </View>

                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bellButton} activeOpacity={0.8} onPress={() => handleBellPress(child.id)}>
                  <BellIcon/>
                  {notificationCount > 0 && <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{notificationCount}</Text></View>}
                </TouchableOpacity>
              </View>
            );
          })}

          {/* كرت الإضافة بنفس ارتفاع بطاقة الطفل المقاسة */}
          <AddChildRow onPress={handleAddChildPress} targetHeight={rowHeight} />

          {/* خط فاصل العناصر المدفوعة */}
          <View style={styles.paidItemsDividerContainer}>
            <View style={styles.paidItemsDividerLine} />
            <Text style={styles.paidItemsDividerText}>العناصر المدفوعة</Text>
            <View style={styles.paidItemsDividerLine} />
          </View>

          {/* رف الإنجازات */}
          <AchievementShelfButton navigation={navigation} isPremium={isPremium} setShowUpgradeModal={setShowUpgradeModal} />

          {/* المحلل الذكي */}
          <SmartAnalyzerButton isPremium={isPremium} navigation={navigation} setShowUpgradeModal={setShowUpgradeModal} />
        </View>
      </ScrollView>

      <AddChildModal visible={showAddChildModal} onClose={() => setShowAddChildModal(false)} onSubmit={handleAddChild}/>
      <NotificationsModal visible={showNotificationsModal} onClose={handleNotificationsClose} childId={selectedChildId || ''} onAction={refreshAll}/>

      {/* Upgrade Modal */}
      <AppModal
        visible={showUpgradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.upgradeModalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowUpgradeModal(false)}
          />
          <View style={styles.upgradeModalContainer}>
            <View
              style={{
                flex: 1,
                width: '100%',
                backgroundColor: '#FFD700',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 25,
              }}>
              <View style={styles.upgradeModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowUpgradeModal(false)}
                  style={styles.upgradeCloseButton}>
                  <CloseIcon />
                </TouchableOpacity>
                <Text style={styles.upgradeModalTitle}>ترقية الحساب</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                <Text style={styles.upgradeTitle}>{isPremium ? 'تم فتح الميزات' : 'اشترك في VIP / Premium!'}</Text>
                <Text style={styles.upgradeDescription}>
                  احصل على مميزات حصرية لتحفيز أطفالك بشكل أفضل
                </Text>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>📚</Text>
                    <Text style={styles.featureText}>رف الإنجازات للوالد والطفل</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>🗺️</Text>
                    <Text style={styles.featureText}>خريطة الطفل التفاعلية</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>📊</Text>
                    <Text style={styles.featureText}>المحلل الذكي للأداء</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>⚔️</Text>
                    <Text style={styles.featureText}>المسار المميز في موتيفيتو باس</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>👨‍👧‍👦</Text>
                    <Text style={styles.featureText}>يمكنك إضافة حتى 5 أطفال</Text>
                  </View>
                </View>

                {isPremium ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20, marginBottom: 20 }}>
                    <View style={{
                      width: 90, height: 90, borderRadius: 45,
                      backgroundColor: '#4CAF50',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 3, borderColor: '#000',
                      shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
                    }}>
                      <Svg width="48" height="48" viewBox="0 0 24 24">
                        <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#FFFFFF" />
                      </Svg>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>شهر</Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.currency, { fontFamily: 'saudi_riyal', fontSize: 48 }]}>{'\u20C1'}</Text>
                        <Text style={styles.price}>١٤.٩٩</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.purchaseButton}
                      activeOpacity={0.8}
                      onPress={handleUpgrade}>
                      <View
                        style={{
                          paddingVertical: 16,
                          alignItems: 'center',
                          borderRadius: 18,
                          backgroundColor: '#4CAF50',
                          borderWidth: 2,
                          borderColor: '#000',
                        }}>
                        <Text style={styles.purchaseText}>اشتراك الآن</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleRestore}
                      style={{ marginTop: 8, alignItems: 'center', paddingVertical: 10 }}>
                      <Text style={{ fontSize: 14, color: '#667eea', textDecorationLine: 'underline' }}>
                        استعادة المشتريات السابقة
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </AppModal>

      {/* Child Message Modal — رسالة شكر من الطفل */}
      <AppModal visible={currentMessage !== null} transparent animationType="none" onRequestClose={dismissCurrentMessage}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' }}>
          {currentMessage && (
            <Animated.View style={{
              transform: [{ scale: msgScaleAnim }, { translateY: msgFloatAnim }],
              opacity: msgOpacityAnim,
              width: 310,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 20,
            }}>
              <View style={{ backgroundColor: '#1a0a3e', padding: 28, alignItems: 'center', borderRadius: 28, overflow: 'hidden' }}>

                {/* نجوم زخرفية */}
                <View style={{ position: 'absolute', top: 12, left: 16 }}>
                  <Text style={{ fontSize: 18, opacity: 0.5 }}>✨</Text>
                </View>
                <View style={{ position: 'absolute', top: 20, right: 20 }}>
                  <Text style={{ fontSize: 14, opacity: 0.4 }}>⭐</Text>
                </View>
                <View style={{ position: 'absolute', bottom: 40, left: 20 }}>
                  <Text style={{ fontSize: 12, opacity: 0.35 }}>💫</Text>
                </View>

                {/* دائرة 💌 */}
                <View style={{
                  width: 88, height: 88, borderRadius: 44,
                  backgroundColor: 'rgba(255,215,0,0.15)',
                  borderWidth: 2, borderColor: '#FFD700',
                  justifyContent: 'center', alignItems: 'center',
                  marginBottom: 18,
                }}>
                  <Text style={{ fontSize: 48 }}>💌</Text>
                </View>

                {/* عنوان ذهبي */}
                <Text style={{
                  fontSize: 17, fontWeight: '700', color: '#FFD700',
                  textAlign: 'center', marginBottom: 6,
                }}>
                  {currentMessage.title}
                </Text>

                {/* فاصل ذهبي */}
                <View style={{
                  width: 60, height: 2, backgroundColor: '#FFD700',
                  opacity: 0.4, borderRadius: 1, marginBottom: 16,
                }} />

                {/* نص الرسالة */}
                <Text style={{
                  fontSize: 20, color: '#ffffff', textAlign: 'center',
                  lineHeight: 30, fontWeight: '600', marginBottom: 28,
                  paddingHorizontal: 8,
                }}>
                  {currentMessage.body}
                </Text>

                {/* زر الإغلاق */}
                <TouchableOpacity
                  onPress={dismissCurrentMessage}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#FFD700', borderRadius: 16,
                    paddingVertical: 14, paddingHorizontal: 48,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a0a3e' }}>شكراً 🤍</Text>
                </TouchableOpacity>

                {/* عدد الرسائل المتبقية */}
                {pendingMessages.length > 1 && (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 14 }}>
                    {pendingMessages.length - 1} رسائل أخرى في الانتظار
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </AppModal>
    </View>
  );
};

/* بطاقة المتصدر منفصلة لتخفيف الملف */
const ChampionCard = ({ child, onPress, badgeScaleAnim, badgeRotateAnim }: any) => {
  const latest = getLatestBadge(child.badges);
  return (
    <View style={styles.championSection}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.championCard}>
        <Animated.View
          style={[
            styles.badgeIconInCard,
            {
              transform: [
                { scale: badgeScaleAnim },
                { rotate: badgeRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              ],
            },
          ]}
        >
          <Text style={styles.badgeIconEmoji}>{latest?.emoji}</Text>
        </Animated.View>

        <View style={styles.championContent}>
          <View style={styles.championAvatarContainer}>
            <View
              style={{
                width: 75,
                height: 75,
                borderRadius: 37.5,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#FFD700',
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.4)',
                overflow: 'hidden',
              }}
            >
              {child.isAvatarImage
                ? <Image source={{ uri: child.avatar }} style={styles.championAvatarImage} resizeMode="cover"/>
                : <Text style={styles.championEmoji}>{child.avatar}</Text>}
            </View>
          </View>

          <View style={styles.championInfo}>
            <Text style={styles.championName}>{child.name}</Text>

            <View style={styles.levelContainer}>
              <View style={styles.levelHeaderRow}>
                <Text style={styles.levelText}>المستوى {child.level}</Text>
                <View style={styles.championPointsBadge}><StarIcon/><Text style={styles.championPointsText}>{child.stars || 0}</Text></View>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${((child.xp || 0) / ((child.level + 1) * 100)) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{child.xp || 0}/{(child.level + 1) * 100}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// أيقونة القفل
const LockIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24">
    <Path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z" fill="#FFD700"/>
  </Svg>
);

const AchievementShelfButton = ({ navigation, isPremium, setShowUpgradeModal }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lockShakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // أنيميشن النبض البسيط
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // أنيميشن اهتزاز القفل
    if (!isPremium) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lockShakeAnim, {
            toValue: 8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(lockShakeAnim, {
            toValue: -8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(lockShakeAnim, {
            toValue: 8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(lockShakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(2500),
        ])
      ).start();
    }
  }, [isPremium]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: 24, marginBottom: 16 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (isPremium) {
            navigation.navigate('AchievementShelf');
          } else {
            setShowUpgradeModal(true);
          }
        }}
        style={{
          borderRadius: 18,
          borderWidth: 3,
          borderColor: '#8B5A3C',
          overflow: 'hidden',
          position: 'relative',
          opacity: isPremium ? 1 : 0.85,
        }}
      >
        {/* Background خشبي بدون Gradient */}
        <View style={{
          backgroundColor: '#A0745B',
          paddingHorizontal: 16,
          paddingVertical: 16,
          height: 82,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
          }}>
            {/* أيقونة الرف مع الإطار */}
            <View style={{
              width: 50,
              height: 50,
              marginRight: 14,
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}>
              <Image
                source={require('../../assets/frame.png')}
                style={{ position: 'absolute', width: 50, height: 50 }}
                resizeMode="contain"
              />
              <Svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute' }}>
                <Path d="M2 6H22M2 11H22M2 16H22" stroke="#654321" strokeWidth="2" strokeLinecap="round"/>
                <Path d="M10.5 8.5L12 9.2L13.5 8.5L12.8 10L14 11.2L12.5 11L12 12.5L11.5 11L10 11.2L11.2 10L10.5 8.5Z" fill="#FFD700"/>
              </Svg>
            </View>

            {/* النص */}
            <Text style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '800',
              textAlign: 'center',
              flex: 1,
            }}>
              رف الإنجازات
            </Text>

            {/* السهم */}
            <Text style={{
              color: '#FFFFFF',
              fontSize: 26,
              fontWeight: '700',
              marginLeft: 8,
            }}>
              ›
            </Text>
          </View>
        </View>

        {/* القفل */}
        {!isPremium && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 18,
              transform: [{ translateX: lockShakeAnim }],
            }}
          >
            <LockIcon />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// مربع المحلل الذكي
const SmartAnalyzerIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24">
    <Path d="M3.5 18.5L9.5 12.5L13.5 16.5L22 6.92L20.59 5.51L13.5 13.5L9.5 9.5L2 17L3.5 18.5Z" fill="#FFFFFF"/>
    <Path d="M20 7V13H22V7H20Z" fill="#FFFFFF"/>
    <Path d="M18 9V13H20V9H18Z" fill="#FFFFFF"/>
  </Svg>
);

const SmartAnalyzerButton = ({ isPremium, navigation, setShowUpgradeModal }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lockShakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // أنيميشن النبض البسيط
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // أنيميشن اهتزاز القفل
    if (!isPremium) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lockShakeAnim, {
            toValue: 8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(lockShakeAnim, {
            toValue: -8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(lockShakeAnim, {
            toValue: 8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(lockShakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(2500),
        ])
      ).start();
    }
  }, [isPremium]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (isPremium) {
            navigation.navigate('SmartAnalyzer');
          } else {
            setShowUpgradeModal(true);
          }
        }}
        style={{
          borderRadius: 18,
          borderWidth: 3,
          borderColor: '#2E5F8F',
          overflow: 'hidden',
          position: 'relative',
          opacity: isPremium ? 1 : 0.85,
        }}
      >
        {/* Background بدون Gradient - لون أزرق ثابت */}
        <View style={{
          backgroundColor: '#4A90E2',
          paddingHorizontal: 16,
          paddingVertical: 16,
          height: 82,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
          }}>
            {/* أيقونة المحلل */}
            <View style={{
              width: 50,
              height: 50,
              marginRight: 14,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 25,
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}>
              <SmartAnalyzerIcon />
            </View>

            {/* النص */}
            <Text style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '800',
              textAlign: 'center',
              flex: 1,
            }}>
              المحلل الذكي
            </Text>

            {/* السهم */}
            <Text style={{
              color: '#FFFFFF',
              fontSize: 26,
              fontWeight: '700',
              marginLeft: 8,
            }}>
              ›
            </Text>
          </View>
        </View>

        {/* القفل */}
        {!isPremium && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 18,
              transform: [{ translateX: lockShakeAnim }],
            }}
          >
            <LockIcon />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  scrollContent: { paddingTop: 90, paddingBottom: 120 },

  emptyStateContent: { paddingTop: 120, paddingBottom: 100, paddingHorizontal: 20 },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyStateText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 20, lineHeight: 28 },
  allChildrenSection: { marginTop: 20 },

  titleBar: {
    backgroundColor: 'rgba(26,26,46,0.98)',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 24,
    borderBottomWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    width: '100%', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
  },
  titleBarText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },

  championSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 25 },
  championCard: { borderRadius: 22, padding: 20, borderWidth: 3, borderColor: '#FFD700', backgroundColor: '#FFFFFF', position: 'relative' },
  badgeIconInCard: { position: 'absolute', top: 10, right: 15, width: 55, height: 55, justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: 27.5, borderWidth: 3, borderColor: '#FFD700' },
  badgeIconEmoji: { fontSize: 32 },
  championContent: { flexDirection: 'row', alignItems: 'center' },
  championAvatarContainer: { marginRight: 16 },
  championAvatar: { width: 75, height: 75, borderRadius: 37.5, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' },
  championEmoji: { fontSize: 38 },
  championAvatarImage: { width: 70, height: 70, borderRadius: 35 },
  championInfo: { flex: 1 },
  championName: { fontSize: 26, fontWeight: '900', color: '#333', marginBottom: 16 },
  levelContainer: { width: '100%' },
  levelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  levelText: { fontSize: 13, color: '#555', fontWeight: '700' },
  championPointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  championPointsText: { fontSize: 13, fontWeight: '800', color: '#FFD700' },
  progressBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBackground: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#000000' },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
  progressText: { fontSize: 11, color: '#666', fontWeight: '700', minWidth: 55 },

  motivationalSection: { paddingHorizontal: 20, marginBottom: 30 },
  motivationalCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', marginBottom: 25 },
  logoContainerCardCenter: { marginBottom: 15, alignItems: 'center' },
  motivationalText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },

  // خط فاصل الطفل المتقدم
  topChildDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 3,
    gap: 12,
  },
  topChildDividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  topChildDividerText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
  },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 2, backgroundColor: '#000000', borderRadius: 1 },
  dividerText: { fontSize: 15, fontWeight: '800', color: 'rgba(255,255,255,0.7)', paddingHorizontal: 12 },

  childrenSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'right' },

  childCardWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  childCard: { flex: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#000000', backgroundColor: '#FFFFFF', position: 'relative' },
  childCardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  childAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  childAvatarImage: { width: 56, height: 56, borderRadius: 28 },
  childEmoji: { fontSize: 28 },
  childInfo: { flex: 1 },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  childName: { fontSize: 18, fontWeight: '800', color: '#333' },
  childPoints: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  childPointsText: { fontSize: 13, fontWeight: '800', color: '#FFD700' },
  childLevelContainer: { gap: 6 },
  childLevelText: { fontSize: 12, color: '#666', fontWeight: '600' },
  childProgressBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  childProgressBackground: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#000000' },
  childProgressFill: { height: '100%', borderRadius: 3 },
  childProgressText: { fontSize: 10, color: '#666', fontWeight: '600', minWidth: 50 },
  arrow: { fontSize: 26, color: '#CCC', marginLeft: 8 },

  bellButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
  notificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF1493', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', paddingHorizontal: 4 },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },

  // شريط اللمعة لكرت الإضافة
  sweepBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 6,
    transform: [{ skewX: '-18deg' }],
  },

  // كرت الإضافة بنفس لون الرسالة التحفيزية
  addChildCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
  },
  addChildEmoji: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  addChildText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addChildPointsEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // أزرار الإضافة في حالة عدم وجود أطفال
  emptyAddChildContainer: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  addChildButtonLarge: { borderRadius: 25, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' },
  addChildButtonLargeGradient: { paddingHorizontal: 40, paddingVertical: 16 },
  addChildButtonLargeText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', textAlign: 'center' },

  childrenHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addChildButtonSmall: { borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  addChildButtonSmallGradient: { paddingHorizontal: 16, paddingVertical: 10 },
  addChildButtonSmallText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'center' },

  // خط فاصل العناصر المدفوعة
  paidItemsDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  paidItemsDividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  paidItemsDividerText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
  },

  // رف الإنجازات بتصميم خشبي كامل مع لمعان
  achievementShelfButton: {
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#8B5A3C',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  shelfShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  achievementShelfContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A0745B',
  },
  shelfFrameContainer: {
    width: 50,
    height: 50,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shelfFrameImage: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  shelfIconInFrame: {
    position: 'absolute',
  },
  achievementShelfText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  achievementShelfArrow: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginLeft: 8,
  },

  // المحلل الذكي بتصميم أزرق كامل
  smartAnalyzerButton: {
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#2E5F8F',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 12,
  },
  analyzerGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
  },
  smartAnalyzerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 15,
  },
  analyzerShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  smartAnalyzerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzerIconContainer: {
    width: 50,
    height: 50,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  smartAnalyzerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  smartAnalyzerArrow: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginLeft: 8,
  },

  // القفل المشترك
  lockedButton: {
    opacity: 0.85,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 18,
  },

  // شاشة الترحيب للمستخدم الجديد
  welcomeScreenContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 70,
  },
  welcomeContentTop: {
    flex: 1,
    paddingHorizontal: 15,
  },
  welcomeLogoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    padding: 24,
    marginHorizontal: 5,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeAddButton: {
    marginHorizontal: 30,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 30,
  },
  welcomeAddButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  welcomeAddButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  welcomeAddButtonIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  welcomeAddButtonContainer: {
    paddingHorizontal: 15,
    paddingBottom: 120,
  },
  // زر الإضافة البسيط مع لمعان
  simpleAddButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  simpleAddButtonSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 6,
    transform: [{ skewX: '-18deg' }],
  },
  simpleAddButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  simpleAddButtonIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  welcomeFeaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 10,
    marginBottom: 15,
  },
  welcomeFeatureItem: {
    flex: 1,
    maxWidth: 110,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  welcomeFeatureIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeFeatureText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },

  // شاشة عند وجود أطفال بدون تقدم
  noProgressContainer: {
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  noProgressTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  noProgressText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Upgrade Modal Styles
  upgradeModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  upgradeModalContainer: {
    height: height * 0.92,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#000000',
  },
  upgradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  upgradeModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
  },
  upgradeCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  upgradeDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  featuresList: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#000000',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
  },
  priceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
    color: '#333',
  },
  currency: {
    fontSize: 24,
    fontWeight: '900',
    color: '#666',
  },
  purchaseButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  purchaseText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
