// components/AddChildModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { AppModal } from './AppModal';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';

const { width, height } = Dimensions.get('window');

interface AddChildModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (child: {
    name: string;
    avatar: string;
    isAvatarImage?: boolean;
    gender: 'boy' | 'girl';
  }) => void;
}

// Close Icon
const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="#FF0000"
    />
  </Svg>
);

const BOY_EMOJIS = ['👦', '🧒', '👶', '🧑', '👨'];
const GIRL_EMOJIS = ['👧', '👶', '🧒', '👩', '👱‍♀️'];

export const AddChildModal: React.FC<AddChildModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [selectedEmoji, setSelectedEmoji] = useState<string>(BOY_EMOJIS[0]);
  const [avatarImageUri, setAvatarImageUri] = useState<string | null>(null);

  const emojis = gender === 'boy' ? BOY_EMOJIS : GIRL_EMOJIS;
  const firstRowEmojis = emojis.slice(0, 3);
  const remainingEmojis = emojis.slice(3);
  const usingImage = !!avatarImageUri;

  // أنيميشن لمربع الكاميرا (هزّة + فلاش)
  const cameraScale = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setName('');
    setGender('boy');
    setSelectedEmoji(BOY_EMOJIS[0]);
    setAvatarImageUri(null);
  }, [visible]);

  const handleGenderChange = (newGender: 'boy' | 'girl') => {
    setGender(newGender);
    setSelectedEmoji(newGender === 'boy' ? BOY_EMOJIS[0] : GIRL_EMOJIS[0]);
  };

  const runCameraAnimation = () =>
    new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(cameraScale, {
            toValue: 0.9,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(cameraScale, {
            toValue: 1.05,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(cameraScale, {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: 0.85,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => resolve());
    });

  const handlePickImage = async () => {
    // أول شي الأنيميشن، بعدين فتح الصور
    await runCameraAnimation();

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) return;

      const uri = result.assets && result.assets[0] && result.assets[0].uri;
      if (uri) {
        setAvatarImageUri(uri);
      }
    } catch (e) {
      void e;
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const isAvatarImage = !!avatarImageUri;
    const avatar = isAvatarImage ? avatarImageUri! : selectedEmoji;

    onSubmit({
      name: name.trim(),
      avatar,
      isAvatarImage,
      gender,
    });
  };

  // ألوان النوع (صلبة بدون شفافية)
  const genderSelectedColors =
    gender === 'boy'
      ? ['#36A9FF', '#0099FF'] // أزرق
      : ['#FF82C1', '#FF5C9F']; // وردي

  // ألوان كرت الكاميرا
  const uploadColors =
    gender === 'boy'
      ? ['#4FACFE', '#00B4D8']
      : ['#F093FB', '#F5576C'];

  const emojiSelectedColors =
    gender === 'boy'
      ? ['#36A9FF', '#00B4FF']
      : ['#FF82C1', '#FF5C9F'];

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={
              gender === 'boy'
                ? ['#E3F2FD', '#BBDEFB']
                : ['#FCE4EC', '#F8BBD0']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContent}
          >
            {/* الهيدر */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CloseIcon />
              </TouchableOpacity>

              <View style={styles.headerLeft}>
                <View>
                  <Text style={styles.modalTitle}>إضافة طفل جديد</Text>
                  <Text style={styles.modalSubtitle}>
                    أدخل اسم الطفل واختر الأيقونة أو الصورة
                  </Text>
                </View>

                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: gender === 'boy' ? '#36A9FF' : '#FF82C1',
                      overflow: 'hidden',
                    },
                  ]}
                >
                  {usingImage && avatarImageUri ? (
                    <Image
                      source={{ uri: avatarImageUri }}
                      style={styles.headerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.headerEmoji}>{selectedEmoji}</Text>
                  )}
                </View>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* الاسم */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>الاسم</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="مثال: أحمد"
                    placeholderTextColor="#999999"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* النوع */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>النوع</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    onPress={() => handleGenderChange('boy')}
                    style={styles.genderOption}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.genderCard,
                        {
                          backgroundColor: gender === 'boy' ? '#36A9FF' : '#FFFFFF',
                        },
                      ]}
                    >
                      <Text style={styles.genderEmoji}>👦</Text>
                      <Text
                        style={[
                          styles.genderLabel,
                          gender === 'boy' && styles.genderLabelSelected,
                        ]}
                      >
                        ولد
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleGenderChange('girl')}
                    style={styles.genderOption}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.genderCard,
                        {
                          backgroundColor: gender === 'girl' ? '#FF82C1' : '#FFFFFF',
                        },
                      ]}
                    >
                      <Text style={styles.genderEmoji}>👧</Text>
                      <Text
                        style={[
                          styles.genderLabel,
                          gender === 'girl' && styles.genderLabelSelected,
                        ]}
                      >
                        بنت
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* الإيموجيات + مربع إرفاق صورة */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                اختر الايقونة او حمل صوره
                </Text>
                <View style={styles.emojiContainer}>
                  {/* الصف العلوي */}
                  {firstRowEmojis.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => {
                        setSelectedEmoji(emoji);
                        setAvatarImageUri(null);
                      }}
                      style={styles.emojiOption}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.emojiCard,
                          {
                            backgroundColor:
                              !usingImage && selectedEmoji === emoji
                                ? gender === 'boy'
                                  ? '#36A9FF'
                                  : '#FF82C1'
                                : '#FFFFFF',
                          },
                        ]}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* مربع أرفق صورة - يمين تحت مع هزّة + فلاش */}
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={styles.emojiOption}
                    activeOpacity={0.9}
                  >
                    <Animated.View
                      style={[
                        styles.emojiCard,
                        styles.uploadEmojiCard,
                        {
                          transform: [{ scale: cameraScale }],
                          backgroundColor: gender === 'boy' ? '#4FACFE' : '#F093FB',
                          overflow: 'hidden',
                        },
                      ]}
                    >
                      {usingImage && avatarImageUri ? (
                        <Image
                          source={{ uri: avatarImageUri }}
                          style={styles.uploadImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.uploadInner}>
                          <Text style={styles.cameraEmoji}>📸</Text>
                          <Text style={styles.uploadEmojiText}>أرفق صورة</Text>
                        </View>
                      )}

                      {/* فلاش أبيض يغطي الكرت للحظات */}
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.flashOverlay,
                          { opacity: flashOpacity },
                        ]}
                      />
                    </Animated.View>
                  </TouchableOpacity>

                  {/* بقية الإيموجيات (يسار تحت) */}
                  {remainingEmojis.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => {
                        setSelectedEmoji(emoji);
                        setAvatarImageUri(null);
                      }}
                      style={styles.emojiOption}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.emojiCard,
                          {
                            backgroundColor:
                              !usingImage && selectedEmoji === emoji
                                ? gender === 'boy'
                                  ? '#36A9FF'
                                  : '#FF82C1'
                                : '#FFFFFF',
                          },
                        ]}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* زر الإضافة */}
              <TouchableOpacity
                onPress={handleSubmit}
                style={styles.submitButton}
                activeOpacity={0.8}
                disabled={!name.trim()}
              >
                <View
                  style={[
                    styles.submitGradient,
                    name.trim()
                      ? { backgroundColor: '#667eea' }
                      : { backgroundColor: '#999' },
                  ]}
                >
                  <Text style={styles.submitText}> إضافة الطفل ✓</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
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
  modalContainer: {
    width: '100%',
    maxHeight: height * 0.9,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 3,
    borderColor: '#000000',
  },
  modalContent: {
    maxHeight: height * 0.9,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000',
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'right',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 25,
  },
  section: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  inputContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
    textAlign: 'right',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  genderCard: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 18,
  },
  genderEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  genderLabelSelected: {
    color: '#FFFFFF',
  },
  emojiContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiOption: {
    width: (width - 90) / 3,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  emojiCard: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  uploadEmojiCard: {
    backgroundColor: 'transparent',
  },
  emojiText: {
    fontSize: 36,
  },
  uploadInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraEmoji: {
    fontSize: 34,
    marginBottom: 4,
  },
  uploadEmojiText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  uploadImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    resizeMode: 'cover',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    borderRadius: 18,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    marginTop: 10,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
