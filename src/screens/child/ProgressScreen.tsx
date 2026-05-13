/**
 * ProgressScreen
 * ─────────────
 * Opened via the 🏆 trophy button on the map.
 * Shows: my current stage card (with image) → friends list below.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { childApi } from '../../services/api';
import { challengesData } from '../../data/challengesData';

// ─── Stage images ─────────────────────────────────────────────────────────────
const STAGE_IMAGES_BOY = [
  require('../../assets/BoyStage1.png'),
  require('../../assets/Stage2.png'),
  require('../../assets/Stage3.png'),
  require('../../assets/Stage4.png'),
  require('../../assets/Stage5.png'),
  require('../../assets/Stage6.png'),
  require('../../assets/Stage7.png'),
  require('../../assets/Stage8.png'),
  require('../../assets/Stage9.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../assets/BoyStage10 .png'),
];

const STAGE_IMAGES_GIRL = [
  require('../../assets/GirlStage1.png'),
  require('../../assets/Stage2.png'),
  require('../../assets/Stage3.png'),
  require('../../assets/Stage4.png'),
  require('../../assets/Stage5.png'),
  require('../../assets/Stage6.png'),
  require('../../assets/Stage7.png'),
  require('../../assets/Stage8.png'),
  require('../../assets/Stage9.png'),
  require('../../assets/GirlStage10.png'),
];

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FriendEntry {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  challengeLevel: number;
  addedAt: number;
}

interface Props {
  navigation?: any;
  route?: any;
}

const IMG_SIZE = 110;

const FRIEND_IMG_SIZE = 72;

// ─── FriendRow ────────────────────────────────────────────────────────────────
const FriendRow: React.FC<{ friend: FriendEntry; rank: number }> = ({ friend, rank }) => {
  const stageIdx  = Math.min(Math.max(friend.challengeLevel, 0), 9);
  const ch        = challengesData[stageIdx];
  const isFemale  = friend.gender === 'girl';
  const stageName = ch ? ((isFemale && ch.nameFemale) ? ch.nameFemale : ch.name) : '—';
  const progress  = Math.min(friend.challengeLevel / 10, 1);
  const images    = friend.gender === 'girl' ? STAGE_IMAGES_GIRL : STAGE_IMAGES_BOY;
  const img       = images[stageIdx];
  const rankEmoji = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : null;

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={fr.card}>
      {/* دايرة الصورة مع animation */}
      <Animated.View style={[fr.ringOuter, { transform: [{ scale: ringScale }] }]}>
        <View style={fr.imgCircle}>
          <Image source={img} style={fr.img} resizeMode="cover" />
        </View>
      </Animated.View>

      {/* Info */}
      <View style={{ flex: 1, marginRight: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          {rankEmoji && <Text style={{ fontSize: 16 }}>{rankEmoji}</Text>}
          <Text style={fr.name}>{friend.name}</Text>
        </View>
        <Text style={fr.stageLabel}>
          {friend.challengeLevel === 0
            ? 'لم يبدأ بعد'
            : friend.challengeLevel >= 10
            ? '👑 أكمل جميع المراحل!'
            : `${ch?.emoji ?? ''} ${stageName} · المرحلة ${friend.challengeLevel}`}
        </Text>
        <View style={fr.barBg}>
          <View style={[fr.barFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={fr.barTxt}>{friend.challengeLevel}/10</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const ProgressScreen: React.FC<Props> = ({ navigation, route }) => {
  const childId        = route?.params?.childId        ?? '';
  const childName      = route?.params?.childName      ?? 'الطفل';
  const childGender    = (route?.params?.childGender   ?? 'boy') as 'boy' | 'girl';
  const challengeLevel = route?.params?.challengeLevel ?? 0;

  const [friends, setFriends] = useState<FriendEntry[]>([]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const loadFriends = useCallback(async () => {
    try {
      const res = await childApi.get('/api/friends');
      setFriends(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  // إعادة تحميل كل ما تُفتح الشاشة
  useEffect(() => {
    if (!navigation) return;
    const unsub = navigation.addListener('focus', loadFriends);
    return unsub;
  }, [navigation, loadFriends]);

  // My current stage data — always show current stage image (index = challengeLevel, clamped 0-9)
  const myStageIdx  = Math.min(Math.max(challengeLevel, 0), 9);
  const myCh        = challengesData[myStageIdx];
  const myChCurrent = challengesData[challengeLevel];
  const isFemale    = childGender === 'girl';
  const myImages    = childGender === 'girl' ? STAGE_IMAGES_GIRL : STAGE_IMAGES_BOY;
  const myImg       = myImages[myStageIdx];
  const myStageName = myCh ? ((isFemale && myCh.nameFemale) ? myCh.nameFemale : myCh.name) : '—';

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  const sortedFriends = friends.slice().sort((a, b) => b.challengeLevel - a.challengeLevel);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0020' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0020" />

      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={sc.header}>
          <TouchableOpacity style={sc.backBtn} onPress={() => navigation?.goBack()}>
            <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <Text style={sc.title}>التقدم 🏆</Text>
          <View style={{ width: 46 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={sc.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* ── My Stage Card ── */}
          <View style={sc.myCard}>
            {/* Image circle with pulse ring */}
            <Animated.View style={[sc.ringOuter, { transform: [{ scale: ringScale }] }]}>
              <View style={sc.imgCircle}>
                <Image source={myImg} style={sc.myImg} resizeMode="cover" />
              </View>
            </Animated.View>

            {/* Text info */}
            <View style={sc.myInfo}>
              <Text style={sc.myName}>{childName}</Text>
              <Text style={sc.myStage}>
                {challengeLevel === 0
                  ? 'لم يبدأ بعد'
                  : challengeLevel >= 10
                  ? '👑 أكمل جميع المراحل!'
                  : `المرحلة ${challengeLevel}`}
              </Text>
              {challengeLevel > 0 && challengeLevel < 10 && (
                <Text style={sc.myStageName}>
                  {myCh?.emoji} {myStageName}
                </Text>
              )}

              {/* Progress bar */}
              <View style={sc.barBg}>
                <View style={[sc.barFill, { width: `${(challengeLevel / 10) * 100}%` as any }]} />
              </View>
              <Text style={sc.barTxt}>{challengeLevel}/10 مراحل</Text>

              {/* Next stage hint */}
              {myChCurrent && challengeLevel < 10 && (
                <View style={sc.nextHint}>
                  <Text style={sc.nextTxt}>
                    التالي: {myChCurrent.emoji} {isFemale && myChCurrent.nameFemale ? myChCurrent.nameFemale : myChCurrent.name}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Friends Section ── */}
          <Text style={sc.sectionTitle}>
            {friends.length === 0 ? '👥 الأصدقاء' : `👥 الأصدقاء (${friends.length})`}
          </Text>

          {friends.length === 0 ? (
            <View style={sc.emptyBox}>
              <Text style={{ fontSize: 44, marginBottom: 8 }}>🤝</Text>
              <Text style={sc.emptyTxt}>أضف أصدقاءك من زر الأصدقاء في الداشبورد</Text>
            </View>
          ) : (
            sortedFriends.map((f, i) => (
              <FriendRow key={f.id} friend={f} rank={i} />
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontSize: 20, fontWeight: '900', color: '#ede9fe',
  },

  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  // ── My card ──
  myCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e0d4a',
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.35)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
    gap: 18,
  },
  ringOuter: {
    width: IMG_SIZE + 12,
    height: IMG_SIZE + 12,
    borderRadius: (IMG_SIZE + 12) / 2,
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  imgCircle: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: IMG_SIZE / 2,
    backgroundColor: '#0e0624',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myImg: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: IMG_SIZE / 2 },
  myInfo: { flex: 1 },
  myName: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'right' },
  myStage: {
    fontSize: 14, color: '#a78bfa', fontWeight: '700',
    marginTop: 2, textAlign: 'right',
  },
  myStageName: {
    fontSize: 16, fontWeight: '800', color: '#ede9fe',
    marginTop: 2, textAlign: 'right',
  },
  barBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3, marginTop: 10, overflow: 'hidden',
  },
  barFill: { height: 6, backgroundColor: '#FFD700', borderRadius: 3 },
  barTxt: {
    fontSize: 11, color: 'rgba(255,255,255,0.45)',
    marginTop: 4, textAlign: 'right',
  },
  nextHint: {
    marginTop: 8,
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-end',
  },
  nextTxt: { fontSize: 12, color: '#c4b5fd', fontWeight: '700' },

  sectionTitle: {
    fontSize: 15, fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12, textAlign: 'right',
  },
  emptyBox: {
    alignItems: 'center', paddingVertical: 30,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyTxt: {
    fontSize: 14, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', paddingHorizontal: 24,
  },
});

const fr = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a0e42',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    gap: 14,
  },
  ringOuter: {
    width: FRIEND_IMG_SIZE + 10,
    height: FRIEND_IMG_SIZE + 10,
    borderRadius: (FRIEND_IMG_SIZE + 10) / 2,
    borderWidth: 2.5,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  imgCircle: {
    width: FRIEND_IMG_SIZE,
    height: FRIEND_IMG_SIZE,
    borderRadius: FRIEND_IMG_SIZE / 2,
    backgroundColor: '#0e0624',
    overflow: 'hidden',
  },
  img: { width: FRIEND_IMG_SIZE, height: FRIEND_IMG_SIZE, borderRadius: FRIEND_IMG_SIZE / 2 },
  name: { fontSize: 16, fontWeight: '900', color: '#ede9fe', textAlign: 'right' },
  stageLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3, textAlign: 'right' },
  barBg: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, marginTop: 8, overflow: 'hidden',
  },
  barFill: { height: 5, backgroundColor: '#FFD700', borderRadius: 3 },
  barTxt: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, textAlign: 'right' },
});
