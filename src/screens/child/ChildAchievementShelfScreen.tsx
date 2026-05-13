import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  FlatList,
  Animated,
  ViewToken,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Orientation from 'react-native-orientation-locker';
import { useChildren } from '../../contexts/ChildrenContext';
import { Child, Badge } from '../../types';
import { calculateBadges } from '../../utils/badgeUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// قياسات الرف والإطارات - تحديث للآيباد
const FRAME_SIZE = 90; // حجم الفريم مناسب
const FRAMES_PER_ROW = 5; // 5 فريمات في الصف
const SHELVES_COUNT = 4; // 4 صفوف (5×4 = 20 فريم، لكن الحد الأقصى 18)
const MAX_ACHIEVEMENTS = 18; // الحد الأقصى 18 فريم

// Back Arrow Icon
const BackArrowIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24">
    <Path
      d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
      fill="#FFFFFF"
    />
  </Svg>
);

// Camera Icon for Screenshot
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

interface AchievementItemProps {
  badge: Badge;
  index: number;
  isNew?: boolean;
}

// عنصر الإنجاز مع الإطار
const AchievementItem: React.FC<AchievementItemProps> = ({ badge, index, isNew = false }) => {
  const scaleAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(isNew ? 100 : 0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // حساب مستوى الشارة: الأولى 1، الثانية 10، الثالثة 20، إلخ
  const badgeLevel = index === 0 ? 1 : (index + 1) * 10;

  useEffect(() => {
    if (isNew) {
      // أنيميشن الظهور: صعود + فلاش
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isNew]);

  return (
    <Animated.View
      style={[
        styles.achievementContainer,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
    >
      {/* فلاش الخلفية */}
      <Animated.View
        style={[
          styles.flashBackground,
          {
            opacity: flashAnim,
          },
        ]}
      />

      {/* إطار الإنجاز - الفريم الخشبي الجديد */}
      <Image
        source={require('../../assets/tabletsframe.png')}
        style={styles.frameImage}
        resizeMode="contain"
      />

      {/* الإيموجي/الشارة في المنتصف */}
      <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
    </Animated.View>
  );
};

interface ChildShelfProps {
  child: Child;
}

// رف الطفل الفردي
const ChildShelf: React.FC<ChildShelfProps> = ({ child }) => {
  const badges = (child.badges && child.badges.length > 0)
    ? child.badges
    : calculateBadges(child.level || 1, child.gender || 'boy');
  const limitedBadges = badges.slice(0, MAX_ACHIEVEMENTS);

  return (
    <View style={styles.shelfContainer}>
      {/* صورة الرف الخشبي كخلفية - الخلفية الجديدة */}
      <View style={styles.shelfImageContainer}>
        <Image
          source={require('../../assets/tabletsbackground.png')}
          style={styles.shelfBackground}
        />
      </View>

      {/* اسم الطفل في فقاعة */}
      <View style={styles.childNameBubbleContainer}>
        <View style={[
          styles.childNameBubble,
          {
            backgroundColor: child.gender === 'girl' ? '#FF69B4' : '#4A90E2',
          }
        ]}>
          <Text style={styles.childNameText}>{child.name}</Text>
        </View>
      </View>

      {/* الإنجازات موزعة على الرفوف */}
      <View style={styles.achievementsGrid}>
        {limitedBadges.map((badge, index) => (
          <AchievementItem
            key={`${badge.id}-${index}`}
            badge={badge}
            index={index}
          />
        ))}
      </View>
    </View>
  );
};

// الشاشة الرئيسية
export const ChildAchievementShelfScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { width: dynWidth, height: dynHeight } = useWindowDimensions();
  const { children } = useChildren();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // قفل الاتجاه الأفقي للآيباد فقط في هذه الشاشة
  useEffect(() => {
    // قفل على الوضع الأفقي
    Orientation.lockToLandscape();

    // عند الخروج من الشاشة، إرجاع الاتجاه للطبيعي
    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  // أنيميشن لقطة الشاشة
  const flashAnim = useRef(new Animated.Value(0)).current;
  const cameraScaleAnim = useRef(new Animated.Value(1)).current;
  const cameraRotateAnim = useRef(new Animated.Value(0)).current;
  const frameScaleAnim = useRef(new Animated.Value(0)).current;
  const frameOpacityAnim = useRef(new Animated.Value(0)).current;
  const screenshotRef = useRef<View>(null);
  const hasGrantedPermission = useRef(false);

  // إذا جاء طفل واحد من route params، نعرض رفه فقط
  const singleChild = route?.params?.singleChild;

  // تأمين ضد عدم وجود أطفال
  const safeChildren = singleChild
    ? [singleChild]
    : (Array.isArray(children) ? children : []);

  // طلب صلاحية حفظ الصور (Android)
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version;

        // Android 13+ (API 33+) يستخدم READ_MEDIA_IMAGES
        if (apiLevel >= 33) {
          const granted = await PermissionsAndroid.request(
            'android.permission.READ_MEDIA_IMAGES' as any,
            {
              title: 'صلاحية حفظ الصور',
              message: 'يحتاج التطبيق إلى صلاحية لحفظ الصور في الاستديو',
              buttonNeutral: 'اسألني لاحقاً',
              buttonNegative: 'إلغاء',
              buttonPositive: 'موافق',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 12 وأقل
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'صلاحية حفظ الصور',
              message: 'يحتاج التطبيق إلى صلاحية لحفظ الصور في الاستديو',
              buttonNeutral: 'اسألني لاحقاً',
              buttonNegative: 'إلغاء',
              buttonPositive: 'موافق',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch {
        return false;
      }
    }
    return true;
  };

  // دالة لقطة الشاشة - التقاط أولاً ثم الأنيميشن
  const handleScreenshot = async () => {
    try {
      // تحقق من الصلاحيات أولاً
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          '⚠️ تحتاج صلاحية',
          'يرجى السماح بصلاحية حفظ الصور لحفظ اللقطة',
          [{ text: 'حسناً', style: 'default' }]
        );
        return;
      }

      // انتظر قليلاً بعد إعطاء الصلاحية لأول مرة فقط
      if (!hasGrantedPermission.current) {
        hasGrantedPermission.current = true;
        await new Promise<void>(resolve => setTimeout(resolve, 2000));
      }

      // التقط الصورة أولاً قبل أي أنيميشن
      if (screenshotRef.current) {
        const uri = await captureRef(screenshotRef, {
          format: 'png',
          quality: 1,
        });

        await CameraRoll.save(uri, { type: 'photo' });

        // بعد حفظ الصورة، شغل الأنيميشن
        Animated.parallel([
          Animated.sequence([
            Animated.timing(cameraScaleAnim, {
              toValue: 0.7,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.spring(cameraScaleAnim, {
              toValue: 1,
              tension: 50,
              friction: 3,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(cameraRotateAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(flashAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(flashAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          cameraRotateAnim.setValue(0);
        });

        Alert.alert(
          '📸 تم حفظ الصورة',
          'تم حفظ لقطة رف الإنجازات بنجاح في الاستديو! 🎉',
          [{ text: 'رائع!', style: 'default' }]
        );
      }
    } catch (error) {
      void error;
      Alert.alert(
        '❌ خطأ',
        'حدث خطأ أثناء التقاط الصورة',
        [{ text: 'حسناً', style: 'default' }]
      );
    }
  };

  // أنيميشن التغبيش القوي والواقعي عند التبديل
  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null && viewableItems[0].index !== undefined) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < safeChildren.length) {
        // أنيميشن تغبيش قوي مع تأثير انزلاق الرف
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.85,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
        setCurrentIndex(newIndex);
      }
    }
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // حالة 1: لا يوجد أطفال
  if (safeChildren.length === 0) {
    return (
      <LinearGradient
        colors={['#7241c6', '#5c34a3', '#7241c6']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        {/* Screenshot Button */}
        <Animated.View
          style={[
            styles.screenshotButton,
            {
              transform: [
                { scale: cameraScaleAnim },
                {
                  rotate: cameraRotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.screenshotButtonInner}
            onPress={handleScreenshot}
            activeOpacity={0.8}
          >
            <CameraIcon />
          </TouchableOpacity>
        </Animated.View>

        {/* Flash Effect */}
        <Animated.View
          style={[
            styles.flashEffect,
            {
              opacity: flashAnim,
            },
          ]}
          pointerEvents="none"
        />

        {/* White Frame Animation */}
        <Animated.View
          style={[
            styles.whiteFrame,
            {
              opacity: frameOpacityAnim,
              transform: [{ scale: frameScaleAnim }],
            },
          ]}
          pointerEvents="none"
        />

        <Image
          source={require('../../assets/tabletsbackground.png')}
          style={styles.emptyShelfBackground}
          resizeMode="cover"
        />

        {/* طبقة التغبيش */}
        <View style={styles.blurOverlay} />

        {/* رسالة عدم وجود أطفال */}
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessageText}>ما عندك أبناء، أضف طفلاً اولا</Text>
        </View>
      </LinearGradient>
    );
  }

  // حالة 2 و 3: يوجد أطفال (مع أو بدون إنجازات)
  // Reference للرف فقط (بدون الأزرار)
  const shelfOnlyRef = useRef<View>(null);

  return (
    <View style={styles.container} collapsable={false}>
      <LinearGradient
        colors={['#7241c6', '#5c34a3', '#7241c6']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
      {/* المنطقة اللي بنصورها فقط - بدون الأزرار */}
      <View ref={screenshotRef} collapsable={false} style={StyleSheet.absoluteFill}>
        {/* عرض طفل واحد فقط - بدون سكرول */}
      {singleChild ? (
        <View style={[styles.pageContainer, { width: dynWidth, height: dynHeight }]}>
          <ChildShelf child={singleChild} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={safeChildren}
          horizontal
          pagingEnabled
          scrollEnabled={safeChildren.length > 1}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.pageContainer, { width: dynWidth, height: dynHeight }]}>
              <ChildShelf child={item} />
            </View>
          )}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(data, index) => ({
            length: dynWidth,
            offset: dynWidth * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={3}
        />
      )}
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <BackArrowIcon />
      </TouchableOpacity>

      {/* Screenshot Button */}
      <Animated.View
        style={[
          styles.screenshotButton,
          {
            transform: [
              { scale: cameraScaleAnim },
              {
                rotate: cameraRotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.screenshotButtonInner}
          onPress={handleScreenshot}
          activeOpacity={0.8}
        >
          <CameraIcon />
        </TouchableOpacity>
      </Animated.View>

      {/* Flash Effect */}
      <Animated.View
        style={[
          styles.flashEffect,
          {
            opacity: flashAnim,
          },
        ]}
        pointerEvents="none"
      />

      {/* White Frame Animation */}
      <Animated.View
        style={[
          styles.whiteFrame,
          {
            opacity: frameOpacityAnim,
            transform: [{ scale: frameScaleAnim }],
          },
        ]}
        pointerEvents="none"
      />

      {/* طبقة التغبيش أثناء التنقل */}
      <Animated.View
        style={[
          styles.transitionBlur,
          {
            opacity: fadeAnim,
          },
        ]}
        pointerEvents="none"
      />

      {/* مؤشر الصفحات */}
      {safeChildren.length > 1 && (
        <View style={styles.paginationContainer}>
          {safeChildren.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
      </LinearGradient>
    </View>
  );
};

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
  childNameBubbleContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.04,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  childNameBubble: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  childNameText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  achievementsGrid: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.20,
    left: SCREEN_WIDTH * 0.03, // مسافة من اليسار
    right: SCREEN_WIDTH * 0.12, // مسافة أكبر من اليمين - يبدأ يمين أكثر
    flexDirection: 'row-reverse', // يبدأ من اليمين
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    columnGap: SCREEN_WIDTH * 0.035, // مسافة أكبر بين الفريمات أفقياً
    rowGap: SCREEN_HEIGHT * 0.025, // مسافة بين الصفوف
  },
  achievementContainer: {
    width: (SCREEN_WIDTH * 0.90) / 5 - SCREEN_WIDTH * 0.026, // 5 فريمات في الصف
    height: (SCREEN_WIDTH * 0.90) / 5 - SCREEN_WIDTH * 0.026, // نفس العرض للحفاظ على التناسق
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
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  badgeEmoji: {
    fontSize: SCREEN_WIDTH * 0.068, // إيموجي بنفس نسبة الفريم
    textAlign: 'center',
    zIndex: 2,
  },
  badgeLabelContainer: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.032, // تحت الفريم
    backgroundColor: '#FFD700', // خلفية صفراء
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: SCREEN_WIDTH * 0.12,
    alignItems: 'center',
  },
  badgeLabelText: {
    fontSize: SCREEN_WIDTH * 0.022,
    fontWeight: '700',
    color: '#000000', // نص أسود
    textAlign: 'center',
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
    top: SCREEN_HEIGHT * 0.165, // 16.5% من ارتفاع الشاشة
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
});
