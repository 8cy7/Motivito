// components/EditChildModal.tsx

import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { AppModal } from './AppModal';
import Svg, { Path } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import { Child } from '../types'; // عدّل المسار حسب مكان types.ts

const { width, height } = Dimensions.get('window');

interface EditChildModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    avatar: string;
    isAvatarImage?: boolean;
  }) => void;
  child: Child;
}

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

const CameraIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24">
    <Path
      d="M20 5h-3.17l-1.24-1.65C15.22 2.51 14.62 2 14 2h-4c-.62 0-1.22.51-1.59 1.35L7.17 5H4
         c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13
         c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8
         c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
      fill="#FFFFFF"
    />
  </Svg>
);

const ALL_EMOJIS = ['👦', '👧', '🧒', '👶', '🧑', '👨', '👩'];

export const EditChildModal: React.FC<EditChildModalProps> = ({
  visible,
  onClose,
  onSubmit,
  child,
}) => {
  const [name, setName] = useState(child.name);
  const [selectedEmoji, setSelectedEmoji] = useState<string>(
    child.isAvatarImage ? ALL_EMOJIS[0] : child.avatar,
  );
  const [avatarImageUri, setAvatarImageUri] = useState<string | null>(
    child.isAvatarImage ? child.avatar : null,
  );

  const usingImage = !!avatarImageUri;

  useEffect(() => {
    if (!visible) return;
    setName(child.name);
    if (child.isAvatarImage) {
      setAvatarImageUri(child.avatar);
      setSelectedEmoji(ALL_EMOJIS[0]); // أي شيء، لن يُستخدم إذا فيه صورة
    } else {
      setAvatarImageUri(null);
      setSelectedEmoji(child.avatar);
    }
  }, [visible, child]);

  const handlePickImage = async () => {
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
    });
  };

  const uploadColors =
    child.gender === 'boy'
      ? ['#4facfe', '#00b4d8']
      : ['#f093fb', '#f5576c'];

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
          <View
            style={[styles.modalContent, { backgroundColor: uploadColors[0] }]}
          >
            {/* الهيدر */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CloseIcon />
              </TouchableOpacity>

              <View style={styles.headerLeft}>
                <View>
                  <Text style={styles.modalTitle}>تعديل بيانات الطفل</Text>
                  <Text style={styles.modalSubtitle}>
                    عدّل الاسم أو الأيقونة / الصورة
                  </Text>
                </View>

                <View style={styles.iconContainer}>
                  {usingImage && avatarImageUri ? (
                    <Image
                      source={{ uri: avatarImageUri }}
                      style={styles.headerImage}
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
                    placeholder="اسم الطفل"
                    placeholderTextColor="#999999"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* الإيموجيات + مربع الصورة */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  اختر إيموجي أو أرفق صورة
                </Text>

                <View style={styles.emojiContainer}>
                  {ALL_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => {
                        setSelectedEmoji(emoji);
                        setAvatarImageUri(null); // نرجع لاستخدام الإيموجي
                      }}
                      style={styles.emojiOption}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[styles.emojiCard, { backgroundColor: !usingImage && selectedEmoji === emoji ? '#FFD54F' : '#FFFFFF' }]}
                      >
                        {!usingImage && selectedEmoji === emoji && (
                          <View style={styles.emojiSelectedIndicator}>
                            <CheckIcon />
                          </View>
                        )}
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* مربع أرفق صورة */}
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={styles.emojiOption}
                    activeOpacity={0.85}
                  >
                    <View
                      style={{
                        aspectRatio: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 3,
                        borderColor: '#000000',
                        borderRadius: 18,
                        backgroundColor: child.gender === 'boy' ? '#4facfe' : '#f093fb',
                        borderStyle: 'dashed',
                      }}
                    >
                      {usingImage && (
                        <View style={styles.emojiSelectedIndicator}>
                          <CheckIcon />
                        </View>
                      )}
                      <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <CameraIcon />
                        <Text style={{
                          marginTop: 6,
                          fontSize: 13,
                          fontWeight: '800',
                          color: '#FFFFFF',
                        }}>أرفق صورة</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* زر الحفظ */}
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
                      ? { backgroundColor: '#4CAF50' }
                      : { backgroundColor: '#999' },
                  ]}
                >
                  <Text style={styles.submitText}>حفظ التعييرات ✓</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
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
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#F5F5F5',
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
    color: '#FFFFFF',
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
  },
  uploadEmojiCard: {
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emojiSelectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 36,
  },
  uploadInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadEmojiText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submitButton: {
    borderRadius: 18,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    marginTop: 10,
    marginBottom: 20,
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
