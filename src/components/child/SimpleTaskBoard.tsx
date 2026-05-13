import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { AppModal } from '../AppModal';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Task, TaskDifficulty } from '../../types';
import { getResponsiveSize, getResponsiveSpacing, getResponsiveFontSize, isTablet } from '../../utils/deviceUtils';
import { SoundManager } from '../../utils/soundUtils';

const StarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFD700"/>
  </Svg>
);

const getDifficultyColor = (difficulty: TaskDifficulty): string => {
  switch (difficulty) {
    case 'easy': return '#4CAF50';
    case 'medium': return '#2196F3';
    case 'hard': return '#FFD700';
    default: return '#4CAF50';
  }
};

const getDifficultyLabel = (difficulty: TaskDifficulty): string => {
  switch (difficulty) {
    case 'easy': return 'سهل';
    case 'medium': return 'متوسط';
    case 'hard': return 'صعب';
    default: return 'سهل';
  }
};

const getRepeatLabel = (repeatType?: string): string => {
  switch (repeatType) {
    case 'daily': return 'يومية';
    case 'weekly': return 'أسبوعية';
    case 'once': return 'مرة واحدة';
    default: return 'يومية';
  }
};

// Task Detail Modal - تصميم جديد كلياً
const TaskDetailModal: React.FC<{
  visible: boolean;
  task: Task | null;
  onComplete: () => void;
  onClose: () => void;
}> = ({ visible, task, onComplete, onClose }) => {
  if (!task) return null;

  return (
    <AppModal
      visible={visible}
      transparent={true}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={{
            backgroundColor: '#6B46C1',
            width: 350,
            borderRadius: 28,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.6,
            shadowRadius: 30,
            elevation: 25,
          }}>
            {/* العنوان */}
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 20, textAlign: 'center' }}>
              {task.title}
            </Text>

            {/* الوصف */}
            {task.description && (
              <View style={{ 
                backgroundColor: 'rgba(255,255,255,0.15)', 
                borderRadius: 16, 
                padding: 16, 
                width: '100%',
                marginBottom: 20 
              }}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginBottom: 6 }}>الوصف:</Text>
                <Text style={{ fontSize: 17, color: '#FFF', textAlign: 'right', lineHeight: 26 }}>{task.description}</Text>
              </View>
            )}

            {/* النجوم والصعوبة */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: 'rgba(255,215,0,0.25)', 
                paddingHorizontal: 24, 
                paddingVertical: 14, 
                borderRadius: 25,
                gap: 8
              }}>
                <Text style={{ fontSize: 24 }}>⭐</Text>
                <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFD700' }}>{task.points}</Text>
              </View>
              
              <View style={{ 
                backgroundColor: getDifficultyColor(task.difficulty), 
                paddingHorizontal: 24, 
                paddingVertical: 14, 
                borderRadius: 25 
              }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{getDifficultyLabel(task.difficulty)}</Text>
              </View>
            </View>

            {/* زر إتمام المهمة */}
            {!task.isCompleted && (
              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#22C55E', 
                  width: '100%', 
                  paddingVertical: 18, 
                  borderRadius: 18,
                  marginBottom: 12
                }} 
                onPress={onComplete}
              >
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFF', textAlign: 'center' }}>أتممت المهمة ✓</Text>
              </TouchableOpacity>
            )}

            {/* زر الإغلاق */}
            <TouchableOpacity style={{ paddingVertical: 14 }} onPress={onClose}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </AppModal>
  );
};

// مكون الساعة الرملية المتحركة
const HourglassEmoji: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Text style={styles.hourglassEmoji}>⏳</Text>
    </Animated.View>
  );
};

interface SimpleTaskBoardProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onTaskPress?: (task: Task) => void;
  completedTaskId?: string | null;
}

// تصدير الـ Modal للاستخدام في ChildDashboardScreen
export { TaskDetailModal };

export const SimpleTaskBoard: React.FC<SimpleTaskBoardProps> = ({
  tasks,
  onCompleteTask,
  onTaskPress,
  completedTaskId,
}) => {
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  // عند إتمام مهمة من الـ parent، أضفها للـ pending
  useEffect(() => {
    if (completedTaskId) {
      setPendingTaskIds(prev => new Set(prev).add(completedTaskId));
    }
  }, [completedTaskId]);

  // تصنيف المهام حسب الصعوبة
  const easyTasks = tasks.filter(t => t.difficulty === 'easy');
  const mediumTasks = tasks.filter(t => t.difficulty === 'medium');
  const hardTasks = tasks.filter(t => t.difficulty === 'hard');

  const handleTaskPress = (task: Task) => {
    if (onTaskPress) {
      onTaskPress(task);
    }
  };

  const renderTaskRow = (rowTasks: Task[], difficulty: TaskDifficulty) => {
    const difficultyColor = getDifficultyColor(difficulty);
    const isTabletDevice = isTablet();

    // فلترة المهام المعتمدة
    const visibleTasks = rowTasks.filter(t => t.approvalStatus !== 'approved');

    if (visibleTasks.length === 0) return null;

    return (
      <View style={styles.taskRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.taskRowContent}
        >
          {visibleTasks.map((task) => {
            const isPending = pendingTaskIds.has(task.id) || task.approvalStatus === 'completed';

            return (
              <TouchableOpacity
                key={task.id}
                activeOpacity={0.8}
                onPress={() => !isPending && handleTaskPress(task)}
                style={[styles.taskSquare, isTabletDevice && styles.tabletTaskSquare, { borderColor: difficultyColor }]}
              >
                {isPending && (
                  <View style={styles.hourglassOverlay}>
                    <HourglassEmoji />
                  </View>
                )}

                <View style={[styles.taskSquareContent, isPending && { opacity: 0.08 }]}>
                  <Text style={styles.taskSquareTitle} numberOfLines={1}>
                    {task.title}
                  </Text>

                  <View style={styles.taskSquareFooter}>
                    <View style={styles.starsContainer}>
                      <StarIcon />
                      <Text style={styles.starsNumber}>{task.points}</Text>
                    </View>
                    <View style={[styles.difficultyCircle, { backgroundColor: difficultyColor }]}>
                      <Text style={styles.difficultyCircleText}>{getDifficultyLabel(task.difficulty)}</Text>
                    </View>
                    <View style={styles.repeatCircle}>
                      <Text style={styles.repeatText}>{getRepeatLabel(task.repeatType)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const isTabletDevice = isTablet();

  return (
    <View style={[styles.container, isTabletDevice && styles.tabletContainer]}>
      <View style={[styles.board, isTabletDevice && styles.tabletBoard]}>
        {/* Header */}
        <Text style={[styles.boardTitle, isTabletDevice && styles.tabletBoardTitle]}>لوحة المهام</Text>

        {/* مهام سهلة */}
        {easyTasks.length > 0 && (
          <View style={[styles.difficultySection, isTabletDevice && styles.tabletDifficultySection]}>
            {renderTaskRow(easyTasks, 'easy')}
          </View>
        )}

        {/* مهام متوسطة */}
        {mediumTasks.length > 0 && (
          <View style={[styles.difficultySection, isTabletDevice && styles.tabletDifficultySection]}>
            {renderTaskRow(mediumTasks, 'medium')}
          </View>
        )}

        {/* مهام صعبة */}
        {hardTasks.length > 0 && (
          <View style={[styles.difficultySection, isTabletDevice && styles.tabletDifficultySection]}>
            {renderTaskRow(hardTasks, 'hard')}
          </View>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveSpacing(16, 20),
    marginBottom: getResponsiveSpacing(16, 18),
  },
  tabletContainer: {
    flex: 3,
    paddingHorizontal: 0,
    marginRight: 0,
    marginTop: 10,
  },
  board: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(18, 20),
    padding: getResponsiveSpacing(16, 18),
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tabletBoard: {
    maxHeight: 375,
    padding: 12,
    paddingBottom: 16,
  },
  boardTitle: {
    fontSize: getResponsiveFontSize(20, 22),
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(16, 18),
  },
  tabletBoardTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  difficultySection: {
    marginBottom: getResponsiveSpacing(12, 14),
  },
  tabletDifficultySection: {
    marginBottom: 8,
  },
  taskRow: {
    marginBottom: getResponsiveSpacing(4, 5),
    alignItems: 'flex-end',
  },
  taskRowContent: {
    paddingHorizontal: getResponsiveSpacing(4, 6),
    gap: getResponsiveSpacing(12, 14),
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  taskSquare: {
    width: getResponsiveSize(180, 200),
    height: getResponsiveSize(90, 105),
    borderRadius: getResponsiveSize(14, 16),
    borderWidth: 4,
    backgroundColor: '#FFFFFF',
    padding: getResponsiveSpacing(12, 14),
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  tabletTaskSquare: {
    height: 95,
    padding: 10,
  },
  hourglassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  hourglassEmoji: {
    fontSize: getResponsiveFontSize(38, 42),
  },
  taskSquareContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  taskSquareTitle: {
    fontSize: getResponsiveFontSize(15, 16),
    fontWeight: '800',
    color: '#333',
    marginBottom: getResponsiveSpacing(10, 12),
    textAlign: 'right',
  },
  taskSquareFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing(8, 10),
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: getResponsiveSpacing(8, 10),
    paddingVertical: getResponsiveSpacing(4, 5),
    borderRadius: getResponsiveSize(12, 14),
    gap: getResponsiveSpacing(4, 5),
  },
  starsNumber: {
    fontSize: getResponsiveFontSize(14, 15),
    fontWeight: '900',
    color: '#FFD700',
  },
  difficultyCircle: {
    borderRadius: getResponsiveSize(20, 22),
    paddingHorizontal: getResponsiveSpacing(8, 10),
    paddingVertical: getResponsiveSpacing(4, 5),
  },
  difficultyCircleText: {
    fontSize: getResponsiveFontSize(9, 10),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  repeatCircle: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: getResponsiveSize(20, 22),
    paddingHorizontal: getResponsiveSpacing(8, 10),
    paddingVertical: getResponsiveSpacing(4, 5),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  repeatText: {
    fontSize: getResponsiveFontSize(9, 10),
    fontWeight: '700',
    color: '#666',
  },
});
