import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { AppModal } from '../AppModal';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Task, TaskDifficulty } from '../../types';

const { width } = Dimensions.get('window');

// Push Pin Component
const PushPin = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Circle cx="12" cy="6" r="4" fill={color} />
    <Path d="M 10 6 L 10 12 L 14 12 L 14 6 Z" fill={color} opacity="0.8" />
    <Circle cx="12" cy="6" r="2" fill="#FFFFFF" opacity="0.5" />
  </Svg>
);

// Hourglass Icon for Pending Tasks
const HourglassIcon = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Svg width={40} height={40} viewBox="0 0 40 40">
        <Path
          d="M 12 5 L 28 5 L 28 8 L 25 12 L 22 20 L 25 28 L 28 32 L 28 35 L 12 35 L 12 32 L 15 28 L 18 20 L 15 12 L 12 8 Z"
          fill="#FFA500"
          stroke="#FF6B00"
          strokeWidth="2"
        />
        <Path d="M 15 12 L 25 12 L 20 18 Z" fill="#FFD700" />
      </Svg>
    </Animated.View>
  );
};

// Checkmark Icon for Completed Tasks
const CheckmarkIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Circle cx="20" cy="20" r="18" fill="#4CAF50" />
    <Path
      d="M 12 20 L 18 26 L 28 14"
      stroke="#FFFFFF"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const getDifficultyColor = (difficulty: TaskDifficulty): string => {
  switch (difficulty) {
    case 'easy':
      return '#4CAF50'; // Green
    case 'medium':
      return '#2196F3'; // Blue
    case 'hard':
      return '#FFD700'; // Gold
    default:
      return '#4CAF50';
  }
};

const getDifficultyLabel = (difficulty: TaskDifficulty): string => {
  switch (difficulty) {
    case 'easy':
      return 'سهل';
    case 'medium':
      return 'متوسط';
    case 'hard':
      return 'صعب';
    default:
      return 'سهل';
  }
};

interface TaskBoardBoyProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
}

export const TaskBoardBoy: React.FC<TaskBoardBoyProps> = ({ tasks, onCompleteTask }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [modalVisible]);

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleCompleteTask = () => {
    if (selectedTask) {
      onCompleteTask(selectedTask.id);
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Wooden Board Background */}
      <View style={styles.board}>
        <View
          style={[styles.boardGradient, { backgroundColor: '#8B4513' }]}>

          {/* Wood Texture Lines */}
          <View style={styles.woodTexture}>
            <Svg width="100%" height="100%" viewBox="0 0 400 600">
              <Path
                d="M 0 50 Q 100 45 200 50 T 400 50"
                stroke="rgba(139, 69, 19, 0.3)"
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M 0 150 Q 100 145 200 150 T 400 150"
                stroke="rgba(139, 69, 19, 0.3)"
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M 0 250 Q 100 255 200 250 T 400 250"
                stroke="rgba(139, 69, 19, 0.3)"
                strokeWidth="2"
                fill="none"
              />
            </Svg>
          </View>

          {/* Board Frame */}
          <View style={styles.frame}>
            {/* Board Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>مهامي اليومية</Text>
              <View style={styles.headerDecor}>
                <Svg width={60} height={4} viewBox="0 0 60 4">
                  <Line x1="0" y1="2" x2="60" y2="2" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                </Svg>
              </View>
            </View>

            {/* Tasks Grid */}
            <ScrollView
              style={styles.tasksScrollView}
              contentContainerStyle={styles.tasksContainer}
              showsVerticalScrollIndicator={false}>
              {tasks.map((task, index) => {
                const difficultyColor = getDifficultyColor(task.difficulty);
                const isPending = task.isCompleted && !task.isCompleted; // Waiting for approval

                return (
                  <TouchableOpacity
                    key={task.id}
                    activeOpacity={0.8}
                    onPress={() => handleTaskPress(task)}
                    style={styles.taskCardWrapper}>

                    {/* Push Pin */}
                    <View style={styles.pushPin}>
                      <PushPin color={difficultyColor} />
                    </View>

                    {/* Task Card */}
                    <View
                      style={[
                        styles.taskCard,
                        { borderColor: difficultyColor },
                      ]}>
                      {/* Task Content */}
                      <View style={styles.taskContent}>
                        <Text
                          style={styles.taskTitle}
                          numberOfLines={2}
                          ellipsizeMode="tail">
                          {task.title}
                        </Text>
                        <View style={styles.taskFooter}>
                          <View style={styles.difficultyBadge}>
                            <View
                              style={[
                                styles.difficultyDot,
                                { backgroundColor: difficultyColor },
                              ]}
                            />
                            <Text style={styles.difficultyText}>
                              {getDifficultyLabel(task.difficulty)}
                            </Text>
                          </View>
                          <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>⭐ {task.points}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Status Icon Overlay */}
                      {isPending && (
                        <View style={styles.statusOverlay}>
                          <HourglassIcon />
                          <Text style={styles.statusText}>انتظار الموافقة</Text>
                        </View>
                      )}
                      {task.isCompleted && (
                        <View style={styles.completedOverlay}>
                          <CheckmarkIcon />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {completedTasks} / {totalTasks} مهمة منجزة
              </Text>
              <View style={styles.progressBarBackground}>
                <View
                  style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: '#4facfe' }]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Task Detail Modal */}
      <AppModal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={modalStyles.overlay}>
          <Animated.View
            style={[
              modalStyles.container,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}>
            <View
              style={[modalStyles.gradient, { backgroundColor: 'transparent' }]}>

              {selectedTask && (
                <>
                  {/* Header */}
                  <View style={modalStyles.header}>
                    <Text style={modalStyles.title}>{selectedTask.title}</Text>
                  </View>

                  {/* Content */}
                  <View style={modalStyles.content}>
                    {selectedTask.description && (
                      <View style={modalStyles.section}>
                        <Text style={modalStyles.label}>الوصف:</Text>
                        <Text style={modalStyles.value}>{selectedTask.description}</Text>
                      </View>
                    )}

                    <View style={modalStyles.row}>
                      <View style={modalStyles.section}>
                        <Text style={modalStyles.label}>الصعوبة:</Text>
                        <View style={modalStyles.difficultyBadge}>
                          <View
                            style={[
                              modalStyles.difficultyDot,
                              { backgroundColor: getDifficultyColor(selectedTask.difficulty) },
                            ]}
                          />
                          <Text style={modalStyles.difficultyText}>
                            {getDifficultyLabel(selectedTask.difficulty)}
                          </Text>
                        </View>
                      </View>

                      <View style={modalStyles.section}>
                        <Text style={modalStyles.label}>النقاط:</Text>
                        <Text style={modalStyles.pointsValue}>⭐ {selectedTask.points}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={modalStyles.actions}>
                    {!selectedTask.isCompleted && (
                      <TouchableOpacity
                        style={[modalStyles.completeButton, { backgroundColor: '#4CAF50', borderRadius: 16, paddingVertical: 14 }]}
                        activeOpacity={0.8}
                        onPress={handleCompleteTask}>
                        <Text style={[modalStyles.completeButtonText, { textAlign: 'center' }]}>
                           أتممت المهمة ✓
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={modalStyles.closeButton}
                      onPress={() => setModalVisible(false)}>
                      <Text style={modalStyles.closeButtonText}>إغلاق</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  board: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  boardGradient: {
    padding: 6,
    position: 'relative',
  },
  woodTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  frame: {
    backgroundColor: '#DEB887',
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
    borderColor: '#8B4513',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#654321',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerDecor: {
    marginTop: 4,
  },
  tasksScrollView: {
    maxHeight: 400,
  },
  tasksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  taskCardWrapper: {
    width: '48%',
    marginBottom: 16,
    position: 'relative',
  },
  pushPin: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -12,
    zIndex: 10,
  },
  taskCard: {
    backgroundColor: '#FFFACD',
    borderRadius: 12,
    padding: 12,
    borderWidth: 3,
    borderStyle: 'solid',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF6B00',
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 250, 205, 0.95)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B00',
    marginTop: 8,
  },
  completedOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  progressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 3,
    borderTopColor: '#8B4513',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#654321',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: 'rgba(101, 67, 33, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    backgroundColor: 'transparent',
  },
  gradient: {
    padding: 24,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actions: {
    gap: 12,
  },
  completeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
