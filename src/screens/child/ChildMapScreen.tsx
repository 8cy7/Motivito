/**
 * ChildMapScreen  –  iPad Landscape
 *
 * Map   : [left forest]  [golden winding path + nodes]  [right forest]
 *         vertical scroll (drag up = progress, drag down = retreat)
 *
 * Popup : [left – challenge info]  |  [right – stage character image]
 *         spring slide-up + scale + fade   (professional animation)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
  PanResponder,
  Animated,
  Image,
} from 'react-native';
import { SoundManager } from '../../utils/soundUtils';
import { AppModal } from '../../components/AppModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Text as SvgText,
  Ellipse,
  Polygon,
} from 'react-native-svg';
import Orientation from 'react-native-orientation-locker';
import { challengesData, Challenge, ChallengeRequirement } from '../../data/challengesData';
import { childApi } from '../../services/api';

// ─── Task stats from backend ──────────────────────────────────────────────────
interface TaskStats {
  approvedEasy:   number;
  approvedMedium: number;
  approvedHard:   number;
  totalStars:     number;
}

function getReqProgress(r: ChallengeRequirement, stats: TaskStats) {
  const target  = r.progressTarget ?? 1;
  let   current = 0;
  switch (r.progressType) {
    case 'easy':   current = Math.min(stats.approvedEasy,   target); break;
    case 'medium': current = Math.min(stats.approvedMedium, target); break;
    case 'hard':   current = Math.min(stats.approvedHard,   target); break;
    case 'stars':  current = Math.min(stats.totalStars,     target); break;
  }
  return { current, target, done: current >= target };
}

// ─── Always use landscape dimensions ─────────────────────────────────────────
const dim = Dimensions.get('window');
const LW  = Math.max(dim.width, dim.height); // landscape width  (long side)
const LH  = Math.min(dim.width, dim.height); // landscape height (short side)

// ─── Stage images (all requires must be static) ───────────────────────────────
const STAGE_IMAGES = {
  boy: [
    require('../../assets/BoyStage1.png'),    // node 0
    require('../../assets/Stage2.png'),        // node 1
    require('../../assets/Stage3.png'),        // node 2
    require('../../assets/Stage4.png'),        // node 3
    require('../../assets/Stage5.png'),        // node 4
    require('../../assets/Stage6.png'),        // node 5
    require('../../assets/Stage7.png'),        // node 6
    require('../../assets/Stage8.png'),        // node 7
    require('../../assets/Stage9.png'),        // node 8
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../assets/BoyStage10 .png'),  // node 9  (filename has space)
  ],
  girl: [
    require('../../assets/GirlStage1.png'),   // node 0
    require('../../assets/Stage2.png'),        // node 1
    require('../../assets/Stage3.png'),        // node 2
    require('../../assets/Stage4.png'),        // node 3
    require('../../assets/Stage5.png'),        // node 4
    require('../../assets/Stage6.png'),        // node 5
    require('../../assets/Stage7.png'),        // node 6
    require('../../assets/Stage8.png'),        // node 7
    require('../../assets/Stage9.png'),        // node 8
    require('../../assets/GirlStage10.png'),  // node 9
  ],
};

// ─── Map canvas ───────────────────────────────────────────────────────────────
const MAP_H = Math.round(LH * 4.2);   // tall enough to pan through

// ─── Nodes ────────────────────────────────────────────────────────────────────
const NODE_COUNT = 10;
const NR         = 38;   // normal radius
const BOSS_R     = 50;   // boss  radius
const BADGE_R    = 12;   // number badge

const PAD_TOP = 100;
const PAD_BOT = 130;
const V_STEP  = Math.round((MAP_H - PAD_TOP - PAD_BOT) / (NODE_COUNT - 1));
const X_C     = Math.round(LW * 0.50);
const X_OFF   = Math.round(LW * 0.10);  // narrower offset on wide iPad screen

interface NodeDef { id: number; x: number; y: number }
const NODES: NodeDef[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
  id: i,
  x:  (i === 0 || i === NODE_COUNT - 1) ? X_C : X_C + (i % 2 === 1 ? X_OFF : -X_OFF),
  y:  MAP_H - PAD_BOT - i * V_STEP,
}));

const WINDING_PATH = NODES.map((n, i) => {
  if (i === 0) return `M ${n.x} ${n.y}`;
  const p  = NODES[i - 1];
  const my = Math.round((n.y + p.y) / 2);
  return `C ${p.x} ${my} ${n.x} ${my} ${n.x} ${n.y}`;
}).join(' ');

// ─── Forest (left + right strips) ────────────────────────────────────────────
const FOREST_W  = Math.round(LW * 0.22);   // 22 % of landscape width each side
const TREE_FILL = ['#081306', '#102010', '#1a3518'];

interface TreeDef { x: number; y: number; h: number; layer: number }

const buildForest = (): TreeDef[] => {
  const out: TreeDef[] = [];
  const cols = [
    { xFrac: 0.15, step: 130, yOff: 0  },
    { xFrac: 0.50, step: 100, yOff: 50 },
    { xFrac: 0.85, step: 115, yOff: 25 },
  ];
  for (let side = 0; side < 2; side++) {
    cols.forEach((col, ci) => {
      const baseX = side === 0
        ? Math.round(FOREST_W * col.xFrac)
        : Math.round(LW - FOREST_W + FOREST_W * col.xFrac);
      const rows = Math.ceil((MAP_H + 160) / col.step) + 1;
      for (let r = 0; r < rows; r++) {
        const scatter = Math.round(((r * 2.618) % 1) * 22 - 11);
        out.push({
          x:     baseX + scatter,
          y:     col.yOff + r * col.step + Math.round(col.step * 0.12),
          h:     70 + ci * 26 + (r % 5) * 16,
          layer: 2 - ci,
        });
      }
    });
  }
  return out;
};
const TREE_DATA = buildForest();

const STAR_DATA: [number, number, number, number][] =
  Array.from({ length: 72 }, (_, i) => [
    Math.round(((i * 2.618) % 1) * (LW - 20) + 10),
    Math.round(((i * 0.382) % 1) * MAP_H),
    0.6 + (i % 3) * 0.6,
    0.22 + (i % 4) * 0.18,
  ]);

const FF_X1 = FOREST_W, FF_X2 = LW - FOREST_W;
const FIREFLY_DATA: [number, number, number, number][] =
  Array.from({ length: 44 }, (_, i) => [
    Math.round(FF_X1 + ((i * 2.618) % 1) * (FF_X2 - FF_X1)),
    Math.round(((i * 0.618) % 1) * MAP_H),
    1.2 + (i % 2) * 1.0,
    0.40 + (i % 3) * 0.20,
  ]);

const MUSH_COLORS = ['#cc2244', '#8822aa', '#ff6622', '#2255cc', '#aa3300'];
type MushT = [number, number, number, string];
const MUSH_DATA: MushT[] = NODES.slice(0, -1).flatMap((n, i) => {
  const nx = NODES[i + 1];
  const my = Math.round((n.y + nx.y) / 2);
  const mx = Math.round((n.x + nx.x) / 2);
  return [
    [mx - 28, my + 22, 14, MUSH_COLORS[i % 5]],
    [mx + 34, my - 18, 11, MUSH_COLORS[(i + 2) % 5]],
  ] as MushT[];
});

// ─── SVG helpers ──────────────────────────────────────────────────────────────
const Tree: React.FC<{ t: TreeDef; i: number }> = ({ t, i }) => {
  const { x, y, h, layer } = t;
  const fill = TREE_FILL[layer];
  const w    = h * 0.52;
  return (
    <G key={`tr${i}`}>
      <Polygon points={`${x},${y-h} ${x-w*0.40},${y-h*0.58} ${x+w*0.40},${y-h*0.58}`} fill={fill} />
      <Polygon points={`${x},${y-h*0.63} ${x-w*0.68},${y-h*0.22} ${x+w*0.68},${y-h*0.22}`} fill={fill} />
      <Polygon points={`${x},${y-h*0.27} ${x-w},${y+h*0.07} ${x+w},${y+h*0.07}`} fill={fill} />
      <Rect x={x - 5} y={y + h * 0.07} width={10} height={h * 0.12} fill="#281008" />
    </G>
  );
};

const Mushroom: React.FC<{ x: number; y: number; s: number; color: string; i: number }> =
  ({ x, y, s, color, i }) => (
    <G key={`mu${i}`}>
      <Ellipse cx={x} cy={y} rx={s} ry={s * 0.58} fill={color} />
      <Rect x={x - s*0.28} y={y} width={s*0.56} height={s*0.82} fill="#d4c090" rx={2} />
      <Circle cx={x - s*0.28} cy={y - s*0.25} r={s*0.12} fill="white" opacity={0.75} />
      <Circle cx={x + s*0.16} cy={y - s*0.38} r={s*0.09} fill="white" opacity={0.72} />
    </G>
  );

// ─── HUD icons ────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24">
    <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#fff" />
  </Svg>
);

// ─── Popup: close icon ────────────────────────────────────────────────────────
const XIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="rgba(255,255,255,0.85)" />
  </Svg>
);

// ─── Popup constants ──────────────────────────────────────────────────────────
// ─── ChallengePopup ───────────────────────────────────────────────────────────
interface PopupProps {
  visible:        boolean;
  nodeId:         number;
  challenge:      Challenge | null;
  onClose:        () => void;
  childGender:    string;
  challengeLevel: number;
  onClaim:        () => void;
}

const ChallengePopup: React.FC<PopupProps> = ({
  visible, nodeId, challenge, onClose, childGender, challengeLevel, onClaim,
}) => {
  const [mounted,          setMounted]          = useState(false);
  const [stats,            setStats]            = useState<TaskStats | null>(null);
  const [claimed,          setClaimed]          = useState(false);
  const [claiming,         setClaiming]         = useState(false);
  const [showCelebration,  setShowCelebration]  = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // Celebration animation refs
  const celebScale  = useRef(new Animated.Value(0)).current;
  const celebStars  = useRef(new Animated.Value(0)).current;
  const celebPoints = useRef(new Animated.Value(0)).current;
  const floatStars  = useRef(
    [0, 1, 2, 3, 4].map(() => ({
      y:       new Animated.Value(0),
      x:       new Animated.Value((Math.random() - 0.5) * 160),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Animate in/out; reset claim state on open
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setClaimed(false);
      setClaiming(false);
      setShowCelebration(false);
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, tension: 62, friction: 11, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true })
        .start(() => setMounted(false));
    }
  }, [visible, anim]);

  const triggerCelebration = useCallback(() => {
    celebScale.setValue(0);
    celebStars.setValue(0);
    celebPoints.setValue(0);
    floatStars.forEach(s => { s.y.setValue(0); s.opacity.setValue(0); });
    setShowCelebration(true);
    SoundManager.playSound('levelup');

    const starAnims = floatStars.map((star, i) =>
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.parallel([
          Animated.timing(star.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(star.y,       { toValue: -180, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.timing(star.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );

    Animated.parallel([
      Animated.spring(celebScale,  { toValue: 1, tension: 55, friction: 7,  useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(celebStars,  { toValue: 1, tension: 60, friction: 6,  useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(celebPoints, { toValue: 1, tension: 60, friction: 6,  useNativeDriver: true }),
      ]),
      ...starAnims,
    ]).start();

    // Close after celebration
    setTimeout(() => {
      setShowCelebration(false);
      onClose();
    }, 2200);
  }, [celebScale, celebStars, celebPoints, floatStars, onClose]);

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    try {
      await childApi.post('/api/children/me/claim-challenge', { challengeIndex: nodeId });
      setClaimed(true);
      onClaim();
      triggerCelebration();
    } catch (_) {
      // keep button active so user can retry
    } finally {
      setClaiming(false);
    }
  };

  // Fetch task stats from backend when popup opens
  useEffect(() => {
    if (!visible) return;
    childApi.get<TaskStats>('/api/tasks/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats({ approvedEasy: 0, approvedMedium: 0, approvedHard: 0, totalStars: 0 }));
  }, [visible]);

  if (!mounted || !challenge) return null;

  const isGirl   = childGender === 'girl';
  const nm       = (isGirl && challenge.nameFemale)         ? challenge.nameFemale         : challenge.name;
  const dsc      = (isGirl && challenge.descriptionFemale)  ? challenge.descriptionFemale  : challenge.description;
  const req      = (isGirl && challenge.requirementsFemale) ? challenge.requirementsFemale : challenge.requirements;
  const stageImg = STAGE_IMAGES[isGirl ? 'girl' : 'boy'][nodeId] ?? STAGE_IMAGES.boy[0];

  // If this challenge was already claimed, treat everything as fully done
  const alreadyClaimed = nodeId < challengeLevel || claimed;

  // Done = all requirements met (based on live stats if available)
  const done = alreadyClaimed || (stats
    ? req.every(r => !r.progressType || getReqProgress(r, stats).done)
    : false);

  const cardStyle = {
    opacity:   anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
  };

  return (
    <AppModal visible={mounted} transparent animationType="none" onRequestClose={onClose}>

      {/* Backdrop */}
      <Animated.View style={[pp.overlay, { opacity: anim }]}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Card */}
      <View style={pp.centre} pointerEvents="box-none">
        <Animated.View style={[pp.card, cardStyle]}>

          {/* ── LEFT: info ── */}
          <View style={pp.left}>

            {/* Top row: X left, badge right */}
            <View style={pp.topRow}>
              <TouchableOpacity onPress={onClose} style={pp.xBtn}
                hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}>
                <XIcon />
              </TouchableOpacity>
              <View style={pp.badge}>
                <Text style={pp.badgeNum}>{nodeId + 1}</Text>
                <Text style={pp.badgeLbl}>المرحلة</Text>
              </View>
            </View>

            {/* Name */}
            <Text style={[pp.nameEmoji, { textAlign: 'right' }]}>{challenge.emoji}</Text>
            <Text style={[pp.name, { textAlign: 'right' }]} numberOfLines={2}>{nm}</Text>
            <Text style={[pp.desc, { textAlign: 'right' }]} numberOfLines={2}>{dsc}</Text>

            <View style={pp.sep} />

            {/* Requirements */}
            <ScrollView style={pp.scroll} showsVerticalScrollIndicator={false}>
              <Text style={pp.secHead}>المتطلبات</Text>
              {req.map((r, i) => {
                // If already claimed, show full progress immediately without waiting for stats
                const prog    = alreadyClaimed
                  ? (r.progressTarget ? { current: r.progressTarget, target: r.progressTarget, done: true } : null)
                  : (r.progressType && stats ? getReqProgress(r, stats) : null);
                const reqDone = alreadyClaimed || (prog ? prog.done : false);
                const pct     = prog ? prog.current / prog.target : 0;
                return (
                  <View key={i} style={pp.reqRow}>
                    {/* Dot + content column */}
                    <View style={[pp.dot, reqDone && pp.dotDone]} />
                    <View style={{ flex: 1 }}>
                      {/* Requirement text */}
                      <Text style={[pp.reqTxt, reqDone && pp.reqTxtDone, { textAlign: 'right' }]}
                        numberOfLines={2}>
                        {r.text}
                      </Text>
                      {/* Progress bar */}
                      {prog && (
                        <View style={pp.progRow}>
                          <Text style={[pp.progCount, reqDone && pp.progCountDone]}>
                            {prog.current}/{prog.target}
                          </Text>
                          <View style={pp.progTrack}>
                            <View style={[
                              pp.progFill,
                              { width: `${Math.min(pct, 1) * 100}%` },
                              reqDone && pp.progFillDone,
                            ]} />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
              {/* Reward */}
              <View style={pp.rewardBox}>
                <Text style={[pp.rewardHead, { textAlign: 'right' }]}>🏆  المكافأة</Text>
                <Text style={[pp.rewardTxt, { textAlign: 'right' }]}>{challenge.reward}</Text>
              </View>
            </ScrollView>

            {/* Button */}
            {nodeId < challengeLevel || claimed ? (
              // Already claimed (past challenge or just claimed now)
              <View style={[pp.btn, { backgroundColor: claimed ? 'rgba(255,215,0,0.22)' : 'rgba(16,185,129,0.18)' }]}>
                <Text style={[pp.btnTxt, { color: claimed ? '#ffd700' : '#10b981' }]}>✓  تم الاستلام</Text>
              </View>
            ) : done ? (
              // Current challenge, all requirements met → claim button
              <TouchableOpacity style={[pp.btn, { backgroundColor: '#10B981' }]} onPress={handleClaim} activeOpacity={0.8} disabled={claiming}>
                <Text style={pp.btnTxt}>{claiming ? '...' : '🎁  استلام الجائزة'}</Text>
              </TouchableOpacity>
            ) : (
              // Requirements not met yet
              <View style={pp.btnLocked}>
                <Text style={pp.btnLockedTxt}>🔒  استلام الجائزة</Text>
              </View>
            )}

          </View>

          {/* ── RIGHT: image ── */}
          <View style={pp.right}>
            <Image source={stageImg} style={pp.img} resizeMode="contain" />
            <Text style={pp.imgName}>{nm}</Text>
          </View>

        </Animated.View>
      </View>

      {/* ── Celebration overlay ── */}
      {showCelebration && (
        <View style={pp.celebOverlay} pointerEvents="none">
          <Animated.View style={{
            transform: [{ scale: celebScale }],
            backgroundColor: '#4C1D95',
            borderRadius: 30,
            padding: 28,
            alignItems: 'center',
            width: 310,
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.55,
            shadowRadius: 24,
            elevation: 24,
            overflow: 'visible',
          }}>
            {/* نجوم طائرة */}
            {floatStars.map((star, i) => (
              <Animated.Text
                key={i}
                style={{
                  position: 'absolute',
                  fontSize: 22,
                  top: 30,
                  left: 140,
                  opacity: star.opacity,
                  transform: [
                    { translateY: star.y },
                    { translateX: star.x },
                  ],
                }}>
                ⭐
              </Animated.Text>
            ))}

            {/* نجمة كبيرة */}
            <Animated.Text style={{
              fontSize: 64,
              marginBottom: 4,
              transform: [{
                scale: celebStars.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0.3, 1.4, 1],
                }),
              }],
              opacity: celebStars,
            }}>
              🏅
            </Animated.Text>

            {/* اسم التحدي */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 18,
              width: '100%',
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFF', textAlign: 'center' }}>
                🎉 {nm}
              </Text>
            </View>

            {/* XP المكتسبة */}
            <Animated.View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              transform: [{
                scale: celebPoints.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0.4, 1.3, 1],
                }),
              }],
              opacity: celebPoints,
            }}>
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#FFD700' }}>
                +{challenge.xpReward}
              </Text>
              <Text style={{ fontSize: 22, color: '#FFF', fontWeight: '700' }}>XP</Text>
            </Animated.View>

            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>
              أحسنت! استمر في التحديات 🚀
            </Text>
          </Animated.View>
        </View>
      )}

    </AppModal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface Props { navigation?: any; route?: any }

export const ChildMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const childName   = route?.params?.childName   ?? 'الطفل';
  const childGender = route?.params?.childGender ?? 'boy';
  const isFemale    = childGender === 'girl';

  // Lock to landscape for the map experience
  useEffect(() => {
    Orientation.lockToLandscape();
    return () => { Orientation.unlockAllOrientations(); };
  }, []);

  // Vertical pan
  const MIN_Y  = -(MAP_H - LH);
  const MAX_Y  = 0;
  const panY   = useRef(new Animated.Value(MIN_Y)).current;  // start at bottom
  const panRef = useRef(MIN_Y);

  useEffect(() => {
    const id = panY.addListener(({ value }) => { panRef.current = value; });
    return () => panY.removeListener(id);
  }, [panY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        panY.setOffset(panRef.current);
        panY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dy: panY }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: (_, gs) => {
        panY.flattenOffset();
        const clamped = Math.min(MAX_Y, Math.max(MIN_Y, panRef.current + gs.dy));
        panRef.current = clamped;
        Animated.spring(panY, {
          toValue: clamped, useNativeDriver: false, tension: 55, friction: 9,
        }).start();
      },
      onPanResponderTerminate: () => { panY.flattenOffset(); },
    }),
  ).current;

  const [activeId,       setActiveId]       = useState(0);
  const [challenge,      setChallenge]      = useState<Challenge | null>(null);
  const [showPopup,      setShowPopup]      = useState(false);
  const [challengeLevel, setChallengeLevel] = useState(0);

  // Fetch child's current challenge level from backend
  useEffect(() => {
    childApi.get('/api/children/me')
      .then((res: any) => setChallengeLevel(res.data?.challengeLevel ?? 0))
      .catch(() => {});
  }, []);

  const onNodePress = (id: number) => {
    if (id > challengeLevel) return;
    const ch = challengesData[id];
    if (ch) { setActiveId(id); setChallenge(ch); setShowPopup(true); }
  };

  return (
    <SafeAreaView style={ms.root} edges={['left', 'right']}>
      <StatusBar hidden />

      <View style={ms.canvas} {...panResponder.panHandlers}>

        <Animated.View
          style={{ width: LW, height: MAP_H, transform: [{ translateY: panY }] }}
          pointerEvents="box-none">

          {/* ── SVG world ── */}
          <Svg
            width={LW} height={MAP_H}
            viewBox={`0 0 ${LW} ${MAP_H}`}
            style={{ position: 'absolute', top: 0, left: 0 }}
            pointerEvents="none">

            <Defs>
              <SvgGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0"    stopColor="#030012" />
                <Stop offset="0.20" stopColor="#060820" />
                <Stop offset="0.55" stopColor="#051510" />
                <Stop offset="0.85" stopColor="#071e10" />
                <Stop offset="1"    stopColor="#040e08" />
              </SvgGradient>
            </Defs>

            <Rect width={LW} height={MAP_H} fill="url(#bg)" />

            {/* Stars */}
            {STAR_DATA.map(([x, y, r, o], i) => (
              <Circle key={`st${i}`} cx={x} cy={y} r={r} fill="white" opacity={o} />
            ))}

            {/* Moon */}
            <Circle cx={80}  cy={PAD_TOP - 26} r={46} fill="#fffce6" opacity={0.88} />
            <Circle cx={100} cy={PAD_TOP - 42} r={37} fill="#030012" opacity={0.94} />

            {/* Mist bands */}
            {[0.16, 0.34, 0.52, 0.70, 0.88].map((fy, i) => (
              <Ellipse key={`ms${i}`}
                cx={LW / 2} cy={Math.round(MAP_H * fy)}
                rx={LW * 0.52} ry={18}
                fill="white" opacity={0.012 + (i % 2) * 0.007} />
            ))}

            {/* Forest strips */}
            {TREE_DATA.map((t, i) => <Tree key={`tr${i}`} t={t} i={i} />)}

            {/* Forest-edge shadows */}
            <Rect x={FOREST_W - 24} y={0} width={24} height={MAP_H} fill="rgba(0,0,0,0.35)" />
            <Rect x={LW - FOREST_W} y={0} width={24} height={MAP_H} fill="rgba(0,0,0,0.35)" />

            {/* Fireflies */}
            {FIREFLY_DATA.map(([x, y, r, o], i) => (
              <G key={`ff${i}`}>
                <Circle cx={x} cy={y} r={r + 5}   fill="rgba(255,255,100,0.05)" />
                <Circle cx={x} cy={y} r={r + 2.5} fill="rgba(255,255,100,0.12)" />
                <Circle cx={x} cy={y} r={r}        fill="#ffff88" opacity={o} />
              </G>
            ))}

            {/* Mushrooms */}
            {MUSH_DATA.map(([x, y, sz, c], i) => (
              <Mushroom key={`mu${i}`} x={x} y={y} s={sz} color={c} i={i} />
            ))}

            {/* Golden path */}
            <Path d={WINDING_PATH} stroke="rgba(255,210,0,0.04)" strokeWidth={65} fill="none" strokeLinecap="round" />
            <Path d={WINDING_PATH} stroke="rgba(255,210,0,0.09)" strokeWidth={42} fill="none" strokeLinecap="round" />
            <Path d={WINDING_PATH} stroke="rgba(255,210,0,0.20)" strokeWidth={22} fill="none" strokeLinecap="round" />
            <Path d={WINDING_PATH} stroke="#ffd700" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeDasharray="20 12" />

            {/* Nodes */}
            {NODES.map(node => {
              const ch     = challengesData[node.id];
              if (!ch) return null;
              const r      = node.id === NODE_COUNT - 1 ? BOSS_R : NR;
              const label  = (isFemale && ch.nameFemale) ? ch.nameFemale : ch.name;
              const locked = node.id > challengeLevel;

              return (
                <G key={`nd${node.id}`}>
                  {!locked && (
                    <>
                      <Circle cx={node.x} cy={node.y} r={r + 34} fill="rgba(139,92,246,0.05)" />
                      <Circle cx={node.x} cy={node.y} r={r + 22} fill="rgba(139,92,246,0.11)" />
                      <Circle cx={node.x} cy={node.y} r={r + 12} fill="rgba(139,92,246,0.20)" />
                    </>
                  )}
                  <Circle cx={node.x} cy={node.y} r={r + 7}
                    fill={locked ? '#181830' : '#6d28d9'}
                    opacity={locked ? 0.42 : 1} />
                  <Circle cx={node.x} cy={node.y} r={r}
                    fill={locked ? '#0e0e1e' : '#4c1d95'}
                    stroke={locked ? '#222242' : '#c4b5fd'}
                    strokeWidth={2.5}
                    opacity={locked ? 0.60 : 1} />
                  <Circle cx={node.x + r - 1} cy={node.y - r + 1} r={BADGE_R}
                    fill={locked ? '#1c1c38' : '#7c3aed'} />
                  <SvgText
                    x={node.x + r - 1} y={node.y - r + 7}
                    textAnchor="middle" fontSize={10} fontWeight="900" fill="white">
                    {node.id + 1}
                  </SvgText>
                  <SvgText
                    x={node.x} y={node.y + Math.round(r * 0.40)}
                    textAnchor="middle" fontSize={Math.round(r * 0.74)} fill="white">
                    {locked ? '🔒' : ch.emoji}
                  </SvgText>
                  <SvgText
                    x={node.x} y={node.y + r + 20}
                    textAnchor="middle" fontSize={12} fontWeight="700"
                    fill={locked ? '#2e2e54' : '#ddd6fe'}>
                    {label}
                  </SvgText>
                </G>
              );
            })}

          </Svg>

          {/* Touch targets */}
          {NODES.map(node => {
            const r = (node.id === NODE_COUNT - 1 ? BOSS_R : NR) + 14;
            return (
              <TouchableOpacity
                key={`tp${node.id}`}
                disabled={node.id > challengeLevel}
                onPress={() => onNodePress(node.id)}
                activeOpacity={0.55}
                style={{
                  position: 'absolute',
                  left: node.x - r, top: node.y - r,
                  width: r * 2, height: r * 2, borderRadius: r,
                }}
              />
            );
          })}

        </Animated.View>

        {/* HUD */}
        <View style={ms.hud} pointerEvents="box-none">
          <TouchableOpacity style={ms.backBtn} onPress={() => navigation?.goBack()}>
            <BackIcon />
          </TouchableOpacity>
          <View style={ms.pill}>
            <Text style={ms.pillTxt}>خريطة {childName}</Text>
          </View>
          <TouchableOpacity
            style={ms.trophyBtn}
            onPress={() =>
              navigation?.navigate('Progress', {
                childId:        route?.params?.childId ?? '',
                childName,
                childGender,
                challengeLevel,
              })
            }
          >
            <Text style={{ fontSize: 22 }}>🏆</Text>
          </TouchableOpacity>
        </View>

        <View style={ms.hintUp}   pointerEvents="none"><Text style={ms.hintTxt}>▲</Text></View>
        <View style={ms.hintDown} pointerEvents="none"><Text style={ms.hintTxt}>▼</Text></View>

      </View>

      <ChallengePopup
        visible={showPopup}
        nodeId={activeId}
        challenge={challenge}
        onClose={() => setShowPopup(false)}
        childGender={childGender}
        challengeLevel={challengeLevel}
        onClaim={() => setChallengeLevel(c => c + 1)}
      />
    </SafeAreaView>
  );
};

// ─── Map styles ───────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#030012' },
  canvas: { flex: 1, overflow: 'hidden' },
  hud: {
    position: 'absolute', top: 12, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  trophyBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(109,40,217,0.75)',
    borderWidth: 1.5, borderColor: 'rgba(196,181,253,0.40)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  pill: {
    backgroundColor: 'rgba(109,40,217,0.75)', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(196,181,253,0.32)',
  },
  pillTxt:  { color: '#ede9fe', fontSize: 15, fontWeight: '800' },
  hintUp:   { position: 'absolute', top: 68, width: '100%', alignItems: 'center' },
  hintDown: { position: 'absolute', bottom: 14, width: '100%', alignItems: 'center' },
  hintTxt:  { color: 'rgba(255,215,0,0.30)', fontSize: 20 },
});

// ─── Popup styles ─────────────────────────────────────────────────────────────
const pp = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(2,0,16,0.86)',
  },
  centre: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    width:         Math.round(LW * 0.80),
    height:        Math.round(LH * 0.84),
    flexDirection: 'row',
    borderRadius:  24,
    overflow:      'hidden',
    borderWidth:   1,
    borderColor:   'rgba(139,92,246,0.45)',
    shadowColor:   '#6d28d9',
    shadowOffset:  { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius:  32,
    elevation:     28,
  },

  // ── LEFT: info panel ─────────────────────────────────────────────────────────
  left: {
    flex:              1.4,
    backgroundColor:   '#0d0024',
    paddingHorizontal: 22,
    paddingTop:        18,
    paddingBottom:     14,
    borderRightWidth:  1,
    borderRightColor:  'rgba(139,92,246,0.20)',
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   14,
  },
  badge: {
    backgroundColor: 'rgba(109,40,217,0.55)',
    borderRadius:    10,
    paddingHorizontal: 14,
    paddingVertical:    6,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     'rgba(139,92,246,0.35)',
  },
  badgeNum: { color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 26 },
  badgeLbl: { color: 'rgba(255,255,255,0.70)', fontSize: 10, fontWeight: '700' },

  xBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },

  nameEmoji: { fontSize: 32, marginBottom: 4 },
  name:      { fontSize: 19, fontWeight: '900', color: '#fff', lineHeight: 24, marginBottom: 6 },
  desc:      { fontSize: 13, color: '#c4b5fd', lineHeight: 18, marginBottom: 12 },

  sep: { height: 1, backgroundColor: 'rgba(139,92,246,0.24)', marginBottom: 12 },

  scroll:  { flex: 1 },
  secHead: { fontSize: 11, fontWeight: '800', color: '#a78bfa', marginBottom: 10, letterSpacing: 0.6, textAlign: 'right' },

  reqRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  dot: {
    width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: 'rgba(167,139,250,0.28)',
    borderWidth: 1.5, borderColor: '#7c3aed',
    marginTop: 5, flexShrink: 0,
  },
  dotDone:    { backgroundColor: '#10b981', borderColor: '#10b981' },
  reqTxt:     { flex: 1, fontSize: 13, color: '#ddd6fe', lineHeight: 19, fontWeight: '500' },
  reqTxtDone: { color: '#6ee7b7', textDecorationLine: 'line-through' },

  // Progress bar
  progRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  progCount:     { fontSize: 11, fontWeight: '900', color: '#a78bfa', minWidth: 28 },
  progCountDone: { color: '#ffd700' },
  progTrack: {
    flex: 1, height: 5, borderRadius: 3, overflow: 'hidden',
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  progFill:     { height: '100%', borderRadius: 3, backgroundColor: '#7c3aed' },
  progFillDone: { backgroundColor: '#ffd700' },

  rewardBox: {
    marginTop: 10, marginBottom: 2,
    backgroundColor: 'rgba(255,210,0,0.07)',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,210,0,0.22)',
  },
  rewardHead: { fontSize: 12, fontWeight: '800', color: '#fbbf24', marginBottom: 5 },
  rewardTxt:  { fontSize: 13, color: '#fef3c7', lineHeight: 18 },

  btn:       { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  btnTxt:    { fontSize: 15, fontWeight: '900', color: '#fff', textAlign: 'right' },
  btnLocked: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12,
    backgroundColor: 'rgba(124,58,237,0.18)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.38)',
  },
  btnLockedTxt: { fontSize: 14, fontWeight: '800', color: '#a78bfa', textAlign: 'right' },

  // ── RIGHT: image panel ────────────────────────────────────────────────────────
  right: {
    flex:            1,
    backgroundColor: '#110030',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         16,
  },
  img:     { flex: 1, width: '100%' },
  imgName: {
    color: 'rgba(255,255,255,0.55)', fontSize: 12,
    fontWeight: '700', textAlign: 'center', marginTop: 8,
  },

  // ── Celebration overlay ────────────────────────────────────────────────────────
  celebOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(2,0,16,0.75)',
  },
});
