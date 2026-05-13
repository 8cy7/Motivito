import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  FlatList,
  Animated,
  PanResponder,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { AppModal } from '../../components/AppModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useChildren } from '../../contexts/ChildrenContext';
import { Child } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── ثوابت الرف (لم تتغير) ───────────────────────────────────────────────────
const FRAME_SIZE = 70;
const FRAMES_PER_ROW = 3;
const MAX_ACHIEVEMENTS = 12; // 3 × 4 صفوف

// ─── ثوابت القص ──────────────────────────────────────────────────────────────
const CROP_SIZE = SCREEN_WIDTH * 0.78;
const CROP_LEFT = (SCREEN_WIDTH - CROP_SIZE) / 2;
const CROP_TOP = (SCREEN_HEIGHT - CROP_SIZE) / 2;
// حجم منطقة عرض الصورة داخل الإطار (أصغر من FRAME_SIZE ليتناسب مع الحدود)
const CLIP_SIZE = 52;

// ─── Types ───────────────────────────────────────────────────────────────────

interface CropData {
  cropNaturalX: number;
  cropNaturalY: number;
  cropNaturalSize: number;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
}

interface CustomAchievement {
  id: string;
  imageUri: string;
  cropData: CropData;
  name: string;
  addedAt: string;
}

interface PendingImage {
  uri: string;
  naturalWidth: number;
  naturalHeight: number;
}

// ─── AsyncStorage ─────────────────────────────────────────────────────────────

const storageKeyV1 = (childId: string) => `custom_shelf_${childId}`;
const storageKeyV2 = (childId: string) => `custom_shelf_v2_${childId}`;

async function loadAllShelves(childId: string): Promise<CustomAchievement[][]> {
  try {
    const raw = await AsyncStorage.getItem(storageKeyV2(childId));
    if (raw) return JSON.parse(raw);
    const oldRaw = await AsyncStorage.getItem(storageKeyV1(childId));
    if (oldRaw) return [JSON.parse(oldRaw)];
    return [[]];
  } catch {
    return [[]];
  }
}

async function saveAllShelves(childId: string, shelves: CustomAchievement[][]): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKeyV2(childId), JSON.stringify(shelves));
  } catch {}
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24">
    <Path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#FFFFFF" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
      fill="#FFFFFF"
    />
    <Path
      d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
      fill="#FFFFFF"
    />
  </Svg>
);

const PencilIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#FFFFFF" />
  </Svg>
);

// ─── مودال القص ──────────────────────────────────────────────────────────────

interface CropModalProps {
  visible: boolean;
  image: PendingImage | null;
  onCrop: (data: CropData) => void;
  onCancel: () => void;
}

const CropModal: React.FC<CropModalProps> = ({ visible, image, onCrop, onCancel }) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const totalPan = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);
  const [zoom, setZoom] = useState(1.0);
  const lastPinchDist = useRef<number | null>(null);
  const isPinching = useRef(false);

  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      pan.setOffset({ x: 0, y: 0 });
      totalPan.current = { x: 0, y: 0 };
      zoomRef.current = 1.0;
      setZoom(1.0);
    }
  }, [visible]);

  // panResponder في ref حتى لا يُعاد إنشاؤه عند كل render
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        lastPinchDist.current = null;
        isPinching.current = false;
        if (evt.nativeEvent.touches.length === 1) {
          pan.setOffset(totalPan.current);
          pan.setValue({ x: 0, y: 0 });
        }
      },
      onPanResponderMove: (evt, g) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          isPinching.current = true;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (lastPinchDist.current !== null) {
            const delta = dist / lastPinchDist.current;
            zoomRef.current = Math.max(0.3, Math.min(5.0, zoomRef.current * delta));
            setZoom(zoomRef.current);
          }
          lastPinchDist.current = dist;
        } else if (!isPinching.current) {
          (Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }) as any)(evt, g);
        }
      },
      onPanResponderRelease: (_evt: any, g: any) => {
        if (!isPinching.current) {
          totalPan.current = { x: totalPan.current.x + g.dx, y: totalPan.current.y + g.dy };
        }
        pan.flattenOffset();
        lastPinchDist.current = null;
        isPinching.current = false;
      },
    })
  ).current;

  if (!image) return null;

  const fitScale = Math.max(SCREEN_WIDTH / image.naturalWidth, CROP_SIZE / image.naturalHeight);
  const displayScale = fitScale * zoom; // zoom state يحرّك إعادة الرسم
  const imgW = image.naturalWidth * displayScale;
  const imgH = image.naturalHeight * displayScale;
  const initX = (SCREEN_WIDTH - imgW) / 2;
  const initY = (SCREEN_HEIGHT - imgH) / 2;

  const handleCrop = () => {
    const px = totalPan.current.x;
    const py = totalPan.current.y;
    // zoomRef.current للدقة (state قد يتأخر خطوة)
    const cropScale = fitScale * zoomRef.current;
    const cropInitX = (SCREEN_WIDTH - image.naturalWidth * cropScale) / 2;
    const cropInitY = (SCREEN_HEIGHT - image.naturalHeight * cropScale) / 2;
    onCrop({
      cropNaturalX: (CROP_LEFT - cropInitX - px) / cropScale,
      cropNaturalY: (CROP_TOP - cropInitY - py) / cropScale,
      cropNaturalSize: CROP_SIZE / cropScale,
      imageNaturalWidth: image.naturalWidth,
      imageNaturalHeight: image.naturalHeight,
    });
  };

  return (
    <AppModal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={cropStyles.container}>
        {/* الصورة القابلة للسحب والتكبير */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: image.uri }}
            style={{ position: 'absolute', left: initX, top: initY, width: imgW, height: imgH }}
            resizeMode="stretch"
          />
        </Animated.View>

        {/* التظليل حول إطار القص */}
        <View pointerEvents="none" style={[cropStyles.dark, { top: 0, left: 0, right: 0, height: CROP_TOP }]} />
        <View pointerEvents="none" style={[cropStyles.dark, { top: CROP_TOP + CROP_SIZE, left: 0, right: 0, bottom: 0 }]} />
        <View pointerEvents="none" style={[cropStyles.dark, { top: CROP_TOP, left: 0, width: CROP_LEFT, height: CROP_SIZE }]} />
        <View pointerEvents="none" style={[cropStyles.dark, { top: CROP_TOP, right: 0, left: CROP_LEFT + CROP_SIZE, height: CROP_SIZE }]} />

        {/* إطار القص */}
        <View
          pointerEvents="none"
          style={[cropStyles.cropBorder, { left: CROP_LEFT, top: CROP_TOP, width: CROP_SIZE, height: CROP_SIZE }]}
        />

        {/* تعليمات */}
        <View pointerEvents="none" style={[cropStyles.hint, { top: CROP_TOP - 52 }]}>
          <Text style={cropStyles.hintText}>اسحب • قرّب بإصبعين للتكبير</Text>
        </View>

        {/* أزرار */}
        <View style={cropStyles.btnRow}>
          <TouchableOpacity style={cropStyles.cancelBtn} onPress={onCancel}>
            <Text style={cropStyles.cancelTxt}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cropStyles.cropBtn} onPress={handleCrop}>
            <Text style={cropStyles.cropTxt}>✂️  قص</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
};

// ─── مودال التسمية ────────────────────────────────────────────────────────────

interface NameModalProps {
  visible: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const NameModal: React.FC<NameModalProps> = ({ visible, onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const confirm = () => { if (name.trim()) { onConfirm(name.trim()); setName(''); } };
  const cancel = () => { setName(''); onCancel(); };
  return (
    <AppModal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={nameStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={cancel} />
        <View style={nameStyles.card}>
          <Text style={nameStyles.title}>سمّ الإنجاز 🏆</Text>
          <TextInput
            style={nameStyles.input}
            placeholder="مثال: رحلة العلوم..."
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
            textAlign="right"
            maxLength={30}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={confirm}
          />
          <View style={nameStyles.row}>
            <TouchableOpacity style={nameStyles.cancelBtn} onPress={cancel}>
              <Text style={nameStyles.cancelTxt}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[nameStyles.saveBtn, !name.trim() && nameStyles.saveBtnDisabled]}
              onPress={confirm}
              disabled={!name.trim()}
            >
              <Text style={nameStyles.saveTxt}>حفظ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </AppModal>
  );
};

// ─── مودال التفاصيل ───────────────────────────────────────────────────────────

interface DetailModalProps {
  visible: boolean;
  achievement: CustomAchievement | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ visible, achievement, onClose }) => {
  if (!achievement) return null;
  const { cropData, imageUri, name } = achievement;

  const handleDownload = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version;
        const perm = apiLevel >= 33
          ? 'android.permission.READ_MEDIA_IMAGES' as any
          : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
        const granted = await PermissionsAndroid.request(perm);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('⚠️ تحتاج صلاحية', 'يرجى السماح بصلاحية حفظ الصور', [{ text: 'حسناً' }]);
          return;
        }
      } catch { return; }
    }
    try {
      await CameraRoll.save(imageUri, { type: 'photo' });
      Alert.alert('📥 تم التنزيل', 'تم حفظ الصورة الأصلية في الاستديو! 🎉', [{ text: 'رائع!' }]);
    } catch {
      Alert.alert('❌ خطأ', 'حدث خطأ أثناء حفظ الصورة', [{ text: 'حسناً' }]);
    }
  };

  // حساب موضع المنطقة الداخلية للإطار (686×721 أصلي، داخلي 528×566)
  const S = SCREEN_WIDTH * 0.78; // حجم حاوية الفريم
  const fScale = S / 721; // مقياس "contain" (الارتفاع هو العامل المحدد)
  const innerLeft = (S - 686 * fScale) / 2 + 79 * fScale;
  const innerTop = 77.5 * fScale;
  const innerW = 528 * fScale;
  const innerH = 566 * fScale;
  // نقيس بالارتفاع لضمان تغطية كاملة
  const rs = innerH / cropData.cropNaturalSize;

  return (
    <AppModal visible={visible} transparent animationType="fade">
      <View style={detailStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={detailStyles.card}>
          {/* الفريم + الصورة فوقه */}
          <View style={{ width: S, height: S }}>
            {/* الفريم في الطبقة السفلى */}
            <Image
              source={require('../../assets/frame.png')}
              style={{ position: 'absolute', width: S, height: S }}
              resizeMode="contain"
            />
            {/* الصورة فوق الفريم، مقصوصة على المنطقة الداخلية بالضبط */}
            <View style={{
              position: 'absolute',
              left: innerLeft,
              top: innerTop,
              width: innerW,
              height: innerH,
              overflow: 'hidden',
            }}>
              <Image
                source={{ uri: imageUri }}
                style={{
                  position: 'absolute',
                  width: cropData.imageNaturalWidth * rs,
                  height: cropData.imageNaturalHeight * rs,
                  left: -cropData.cropNaturalX * rs - (innerH - innerW) / 2,
                  top: -cropData.cropNaturalY * rs,
                }}
                resizeMode="stretch"
              />
            </View>
          </View>
          <Text style={detailStyles.name}>{name}</Text>
          <Text style={detailStyles.date}>
            {new Date(achievement.addedAt).toLocaleDateString('ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity style={detailStyles.downloadBtn} onPress={handleDownload}>
              <Text style={detailStyles.closeTxt}>📥 تنزيل الصورة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
              <Text style={detailStyles.closeTxt}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AppModal>
  );
};

// ─── عنصر الإطار الواحد (يحل محل AchievementItem الأصلي) ────────────────────

interface FrameItemProps {
  customAchievement: CustomAchievement | null;
  index: number;
  isEditMode: boolean;
  onPress: () => void;
  onDelete?: () => void;
}

const FrameItem: React.FC<FrameItemProps> = ({ customAchievement, index, isEditMode, onPress, onDelete }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  // أنيميشن وضع التعديل (staggered)
  const editAnim = useRef(new Animated.Value(isEditMode ? 1 : 0)).current;
  // أنيميشن الحذف
  const deleteFadeAnim = useRef(new Animated.Value(1)).current;
  const deleteScaleAnim = useRef(new Animated.Value(1)).current;
  const [isAnimatingDelete, setIsAnimatingDelete] = useState(false);
  const lastAchievementRef = useRef(customAchievement);
  const wasFilled = useRef(!!customAchievement);

  if (customAchievement) lastAchievementRef.current = customAchievement;
  const displayAchievement = isAnimatingDelete ? lastAchievementRef.current : customAchievement;

  // أنيميشن الدخول + الحذف
  useEffect(() => {
    const filled = !!customAchievement;
    if (!wasFilled.current && filled) {
      // إضافة جديدة → أنيميشن دخول
      scaleAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    } else if (wasFilled.current && !filled) {
      // حذف → أنيميشن خروج ناعم
      setIsAnimatingDelete(true);
      Animated.parallel([
        Animated.timing(deleteFadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.spring(deleteScaleAnim, { toValue: 0.05, tension: 80, friction: 7, useNativeDriver: true }),
      ]).start(() => {
        // نُغيّر الـ state فقط — setValue تصير في useEffect بعد الرسم لتجنب الوميض
        setIsAnimatingDelete(false);
      });
    }
    wasFilled.current = filled;
  }, [customAchievement]);

  // بعد انتهاء أنيميشن الحذف وإعادة الرسم، نعيد الـ animated values لحالتها الطبيعية
  useEffect(() => {
    if (!isAnimatingDelete) {
      deleteScaleAnim.setValue(1);
      Animated.timing(deleteFadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
  }, [isAnimatingDelete]);

  // أنيميشن تبديل وضع التعديل (staggered)
  useEffect(() => {
    Animated.spring(editAnim, {
      toValue: isEditMode ? 1 : 0,
      tension: 80,
      friction: 9,
      delay: isEditMode ? index * 30 : 0,
      useNativeDriver: true,
    }).start();
  }, [isEditMode]);

  const row = Math.floor(index / FRAMES_PER_ROW);
  const getTranslateYForRow = (rowNumber: number) => {
    const { height: H } = Dimensions.get('window');
    if (rowNumber === 0) return -H * 0.007;
    if (rowNumber === 1) return H * 0.015;
    if (rowNumber === 2) return H * 0.036;
    return H * 0.065;
  };

  let croppedImage = null;
  if (displayAchievement) {
    const { cropData, imageUri } = displayAchievement;
    const rs = CLIP_SIZE / cropData.cropNaturalSize;
    croppedImage = (
      <View style={styles.customImageClip}>
        <Image
          source={{ uri: imageUri }}
          style={{
            width: cropData.imageNaturalWidth * rs,
            height: cropData.imageNaturalHeight * rs,
            marginLeft: -cropData.cropNaturalX * rs,
            marginTop: -cropData.cropNaturalY * rs,
          }}
          resizeMode="stretch"
        />
      </View>
    );
  }

  const isVisible = isEditMode || !!displayAchievement || isAnimatingDelete;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={displayAchievement ? 0.85 : 0.6}
      disabled={!isEditMode && !displayAchievement}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <Animated.View
        style={[
          styles.achievementContainer,
          {
            opacity: deleteFadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, deleteScaleAnim) },
              { translateY: getTranslateYForRow(row) },
            ],
          },
        ]}
      >
        <Animated.View style={[styles.flashBackground, { opacity: flashAnim }]} />

        <Image
          source={require('../../assets/frame.png')}
          style={styles.frameImage}
          resizeMode="contain"
        />

        {croppedImage}

        {/* علامة + للإطارات الفارغة — تظهر/تختفي مع أنيميشن */}
        {!displayAchievement && (
          <Animated.Text
            style={[
              styles.plusSign,
              {
                opacity: editAnim,
                transform: [{ scale: editAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
              },
            ]}
          >
            ＋
          </Animated.Text>
        )}

        {/* زر الحذف للإطارات الممتلئة — يظهر/يختفي مع أنيميشن */}
        {displayAchievement && onDelete && (
          <Animated.View
            pointerEvents={isEditMode ? 'auto' : 'none'}
            style={[
              styles.deleteBtn,
              {
                opacity: editAnim,
                transform: [{ scale: editAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
              },
            ]}
          >
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── رف الطفل الفردي ──────────────────────────────────────────────────────────

interface ChildShelfProps {
  child: Child;
  shelves: CustomAchievement[][];
  currentPage: number;
  isEditMode: boolean;
  onPageChange: (page: number) => void;
  onAddToFrame: (index: number, childId: string, page: number) => void;
  onDeleteFrame: (index: number, page: number) => void;
  onViewAchievement: (achievement: CustomAchievement) => void;
  shelfFlatListRef: React.RefObject<FlatList | null>;
}

const ChildShelf: React.FC<ChildShelfProps> = ({
  child, shelves, currentPage, isEditMode,
  onPageChange, onAddToFrame, onDeleteFrame, onViewAchievement, shelfFlatListRef,
}) => {
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      onPageChange(viewableItems[0].index);
    }
  }, [onPageChange]);

  return (
    <View style={styles.shelfContainer}>
      {/* صورة الرف الخشبي كخلفية */}
      <View style={styles.shelfImageContainer}>
        <Image source={require('../../assets/shelf.png')} style={styles.shelfBackground} />
      </View>

      {/* اسم الطفل */}
      <View style={styles.nameplateContainer}>
        <Text style={styles.nameText}>{child.name}</Text>
      </View>

      {/* صفحات الرف */}
      <FlatList
        ref={shelfFlatListRef}
        data={shelves}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `page_${i}`}
        initialScrollIndex={Math.min(currentPage, Math.max(0, shelves.length - 1))}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item: achievements, index: pageIndex }) => (
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
            <View style={styles.achievementsGrid}>
              {Array.from({ length: MAX_ACHIEVEMENTS }, (_, i) => {
                const achievement = achievements[i] ?? null;
                return (
                  <FrameItem
                    key={i}
                    index={i}
                    customAchievement={achievement}
                    isEditMode={isEditMode}
                    onPress={achievement
                      ? () => onViewAchievement(achievement)
                      : () => onAddToFrame(i, child.id, pageIndex)
                    }
                    onDelete={achievement ? () => onDeleteFrame(i, pageIndex) : undefined}
                  />
                );
              })}
            </View>
          </View>
        )}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        removeClippedSubviews={false}
      />

      {/* نقاط تنقل الرفوف */}
      {shelves.length > 1 && (
        <View style={styles.shelfPaginationContainer}>
          {shelves.map((_, i) => (
            <View key={i} style={[styles.paginationDot, i === currentPage && styles.paginationDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── شاشة اختيار الأطفال ─────────────────────────────────────────────────────

interface ChildrenListProps {
  children: Child[];
  onSelect: (index: number) => void;
  onBack: () => void;
}

const ChildrenListScreen: React.FC<ChildrenListProps> = ({ children, onSelect, onBack }) => (
  <LinearGradient colors={['#7241c6', '#5c34a3', '#7241c6']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
    <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
      <BackArrowIcon />
    </TouchableOpacity>
    <Text style={listStyles.header}>رف الإنجازات 🏆</Text>
    <Text style={listStyles.subtitle}>اختر الطفل لعرض رفه</Text>
    <FlatList
      data={children}
      numColumns={2}
      keyExtractor={(item) => item.id}
      contentContainerStyle={listStyles.listContent}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={[listStyles.card, { borderColor: item.color || '#FFD700' }]}
          onPress={() => onSelect(index)}
          activeOpacity={0.85}
        >
          <View style={[listStyles.avatarCircle, { backgroundColor: (item.color || '#FFD700') + '33', overflow: 'hidden' }]}>
            {item.isAvatarImage
              ? <Image source={{ uri: item.avatar }} style={{ width: 64, height: 64, borderRadius: 32 }} resizeMode="cover" />
              : <Text style={listStyles.avatarEmoji}>{item.avatar || (item.gender === 'girl' ? '👧' : '👦')}</Text>
            }
          </View>
          <Text style={listStyles.childName}>{item.name}</Text>
          <View style={[listStyles.colorBar, { backgroundColor: item.color || '#FFD700' }]} />
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <View style={listStyles.hintCard}>
          <View style={listStyles.hintIconRow}>
            <Text style={listStyles.hintIcon}>💡</Text>
            <Text style={listStyles.hintTitle}>كيف يعمل رف الإنجازات؟</Text>
          </View>
          <View style={listStyles.hintDivider} />
          <View style={listStyles.hintRow}>
            <Text style={listStyles.hintBullet}>🏅</Text>
            <Text style={listStyles.hintText}>لكل طفل رف خاص به يمكنك فيه حفظ شهاداته وإنجازاته سواءً من المدرسة أو النادي أو أي مجال آخر.</Text>
          </View>
          <View style={listStyles.hintRow}>
            <Text style={listStyles.hintBullet}>📸</Text>
            <Text style={listStyles.hintText}>يمكنك إضافة صور الشهادات والإنجازات مباشرةً من معرض الصور وتعديل إطارها بالقص والتكبير.</Text>
          </View>
          <View style={listStyles.hintRow}>
            <Text style={listStyles.hintBullet}>🗂️</Text>
            <Text style={listStyles.hintText}>يمكنك إنشاء أكثر من رف لنفس الطفل لتنظيم إنجازاته حسب الفترة أو الموضوع.</Text>
          </View>
          <View style={listStyles.hintRow}>
            <Text style={listStyles.hintBullet}>💾</Text>
            <Text style={listStyles.hintText}>إنجازات طفلك محفوظة بأمان داخل التطبيق — حتى لو ضاعت الصورة من معرضك ستجدها هنا دائماً، ويمكنك تنزيلها في أي وقت.</Text>
          </View>
        </View>
      }
    />
  </LinearGradient>
);

// ─── الشاشة الرئيسية ──────────────────────────────────────────────────────────

export const AchievementShelfScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { children } = useChildren();
  const safeChildren = Array.isArray(children) ? children : [];

  // عرض قائمة الأطفال أو الرف
  const [viewMode, setViewMode] = useState<'list' | 'shelf'>('list');
  const [currentIndex, setCurrentIndex] = useState(0);

  // رفوف الإنجازات لكل طفل
  const [allShelves, setAllShelves] = useState<Record<string, CustomAchievement[][]>>({});
  // رقم الصفحة الحالية لكل طفل
  const [shelfPageMap, setShelfPageMap] = useState<Record<string, number>>({});
  // وضع التعديل
  const [isEditMode, setIsEditMode] = useState(false);
  const editButtonsAnim = useRef(new Animated.Value(0)).current;
  const shelfFlatListRef = useRef<FlatList>(null);

  // حالة تدفق الإضافة
  const [cropVisible, setCropVisible] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [nameVisible, setNameVisible] = useState(false);
  const [pendingCrop, setPendingCrop] = useState<CropData | null>(null);
  const [pendingFrameIdx, setPendingFrameIdx] = useState<number | null>(null);
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);
  const [pendingShelfPage, setPendingShelfPage] = useState(0);

  // التفاصيل
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<CustomAchievement | null>(null);

  // أنيميشن الرف (أصلي)
  const flashAnim = useRef(new Animated.Value(0)).current;
  const cameraScaleAnim = useRef(new Animated.Value(1)).current;
  const cameraRotateAnim = useRef(new Animated.Value(0)).current;
  const frameScaleAnim = useRef(new Animated.Value(0)).current;
  const frameOpacityAnim = useRef(new Animated.Value(0)).current;
  const screenshotRef = useRef<View>(null);

  // تحميل الرفوف من AsyncStorage
  useEffect(() => {
    const load = async () => {
      const result: Record<string, CustomAchievement[][]> = {};
      for (const child of safeChildren) {
        result[child.id] = await loadAllShelves(child.id);
      }
      setAllShelves(result);
    };
    load();
  }, [safeChildren.length]);

  useEffect(() => {
    Animated.spring(editButtonsAnim, {
      toValue: isEditMode ? 1 : 0,
      tension: 80,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [isEditMode]);

  // ── فتح رف طفل محدد ──
  const handleSelectChild = (index: number) => {
    setCurrentIndex(index);
    setIsEditMode(false);
    setViewMode('shelf');
  };

  // ── إضافة صورة لإطار ──
  const handleAddToFrame = (frameIndex: number, childId: string, shelfPage: number) => {
    setPendingFrameIdx(frameIndex);
    setPendingChildId(childId);
    setPendingShelfPage(shelfPage);
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, (res) => {
      if (res.didCancel || res.errorCode || !res.assets?.[0]) return;
      const asset = res.assets[0];
      if (!asset.uri || !asset.width || !asset.height) return;
      setPendingImage({ uri: asset.uri, naturalWidth: asset.width, naturalHeight: asset.height });
      setCropVisible(true);
    });
  };

  const handleCropDone = (cropData: CropData) => {
    setCropVisible(false);
    setPendingCrop(cropData);
    setNameVisible(true);
  };

  const handleCropCancel = () => {
    setCropVisible(false);
    setPendingImage(null);
    setPendingFrameIdx(null);
    setPendingChildId(null);
    setPendingShelfPage(0);
  };

  const handleNameConfirm = (name: string) => {
    if (!pendingImage || !pendingCrop || pendingFrameIdx === null || !pendingChildId) return;
    const achievement: CustomAchievement = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      imageUri: pendingImage.uri,
      cropData: pendingCrop,
      name,
      addedAt: new Date().toISOString(),
    };
    const cid = pendingChildId;
    const fidx = pendingFrameIdx;
    const page = pendingShelfPage;
    setAllShelves(prev => {
      const shelves = (prev[cid] || [[]]).map(s => [...s]);
      if (!shelves[page]) shelves[page] = [];
      shelves[page][fidx] = achievement;
      saveAllShelves(cid, shelves);
      return { ...prev, [cid]: shelves };
    });
    setNameVisible(false);
    setPendingImage(null);
    setPendingCrop(null);
    setPendingFrameIdx(null);
    setPendingChildId(null);
    setPendingShelfPage(0);
  };

  const handleNameCancel = () => {
    setNameVisible(false);
    setPendingImage(null);
    setPendingCrop(null);
    setPendingFrameIdx(null);
    setPendingChildId(null);
    setPendingShelfPage(0);
  };

  // ── حذف إنجاز ──
  const handleDeleteFrame = (frameIndex: number, shelfPage: number) => {
    const childId = safeChildren[currentIndex]?.id;
    if (!childId) return;
    Alert.alert('حذف الإنجاز', 'هل تريد حذف هذا الإنجاز؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: () => {
          setAllShelves(prev => {
            const shelves = (prev[childId] || [[]]).map(s => [...s]);
            if (shelves[shelfPage]) delete shelves[shelfPage][frameIndex];
            saveAllShelves(childId, shelves);
            return { ...prev, [childId]: shelves };
          });
        },
      },
    ]);
  };

  // ── رف جديد ──
  const handleNewShelf = () => {
    const childId = safeChildren[currentIndex]?.id;
    if (!childId) return;
    const current = allShelves[childId] || [[]];
    const newShelves = [...current, []];
    const newPageIndex = newShelves.length - 1;
    saveAllShelves(childId, newShelves);
    setAllShelves(prev => ({ ...prev, [childId]: newShelves }));
    setShelfPageMap(prev => ({ ...prev, [childId]: newPageIndex }));
    setTimeout(() => {
      shelfFlatListRef.current?.scrollToOffset({ offset: newPageIndex * SCREEN_WIDTH, animated: true });
    }, 100);
  };

  // ── حذف الرف الحالي ──
  const handleDeleteShelf = () => {
    const childId = safeChildren[currentIndex]?.id;
    if (!childId) return;
    const page = shelfPageMap[childId] ?? 0;
    const current = allShelves[childId] || [[]];
    const isLast = current.length <= 1;
    Alert.alert(
      isLast ? 'مسح الرف' : 'حذف الرف',
      isLast ? 'هل تريد مسح جميع إنجازات هذا الرف؟' : 'هل تريد حذف هذا الرف وجميع إنجازاته؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: isLast ? 'مسح' : 'حذف',
          style: 'destructive',
          onPress: () => {
            setIsEditMode(false);
            if (isLast) {
              const newShelves: CustomAchievement[][] = [[]];
              saveAllShelves(childId, newShelves);
              setAllShelves(prev => ({ ...prev, [childId]: newShelves }));
              setShelfPageMap(prev => ({ ...prev, [childId]: 0 }));
            } else {
              const newShelves = current.filter((_, i) => i !== page);
              const newPage = Math.min(page, newShelves.length - 1);
              saveAllShelves(childId, newShelves);
              setAllShelves(prev => ({ ...prev, [childId]: newShelves }));
              setShelfPageMap(prev => ({ ...prev, [childId]: newPage }));
              setTimeout(() => {
                shelfFlatListRef.current?.scrollToOffset({ offset: newPage * SCREEN_WIDTH, animated: true });
              }, 150);
            }
          },
        },
      ]
    );
  };

  // ── صلاحيات Android ──
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version;
        if (apiLevel >= 33) {
          const granted = await PermissionsAndroid.request(
            'android.permission.READ_MEDIA_IMAGES' as any,
            { title: 'صلاحية حفظ الصور', message: 'يحتاج التطبيق إلى صلاحية لحفظ الصور في الاستديو', buttonNeutral: 'اسألني لاحقاً', buttonNegative: 'إلغاء', buttonPositive: 'موافق' }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            { title: 'صلاحية حفظ الصور', message: 'يحتاج التطبيق إلى صلاحية لحفظ الصور في الاستديو', buttonNeutral: 'اسألني لاحقاً', buttonNegative: 'إلغاء', buttonPositive: 'موافق' }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch { return false; }
    }
    return true;
  };

  // ── لقطة شاشة (أصلي) ──
  const handleScreenshot = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('⚠️ تحتاج صلاحية', 'يرجى السماح بصلاحية حفظ الصور لحفظ اللقطة', [{ text: 'حسناً' }]);
        return;
      }
      Animated.parallel([
        Animated.sequence([
          Animated.timing(cameraScaleAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
          Animated.spring(cameraScaleAnim, { toValue: 1, tension: 50, friction: 3, useNativeDriver: true }),
        ]),
        Animated.timing(cameraRotateAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => { cameraRotateAnim.setValue(0); });
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.parallel([
            Animated.spring(frameScaleAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
            Animated.timing(frameOpacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          ]),
          Animated.delay(300),
          Animated.parallel([
            Animated.timing(frameScaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
            Animated.timing(frameOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => { frameScaleAnim.setValue(0); });
      setTimeout(async () => {
        try {
          if (screenshotRef.current) {
            const uri = await captureRef(screenshotRef, { format: 'png', quality: 1 });
            await CameraRoll.save(uri, { type: 'photo' });
            Alert.alert('📸 تم حفظ الصورة', 'تم حفظ لقطة رف الإنجازات بنجاح في الاستديو! 🎉', [{ text: 'رائع!' }]);
          }
        } catch { Alert.alert('❌ خطأ في الحفظ', 'حدث خطأ أثناء حفظ الصورة في الاستديو', [{ text: 'حسناً' }]); }
      }, 600);
    } catch { Alert.alert('❌ خطأ', 'حدث خطأ أثناء التقاط الصورة', [{ text: 'حسناً' }]); }
  };

  // المودالات المشتركة
  const modals = (
    <>
      <CropModal visible={cropVisible} image={pendingImage} onCrop={handleCropDone} onCancel={handleCropCancel} />
      <NameModal visible={nameVisible} onConfirm={handleNameConfirm} onCancel={handleNameCancel} />
      <DetailModal visible={detailVisible} achievement={selectedAchievement} onClose={() => setDetailVisible(false)} />
    </>
  );

  // ── شاشة: اختيار الطفل ──
  if (viewMode === 'list') {
    if (safeChildren.length === 0) {
      return (
        <LinearGradient colors={['#7241c6', '#5c34a3', '#7241c6']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Image source={require('../../assets/shelf.png')} style={styles.emptyShelfBackground} resizeMode="cover" />
          <View style={styles.blurOverlay} />
          <View style={styles.emptyMessageContainer}>
            <Text style={styles.emptyMessageText}>ما عندك أبناء، أضف طفلاً اولا</Text>
          </View>
          {modals}
        </LinearGradient>
      );
    }
    return (
      <>
        <ChildrenListScreen children={safeChildren} onSelect={handleSelectChild} onBack={() => navigation.goBack()} />
        {modals}
      </>
    );
  }

  // ── شاشة: الرف ──
  const currentChild = safeChildren[currentIndex];
  if (!currentChild) return null;

  const currentShelfPage = shelfPageMap[currentChild.id] ?? 0;
  const currentShelves = allShelves[currentChild.id] || [[]];

  return (
    <View style={styles.container} collapsable={false}>
      <LinearGradient
        colors={['#7241c6', '#5c34a3', '#7241c6']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        {/* المنطقة اللي بنصورها فقط */}
        <View ref={screenshotRef} collapsable={false} style={StyleSheet.absoluteFill}>
          <ChildShelf
            key={currentChild.id}
            child={currentChild}
            shelves={currentShelves}
            currentPage={currentShelfPage}
            isEditMode={isEditMode}
            onPageChange={(page) => setShelfPageMap(prev => ({ ...prev, [currentChild.id]: page }))}
            onAddToFrame={handleAddToFrame}
            onDeleteFrame={handleDeleteFrame}
            onViewAchievement={(a) => { setSelectedAchievement(a); setDetailVisible(true); }}
            shelfFlatListRef={shelfFlatListRef}
          />
        </View>

        {/* زر الرجوع لقائمة الأطفال */}
        <TouchableOpacity style={styles.backButton} onPress={() => { setViewMode('list'); setIsEditMode(false); }} activeOpacity={0.8}>
          <BackArrowIcon />
        </TouchableOpacity>

        {/* زر لقطة الشاشة */}
        <Animated.View style={[styles.screenshotButton, {
          transform: [
            { scale: cameraScaleAnim },
            { rotate: cameraRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        }]}>
          <TouchableOpacity style={styles.screenshotButtonInner} onPress={handleScreenshot} activeOpacity={0.8}>
            <CameraIcon />
          </TouchableOpacity>
        </Animated.View>

        {/* أزرار التعديل — دايمًا مرندرة لتجنب ghost views، نتحكم بالظهور عبر Animated */}
        <Animated.View
          pointerEvents={isEditMode ? 'auto' : 'none'}
          style={[styles.deleteShelfButton, {
            opacity: editButtonsAnim,
            transform: [{ scale: editButtonsAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
          }]}
        >
          <TouchableOpacity onPress={handleDeleteShelf} activeOpacity={0.8}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
            <Text style={styles.newShelfButtonText}>حذف الرف</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          pointerEvents={isEditMode ? 'auto' : 'none'}
          style={[styles.newShelfButton, {
            opacity: editButtonsAnim,
            transform: [{ scale: editButtonsAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
          }]}
        >
          <TouchableOpacity onPress={handleNewShelf} activeOpacity={0.8}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
            <Text style={styles.newShelfButtonText}>رف جديد</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* زر التعديل (قلم) */}
        <TouchableOpacity
          style={[styles.editButton, isEditMode && styles.editButtonActive]}
          onPress={() => setIsEditMode(v => !v)}
          activeOpacity={0.8}
        >
          <PencilIcon />
        </TouchableOpacity>

        <Animated.View style={[styles.flashEffect, { opacity: flashAnim }]} pointerEvents="none" />
        <Animated.View style={[styles.whiteFrame, { opacity: frameOpacityAnim, transform: [{ scale: frameScaleAnim }] }]} pointerEvents="none" />
      </LinearGradient>

      {modals}
    </View>
  );
};

// ─── الستايلات الأصلية (لم تتغير أي قيمة) ───────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  screenshotButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  screenshotButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  flashEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
  },
  whiteFrame: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    right: '5%',
    bottom: '10%',
    backgroundColor: 'transparent',
    borderWidth: 15,
    borderColor: '#FFFFFF',
    borderRadius: 30,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 998,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  shelfContainer: {
    flex: 1,
    position: 'relative',
  },
  shelfImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shelfBackground: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyShelfBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  emptyMessageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessageText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  nameplateContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.11,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    letterSpacing: 1,
  },
  achievementsGrid: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.21,
    left: SCREEN_WIDTH * 0.1,
    right: SCREEN_WIDTH * 0.1,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementContainer: {
    width: (SCREEN_WIDTH * 0.8) / 3 - 5,
    height: SCREEN_HEIGHT * 0.09,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  flashBackground: {
    position: 'absolute',
    width: FRAME_SIZE + 40,
    height: FRAME_SIZE + 40,
    borderRadius: (FRAME_SIZE + 40) / 2,
    backgroundColor: '#FFFFFF',
  },
  frameImage: {
    position: 'absolute',
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  // ─ جديد: الصورة المقصوصة داخل الإطار
  // بدون position:absolute حتى يمركزها flexbox مثل الإيموجي الأصلي
  customImageClip: {
    width: CLIP_SIZE,
    height: CLIP_SIZE,
    overflow: 'hidden',
    borderRadius: 3,
    zIndex: 1,
  },
  // ─ جديد: علامة + للإطارات الفارغة
  plusSign: {
    fontSize: 26,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '300',
    textAlign: 'center',
    zIndex: 3,
  },
  transitionBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  paginationContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.165,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  // ─ زر حذف الإنجاز
  deleteBtn: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  // ─ زر التعديل (قلم)
  editButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    zIndex: 1000,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  editButtonActive: {
    backgroundColor: '#7241c6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  // ─ زر حذف الرف
  deleteShelfButton: {
    position: 'absolute',
    bottom: 50,
    right: 196,
    zIndex: 1000,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 59, 48, 0.75)',
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  // ─ زر رف جديد
  newShelfButton: {
    position: 'absolute',
    bottom: 50,
    right: 80,
    zIndex: 1000,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newShelfButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // ─ نقاط تنقل الرفوف
  shelfPaginationContainer: {
    position: 'absolute',
    bottom: 115,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── ستايلات شاشة اختيار الأطفال ─────────────────────────────────────────────

const listStyles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginTop: 90,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 28,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  card: {
    flex: 1,
    margin: 10,
    minHeight: 150,
    borderRadius: 22,
    borderWidth: 2.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    overflow: 'hidden',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarEmoji: { fontSize: 36 },
  childName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  colorBar: {
    marginTop: 10,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  hintCard: {
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.35)',
    padding: 18,
  },
  hintIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  hintIcon: {
    fontSize: 22,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFD700',
    flex: 1,
    textAlign: 'right',
  },
  hintDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  hintBullet: {
    fontSize: 16,
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    textAlign: 'right',
  },
});

// ─── ستايلات مودال القص ───────────────────────────────────────────────────────

const cropStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  dark: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.65)' },
  cropBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  hintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnRow: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    zIndex: 10,
  },
  cancelBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cropBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, backgroundColor: '#7241c6' },
  cropTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  zoomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  zoomBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomTxt: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
  zoomLabel: { color: '#fff', fontSize: 15, fontWeight: '600', minWidth: 52, textAlign: 'center' },
});

// ─── ستايلات مودال التسمية ────────────────────────────────────────────────────

const nameStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#2d1b69',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 16 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  row: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  cancelTxt: { color: 'rgba(255,255,255,0.65)', fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#7241c6', alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: 'rgba(114,65,198,0.35)' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ─── ستايلات مودال التفاصيل ───────────────────────────────────────────────────

const detailStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#2d1b69',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.88,
  },
  imageClip: { overflow: 'hidden', borderRadius: 8 },
  frameOverlay: { position: 'absolute', top: 16, alignSelf: 'center' },
  name: { fontSize: 22, fontWeight: '900', color: '#FFD700', marginTop: 18, textAlign: 'center' },
  date: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, textAlign: 'center' },
  closeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  downloadBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(114,65,198,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(114,65,198,0.8)',
  },
  closeTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
