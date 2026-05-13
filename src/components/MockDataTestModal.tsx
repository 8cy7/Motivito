// MockDataTestModal.tsx
// مكون مودال لتوليد بيانات اختبار

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Switch,
  Dimensions,
} from 'react-native';
import { AppModal } from './AppModal';
import { MockDataGenerator } from '../utils/mockDataGenerator';
import { Task } from '../types';

const { width } = Dimensions.get('window');

interface MockDataTestModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTasks: (tasks: Task[]) => void;
  childId: string;
  childName: string;
}

interface TestConfig {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  dayOfWeek: number;
  generateMode: 'single-day' | 'week' | 'month';
}

const DAYS_OF_WEEK = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const MockDataTestModal: React.FC<MockDataTestModalProps> = ({
  visible,
  onClose,
  onAddTasks,
  childId,
  childName,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const [config, setConfig] = useState<TestConfig>({
    easyCount: 2,
    mediumCount: 1,
    hardCount: 0,
    dayOfWeek: new Date().getDay(),
    generateMode: 'single-day',
  });

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const handleIncrement = (field: keyof TestConfig) => {
    if (field !== 'dayOfWeek' && field !== 'generateMode') {
      setConfig(prev => ({
        ...prev,
        [field]: Math.min((prev[field] as number) + 1, 10),
      }));
    }
  };

  const handleDecrement = (field: keyof TestConfig) => {
    if (field !== 'dayOfWeek' && field !== 'generateMode') {
      setConfig(prev => ({
        ...prev,
        [field]: Math.max((prev[field] as number) - 1, 0),
      }));
    }
  };

  const handleGenerateData = () => {
    let tasks: Task[] = [];

    switch (config.generateMode) {
      case 'single-day':
        tasks = MockDataGenerator.generateCustomTasks(
          childId,
          {
            easyCounts: config.easyCount,
            mediumCounts: config.mediumCount,
            hardCounts: config.hardCount,
          },
          config.dayOfWeek
        );
        break;
      case 'week':
        tasks = MockDataGenerator.generateWeekOfTasks(childId);
        break;
      case 'month':
        tasks = MockDataGenerator.generateMonthOfTasks(childId);
        break;
    }

    onAddTasks(tasks);
    handleClose();
  };

  const handleClose = () => {
    scaleAnim.setValue(0);
    onClose();
  };

  const taskCount =
    config.easyCount + config.mediumCount + config.hardCount;

  return (
    <AppModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          pointerEvents="auto"
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.content}>
            <View
              style={[styles.contentGradient, { backgroundColor: '#FFFFFF' }]}
            >
              {/* زر الإغلاق */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                contentContainerStyle={styles.scrollContent}
              >
              {/* الهيدر */}
              <View style={styles.header}>
                <Text style={styles.title}>🧪 توليد بيانات اختبار</Text>
                <Text style={styles.subtitle}>
                  للطفل: {childName}
                </Text>
              </View>

              {/* قسم طريقة التوليد */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 طريقة التوليد</Text>

                <View style={styles.modeButtonsContainer}>
                  {(['single-day', 'week', 'month'] as const).map(mode => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.modeButton,
                        config.generateMode === mode && styles.modeButtonActive,
                      ]}
                      onPress={() =>
                        setConfig(prev => ({ ...prev, generateMode: mode }))
                      }
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.modeButtonText,
                          config.generateMode === mode &&
                            styles.modeButtonTextActive,
                        ]}
                      >
                        {mode === 'single-day'
                          ? 'يوم واحد'
                          : mode === 'week'
                          ? 'أسبوع'
                          : 'شهر'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* قسم تحديد اليوم (يظهر فقط في وضع اليوم الواحد) */}
              {config.generateMode === 'single-day' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📅 يوم الأسبوع</Text>

                  <View style={styles.daysContainer}>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          config.dayOfWeek === index && styles.dayButtonActive,
                        ]}
                        onPress={() =>
                          setConfig(prev => ({ ...prev, dayOfWeek: index }))
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            config.dayOfWeek === index &&
                              styles.dayButtonTextActive,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* قسم تحديد عدد المهام (يظهر فقط في وضع اليوم الواحد) */}
              {config.generateMode === 'single-day' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🎯 عدد المهام</Text>

                  {/* المهام السهلة */}
                  <View style={styles.counterContainer}>
                    <View style={styles.counterLabel}>
                      <Text style={styles.difficultyEmoji}>✅</Text>
                      <View style={styles.labelContent}>
                        <Text style={styles.labelText}>مهام سهلة</Text>
                        <Text style={styles.labelSubtext}>50 نقطة لكل مهمة</Text>
                      </View>
                    </View>

                    <View style={styles.counterButtons}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => handleDecrement('easyCount')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>

                      <View style={styles.counterValue}>
                        <Text style={styles.counterValueText}>
                          {config.easyCount}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => handleIncrement('easyCount')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* المهام المتوسطة */}
                  <View style={styles.counterContainer}>
                    <View style={styles.counterLabel}>
                      <Text style={styles.difficultyEmoji}>⚡</Text>
                      <View style={styles.labelContent}>
                        <Text style={styles.labelText}>مهام متوسطة</Text>
                        <Text style={styles.labelSubtext}>100 نقطة لكل مهمة</Text>
                      </View>
                    </View>

                    <View style={styles.counterButtons}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => handleDecrement('mediumCount')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>

                      <View style={styles.counterValue}>
                        <Text style={styles.counterValueText}>
                          {config.mediumCount}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => handleIncrement('mediumCount')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* المهام الصعبة */}
                  <View style={styles.counterContainer}>
                    <View style={styles.counterLabel}>
                      <Text style={styles.difficultyEmoji}>🔥</Text>
                      <View style={styles.labelContent}>
                        <Text style={styles.labelText}>مهام صعبة</Text>
                        <Text style={styles.labelSubtext}>150 نقطة لكل مهمة</Text>
                      </View>
                    </View>

                    <View style={styles.counterButtons}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => handleDecrement('hardCount')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>

                      <View style={styles.counterValue}>
                        <Text style={styles.counterValueText}>
                          {config.hardCount}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => handleIncrement('hardCount')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* ملخص البيانات */}
              <View style={styles.summarySection}>
                <View
                  style={[styles.summaryCard, { backgroundColor: 'rgba(114, 65, 198, 0.1)' }]}
                >
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>إجمالي المهام:</Text>
                    <Text style={styles.summaryValue}>
                      {config.generateMode === 'single-day'
                        ? taskCount
                        : config.generateMode === 'week'
                        ? '~20'
                        : '~80'}
                    </Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>الفترة الزمنية:</Text>
                    <Text style={styles.summaryValue}>
                      {config.generateMode === 'single-day'
                        ? DAYS_OF_WEEK[config.dayOfWeek]
                        : config.generateMode === 'week'
                        ? 'أسبوع واحد'
                        : 'شهر واحد'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* معلومات إضافية */}
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={styles.infoText}>
                  جميع المهام سيتم تعليمها كـ "مكتملة" بتواريخ واقعية لاختبار الخوارزمية
                </Text>
              </View>
              </ScrollView>

              {/* زر التوليد */}
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateData}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.generateButtonGradient, { backgroundColor: '#8B5CF6' }]}
                >
                  <Text style={styles.generateButtonText}>✨ توليد البيانات</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '85%',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  contentGradient: {
    flex: 1,
    borderRadius: 25,
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
  scrollContent: {
    padding: 25,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  modeButtonsContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  daysContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFA500',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#333',
  },
  counterContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  counterLabel: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  difficultyEmoji: {
    fontSize: 18,
  },
  labelContent: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  labelSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  counterButtons: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  counterValue: {
    minWidth: 40,
    alignItems: 'center',
  },
  counterValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  summaryItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginVertical: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(114, 65, 198, 0.08)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(114, 65, 198, 0.2)',
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 16,
  },
  generateButton: {
    marginHorizontal: 25,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  generateButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
