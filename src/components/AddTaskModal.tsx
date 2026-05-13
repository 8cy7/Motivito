import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { AppModal } from './AppModal';
import Svg, { Path } from 'react-native-svg';
import { TaskDifficulty, TaskFrequency } from '../types';

const { width, height } = Dimensions.get('window');

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description?: string;
    difficulty: TaskDifficulty;
    points: number;
    category: 'daily' | 'weekly' | 'special';
    frequency: TaskFrequency;
  }) => void;
  childName: string;
  childAvatar: string;
  isAvatarImage?: boolean;
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

// Check Icon
const CheckIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20">
    <Path
      d="M7.5 14.5L3 10L4.41 8.59L7.5 11.67L15.59 3.59L17 5L7.5 14.5Z"
      fill="#FFFFFF"
    />
  </Svg>
);

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
  childName,
  childAvatar,
  isAvatarImage,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [frequency, setFrequency] = useState<TaskFrequency>('once');

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }

    // Calculate points based on difficulty
    let points = 50;
    switch (difficulty) {
      case 'easy':
        points = 50;
        break;
      case 'medium':
        points = 100;
        break;
      case 'hard':
        points = 200;
        break;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      points,
      category: 'daily',
      frequency,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setFrequency('once');
  };

  const difficulties: { value: TaskDifficulty; label: string; color: string; emoji: string }[] = [
    { value: 'easy', label: 'سهل', color: '#4CAF50', emoji: '😊' },
    { value: 'medium', label: 'متوسط', color: '#FF9800', emoji: '💪' },
    { value: 'hard', label: 'صعب', color: '#F44336', emoji: '🔥' },
  ];

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
        {/* Dark Background */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          <View
            style={[styles.modalContent, { backgroundColor: '#7241c6' }]}
          >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderWidth: 2,
                      borderColor: '#000',
                      overflow: 'hidden',
                    }}
                  >
                    {isAvatarImage ? (
                      <Image
                        source={{ uri: childAvatar }}
                        style={styles.headerAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.headerEmoji}>{childAvatar}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>إضافة مهمة جديدة</Text>
                    <Text style={styles.modalSubtitle}>لـ {childName}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <CloseIcon />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Task Name Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>اسم المهمة</Text>
                  <View style={[styles.inputContainer, !title.trim() && styles.inputContainerEmpty]}>
                    <TextInput
                      style={styles.input}
                      placeholder="مثال: ترتيب الغرفة"
                      placeholderTextColor="#999999"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>
                </View>

                {/* Task Description Input (Optional) */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>وصف المهمة (اختياري)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="مثال: ترتيب السرير والألعاب والملابس"
                      placeholderTextColor="#999999"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* Difficulty Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>صعوبة المهمة</Text>
                  <View style={{ gap: 12 }}>
                    {difficulties.map((diff) => {
                      const isSelected = difficulty === diff.value;
                      return (
                        <TouchableOpacity
                          key={diff.value}
                          onPress={() => setDifficulty(diff.value)}
                          activeOpacity={0.8}
                          style={{
                            borderRadius: 18,
                          }}
                        >
                          <View style={{
                            backgroundColor: isSelected ? diff.color : '#FFFFFF',
                            padding: 18,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: '#000000',
                            borderRadius: 18,
                            height: 80,
                            justifyContent: 'center',
                          }}>
                            {/* Selection Indicator */}
                            {isSelected && (
                              <View style={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}>
                                <CheckIcon />
                              </View>
                            )}

                            {/* Emoji - في الوسط */}
                            <View style={{
                              width: 50,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Text style={{ fontSize: 32 }}>{diff.emoji}</Text>
                            </View>

                            {/* Label and Points Row */}
                            <View style={{
                              flex: 1,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}>
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '700',
                                color: isSelected ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                                textAlign: 'left',
                              }}>
                                {diff.value === 'easy'
                                  ? '50'
                                  : diff.value === 'medium'
                                  ? '100'
                                  : '200'} نقطة
                              </Text>
                              <Text style={{
                                fontSize: 18,
                                fontWeight: '700',
                                color: isSelected ? '#FFFFFF' : '#333333',
                                textAlign: 'right',
                              }}>
                                {diff.label}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Frequency Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>نوع التكرار</Text>
                  <View style={styles.frequencyRow}>
                    <TouchableOpacity
                      onPress={() => setFrequency('weekly')}
                      style={[
                        styles.frequencyButton,
                        frequency === 'weekly' && styles.frequencyButtonActive
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.frequencyEmoji}>📅</Text>
                      <Text style={[
                        styles.frequencyButtonText,
                        frequency === 'weekly' && styles.frequencyButtonTextActive
                      ]}>أسبوعية</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setFrequency('daily')}
                      style={[
                        styles.frequencyButton,
                        frequency === 'daily' && styles.frequencyButtonActive
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.frequencyEmoji}>🔄</Text>
                      <Text style={[
                        styles.frequencyButtonText,
                        frequency === 'daily' && styles.frequencyButtonTextActive
                      ]}>يومية</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setFrequency('once')}
                      style={[
                        styles.frequencyButton,
                        frequency === 'once' && styles.frequencyButtonActive
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.frequencyEmoji}>✓</Text>
                      <Text style={[
                        styles.frequencyButtonText,
                        frequency === 'once' && styles.frequencyButtonTextActive
                      ]}>مرة واحدة</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  activeOpacity={0.8}
                  disabled={!title.trim()}
                >
                  <View
                    style={[
                      styles.submitGradient,
                      title.trim()
                        ? { backgroundColor: '#667eea' }
                        : { backgroundColor: '#999' },
                    ]}
                  >
                    <Text style={styles.submitText}>
                       إضافة المهمة ✓
                    </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerAvatarImage: {
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
    color: '#E0E0E0',
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
    borderColor: '#000',
    backgroundColor: '#FFFFFF',
  },
  inputContainerEmpty: {
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
    backgroundColor: 'transparent',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  difficultyContainer: {
    gap: 12,
  },
  difficultyOption: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  difficultyCard: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyEmoji: {
    fontSize: 32,
    marginLeft: 15,
  },
  difficultyRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'right',
  },
  difficultyLabelSelected: {
    color: '#FFFFFF',
  },
  pointsTextInline: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.5)',
    textAlign: 'left',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  frequencyButtonActive: {
    backgroundColor: '#4CAF50',
  },
  frequencyEmoji: {
    fontSize: 24,
  },
  frequencyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
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
    borderWidth: 3,
    borderColor: '#000000',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
