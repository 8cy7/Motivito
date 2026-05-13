// MockDataTestModalSimple.tsx
// نسخة بسيطة من المودال للاختبار

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
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

export const MockDataTestModalSimple: React.FC<MockDataTestModalProps> = ({
  visible,
  onClose,
  onAddTasks,
  childId,
  childName,
}) => {
  const [generateMode, setGenerateMode] = useState<'single-day' | 'week' | 'month'>('week');
  const [easyCount, setEasyCount] = useState(2);
  const [mediumCount, setMediumCount] = useState(1);
  const [hardCount, setHardCount] = useState(0);
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [configReady, setConfigReady] = useState(false);

  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const handleConfirmConfig = () => {
    // التحقق من الإعدادات
    if (generateMode === 'single-day') {
      const totalTasks = easyCount + mediumCount + hardCount;
      if (totalTasks === 0) {
        Alert.alert('⚠️ تنبيه', 'يجب اختيار عدد مهام واحد على الأقل');
        return;
      }
    }
    // التوليد مباشرة بدون شاشة تأكيد إضافية
    handleGenerate();
  };

  const handleGenerate = () => {
    let tasks: Task[] = [];

    if (generateMode === 'week') {
      tasks = MockDataGenerator.generateWeekOfTasks(childId);
    } else if (generateMode === 'month') {
      tasks = MockDataGenerator.generateMonthOfTasks(childId);
    } else {
      // للمهام اليومية، نضيف التاريخ المخصص
      tasks = MockDataGenerator.generateCustomTasks(
        childId,
        {
          easyCounts: easyCount,
          mediumCounts: mediumCount,
          hardCounts: hardCount,
        },
        dayOfWeek
      );
      // تحديث التاريخ للمهام المولدة
      tasks = tasks.map(task => ({
        ...task,
        createdAt: selectedDate,
        completedAt: selectedDate,
      }));
    }

    onAddTasks(tasks);
    Alert.alert('✨ نجح!', `تم إضافة ${tasks.length} مهمة\nالتاريخ: ${selectedDate.toLocaleDateString('ar-SA')}`);
    setConfigReady(false);
    onClose();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  if (!visible) {
    return null;
  }

  return (
    <AppModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* الخلفية المظلمة */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* المودال */}
        <View style={styles.modal}>
          <View
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* الهيدر */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>🧪 توليد البيانات</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {/* العنوان */}
              <Text style={styles.subtitle}>للطفل: {childName}</Text>

              {/* خيارات النمط */}
              <Text style={styles.sectionTitle}>اختر النمط:</Text>
              <View style={styles.buttonsRow}>
                {(['single-day', 'week', 'month'] as const).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeBtn,
                      generateMode === mode && styles.modeBtnActive,
                    ]}
                    onPress={() => setGenerateMode(mode)}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        generateMode === mode && styles.modeBtnTextActive,
                      ]}
                    >
                      {mode === 'single-day' ? 'يوم' : mode === 'week' ? 'أسبوع' : 'شهر'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* خيارات اليوم (فقط لـ يوم واحد) */}
              {generateMode === 'single-day' && (
                <>
                  <Text style={styles.sectionTitle}>اختر اليوم:</Text>
                  <View style={styles.daysGrid}>
                    {DAYS.map((day, index) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayBtn,
                          dayOfWeek === index && styles.dayBtnActive,
                        ]}
                        onPress={() => setDayOfWeek(index)}
                      >
                        <Text
                          style={[
                            styles.dayBtnText,
                            dayOfWeek === index && styles.dayBtnTextActive,
                          ]}
                        >
                          {day.substring(0, 2)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* عدادات المهام */}
                  <Text style={styles.sectionTitle}>عدد المهام:</Text>

                  <View style={styles.counterRow}>
                    <Text style={styles.counterLabel}>✅ سهل (50)</Text>
                    <View style={styles.counterButtons}>
                      <TouchableOpacity
                        onPress={() => setEasyCount(Math.max(0, easyCount - 1))}
                        style={styles.counterBtn}
                      >
                        <Text style={styles.counterBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{easyCount}</Text>
                      <TouchableOpacity
                        onPress={() => setEasyCount(Math.min(10, easyCount + 1))}
                        style={styles.counterBtn}
                      >
                        <Text style={styles.counterBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.counterRow}>
                    <Text style={styles.counterLabel}>⚡ متوسط (100)</Text>
                    <View style={styles.counterButtons}>
                      <TouchableOpacity
                        onPress={() => setMediumCount(Math.max(0, mediumCount - 1))}
                        style={styles.counterBtn}
                      >
                        <Text style={styles.counterBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{mediumCount}</Text>
                      <TouchableOpacity
                        onPress={() => setMediumCount(Math.min(10, mediumCount + 1))}
                        style={styles.counterBtn}
                      >
                        <Text style={styles.counterBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.counterRow}>
                    <Text style={styles.counterLabel}>🔥 صعب (150)</Text>
                    <View style={styles.counterButtons}>
                      <TouchableOpacity
                        onPress={() => setHardCount(Math.max(0, hardCount - 1))}
                        style={styles.counterBtn}
                      >
                        <Text style={styles.counterBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{hardCount}</Text>
                      <TouchableOpacity
                        onPress={() => setHardCount(Math.min(10, hardCount + 1))}
                        style={styles.counterBtn}
                      >
                        <Text style={styles.counterBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* اختيار التاريخ (فقط لـ يوم واحد) */}
                  <Text style={styles.sectionTitle}>اختر التاريخ:</Text>
                  <View style={styles.datePickerContainer}>
                    <TouchableOpacity
                      onPress={() => handleDateChange(-1)}
                      style={styles.dateNavBtn}
                    >
                      <Text style={styles.dateNavBtnText}>◀</Text>
                    </TouchableOpacity>

                    <View style={styles.dateDisplayBox}>
                      <Text style={styles.dateDisplayText}>
                        {formatDate(selectedDate)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDateChange(1)}
                      style={styles.dateNavBtn}
                    >
                      <Text style={styles.dateNavBtnText}>▶</Text>
                    </TouchableOpacity>
                  </View>

                  {/* زر التأكيد */}
                  <TouchableOpacity
                    style={styles.confirmConfigBtn}
                    onPress={handleConfirmConfig}
                  >
                    <View
                      style={{
                        paddingVertical: 12,
                        alignItems: 'center',
                        backgroundColor: '#FF9500',
                        borderRadius: 12,
                      }}
                    >
                      <Text style={styles.confirmConfigText}>✓ تأكيد الإعدادات</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              {/* معلومات */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {generateMode === 'single-day'
                    ? `📅 ${DAYS[dayOfWeek]} - ${easyCount + mediumCount + hardCount} مهام`
                    : generateMode === 'week'
                    ? '📊 أسبوع كامل (~20 مهمة)'
                    : '📈 شهر كامل (~80 مهمة)'}
                </Text>
              </View>
            </ScrollView>

            {/* زر التوليد */}
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGenerate}
            >
              <View
                style={{
                  paddingVertical: 14,
                  alignItems: 'center',
                  backgroundColor: '#8B5CF6',
                  borderRadius: 12,
                }}
              >
                <Text style={styles.generateBtnText}>✨ توليد</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
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
  modal: {
    width: width * 0.85,
    maxHeight: '75%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    width: '100%',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeBtn: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modeBtnActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  modeBtnText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#666',
    fontSize: 12,
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayBtn: {
    width: '14%',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  dayBtnActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFA500',
  },
  dayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  dayBtnTextActive: {
    color: '#333',
  },
  counterRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 10,
  },
  counterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  counterButtons: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  counterValue: {
    minWidth: 30,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  infoBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  generateBtn: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // أنماط منتقي التاريخ
  datePickerContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  dateNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  dateDisplayBox: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  confirmConfigBtn: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmConfigGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmConfigText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // أنماط الأزرار السفلية
  bottomButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  confirmBtn: {
    flex: 1.2,
    marginHorizontal: 0,
    marginBottom: 0,
  },
});
