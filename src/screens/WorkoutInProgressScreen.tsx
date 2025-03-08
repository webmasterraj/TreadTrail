import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  BackHandler,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaceType } from '../types';
import { COLORS, FONT_SIZES, SPACING, PACE_COLORS } from '../styles/theme';
import { formatTime } from '../utils/helpers';
import { WorkoutContext, DataContext } from '../context';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutInProgress'>;

const WorkoutInProgressScreen: React.FC<Props> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  const [testProgress, setTestProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState({
    progress: 0,
    totalDuration: 0,
    currentTime: 0,
    isAnimating: false
  });

  const { 
    activeWorkout,
    isWorkoutActive,
    currentSegmentIndex,
    elapsedTime,
    segmentTimeRemaining,
    isPaused,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    skipToNextSegment,
    endWorkout,
  } = useContext(WorkoutContext);

  const { getWorkoutById } = useContext(DataContext);

  // Initialize workout when component mounts
  useEffect(() => {
    console.log('[WorkoutScreen] Initializing workout with ID:', workoutId);
    const success = startWorkout(workoutId);
    
    if (!success) {
      console.log('[WorkoutScreen] Failed to start workout');
      Alert.alert(
        'Error',
        'Failed to start workout. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      console.log('[WorkoutScreen] Workout started successfully');
    }

    // Set up back button handler to show pause screen
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isWorkoutActive) {
        setIsPauseModalVisible(true);
        return true; // Prevent default back behavior
      }
      return false;
    });

    return () => {
      backHandler.remove();
    };
  }, []);

  // Log workout state changes for debugging
  useEffect(() => {
    console.log('[WorkoutScreen] Workout state updated:', {
      isActive: isWorkoutActive,
      isPaused,
      currentSegmentIndex,
      elapsedTime,
      segmentTimeRemaining
    });
  }, [isWorkoutActive, isPaused, currentSegmentIndex, elapsedTime, segmentTimeRemaining]);

  useEffect(() => {
    if (currentSegmentIndex > 0 && isWorkoutActive) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentSegmentIndex, isWorkoutActive]);

  const getTotalDuration = () => {
    return activeWorkout?.segments.reduce((total, segment) => total + segment.duration, 0) || 1;
  };

  useEffect(() => {
    if (!activeWorkout) return;
    
    console.log('[WorkoutScreen] Animating progress marker. ElapsedTime:', elapsedTime);
    console.log('[WorkoutScreen] Total workout duration:', getTotalDuration());
    
    // Calculate progress as a percentage (0-1)
    const progress = elapsedTime / getTotalDuration();
    console.log('[WorkoutScreen] Progress calculated:', progress);
    
    // Update debug info
    setDebugInfo({
      ...debugInfo,
      progress,
      totalDuration: getTotalDuration(),
      currentTime: elapsedTime,
      isAnimating: true
    });
    
    // Animate the progress marker
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start(() => {
      console.log('[WorkoutScreen] Progress animation completed to:', progress);
      setDebugInfo(prev => ({
        ...prev,
        isAnimating: false
      }));
    });
    
  }, [elapsedTime, activeWorkout]);

  const animateProgress = useCallback((toValue: number) => {
    const currentProgress = elapsedTime / (activeWorkout?.segments.reduce((total, segment) => total + segment.duration, 0) || 1);
    progressAnimation.setValue(currentProgress);
    overlayAnimation.setValue(currentProgress);
    
    Animated.parallel([
      Animated.timing(progressAnimation, {
        toValue,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(overlayAnimation, {
        toValue,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ]).start();
  }, [progressAnimation, overlayAnimation, elapsedTime, activeWorkout]);

  const updateAnimations = useCallback(() => {
    if (activeWorkout && isWorkoutActive) {
      const totalDuration = activeWorkout.segments.reduce((total, segment) => total + segment.duration, 0);
      
      const progress = Math.min(elapsedTime / totalDuration, 1);
      
      setDebugInfo({
        progress,
        totalDuration,
        currentTime: elapsedTime,
        isAnimating: !isPaused
      });
      
      animateProgress(progress);
    }
  }, [elapsedTime, activeWorkout, isWorkoutActive, isPaused, animateProgress]);

  useEffect(() => {
    if (activeWorkout && isWorkoutActive) {
      updateAnimations();
    }
  }, [updateAnimations, activeWorkout, isWorkoutActive]);

  const handlePause = () => {
    pauseWorkout();
    setIsPauseModalVisible(true);
  };

  const handleResume = () => {
    resumeWorkout();
    setIsPauseModalVisible(false);
  };

  const handleEndWorkout = async () => {
    const sessionId = await endWorkout(true);
    
    if (sessionId) {
      navigation.replace('WorkoutComplete', { sessionId });
    } else {
      navigation.goBack();
    }
  };

  const runTestAnimation = () => {
    console.log('[WorkoutScreen] Running test animation');
    const newProgress = testProgress + 0.1 > 1 ? 0 : testProgress + 0.1;
    setTestProgress(newProgress);
    
    Animated.timing(progressAnimation, {
      toValue: newProgress,
      duration: 500,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start(() => {
      console.log('[WorkoutScreen] Test animation completed');
    });
  };

  if (!isWorkoutActive || !activeWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </SafeAreaView>
    );
  }

  const currentSegment = activeWorkout.segments[currentSegmentIndex];
  
  const nextSegment = currentSegmentIndex < activeWorkout.segments.length - 1 
    ? activeWorkout.segments[currentSegmentIndex + 1] 
    : null;
  
  const totalDuration = activeWorkout.segments.reduce((sum, segment) => sum + segment.duration, 0);
  
  const progressPercentage = Math.min((elapsedTime / totalDuration) * 100, 100);
  
  const renderTimelineBars = () => {
    return activeWorkout.segments.map((segment, index) => {
      const segmentWidth = (segment.duration / totalDuration) * 100;
      const barHeight = getPaceHeight(segment.type as PaceType);
      
      return (
        <View 
          key={index}
          style={[
            styles.timelineBar, 
            { 
              height: barHeight, 
              backgroundColor: PACE_COLORS[segment.type as PaceType],
              width: `${segmentWidth}%`
            }
          ]} 
        />
      );
    });
  };
  
  const getPaceHeight = (paceType: PaceType): number => {
    switch(paceType) {
      case 'recovery': return 8;
      case 'base': return 12;
      case 'run': return 20;
      case 'sprint': return 24;
      default: return 12;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Current Segment Panel */}
          <View style={[
            styles.currentSegment,
            { 
              backgroundColor: currentSegment.type === 'recovery' ? COLORS.recoveryMuted :
                            currentSegment.type === 'base' ? COLORS.baseMuted :
                            currentSegment.type === 'run' ? COLORS.runMuted : 
                            COLORS.sprintMuted, 
              borderColor: PACE_COLORS[currentSegment.type as PaceType] 
            },
            isTransitioning && styles.transitioningSegment
          ]}>
            <Text style={styles.segmentTime}>{formatTime(segmentTimeRemaining)}</Text>
            <View style={[styles.paceBadge, { backgroundColor: PACE_COLORS[currentSegment.type as PaceType] }]}>
              <Text style={styles.paceBadgeText}>{currentSegment.type.charAt(0).toUpperCase() + currentSegment.type.slice(1)} Pace</Text>
            </View>
            <Text style={styles.inclineInfo}>Incline: {currentSegment.incline}%</Text>
          </View>
          
          {/* Next Segment Info */}
          {nextSegment && (
            <View style={styles.nextSegment}>
              <Text style={styles.nextLabel}>Next:</Text>
              <View style={styles.nextInfo}>
                <Text style={[styles.nextTime, { color: PACE_COLORS[nextSegment.type as PaceType] }]}>
                  {formatTime(nextSegment.duration)}
                </Text>
                <Text style={styles.nextPace}>
                  {nextSegment.type.charAt(0).toUpperCase() + nextSegment.type.slice(1)} Pace
                </Text>
              </View>
            </View>
          )}
          
          {/* Timeline */}
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineTitle}>Workout Progress</Text>
            
            <View style={styles.timelineLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: PACE_COLORS.recovery }]} />
                <Text style={styles.legendText}>Recovery</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: PACE_COLORS.base }]} />
                <Text style={styles.legendText}>Base</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: PACE_COLORS.run }]} />
                <Text style={styles.legendText}>Run</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: PACE_COLORS.sprint }]} />
                <Text style={styles.legendText}>Sprint</Text>
              </View>
            </View>
            
            <View style={styles.barTimeline}>
              {/* Overlay to darken completed segments */}
              <Animated.View 
                style={[
                  styles.completedOverlay, 
                  { 
                    width: overlayAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }) 
                  }
                ]} 
              />
              
              {/* Progress marker */}
              <Animated.View 
                style={[
                  styles.progressMarker, 
                  { 
                    left: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }) 
                  }
                ]} 
              />
              
              <View style={styles.timelineBarContainer}>
                {renderTimelineBars()}
              </View>
            </View>
            
            <View style={styles.timelineTimes}>
              <Text style={styles.timeText}>0:00</Text>
              <Text style={styles.timeText}>{formatTime(Math.floor(totalDuration / 4))}</Text>
              <Text style={styles.timeText}>{formatTime(Math.floor(totalDuration / 2))}</Text>
              <Text style={styles.timeText}>{formatTime(Math.floor(totalDuration * 3 / 4))}</Text>
              <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
            </View>
          </View>
          
          {/* Control Buttons */}
          <View style={styles.controlButtonsContainer}>
            <View style={styles.controlButtonsRow}>
              <TouchableOpacity 
                style={styles.pauseButton} 
                onPress={handlePause}
              >
                <Text style={styles.pauseButtonText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={skipToNextSegment}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.endButton} 
              onPress={handleEndWorkout}
            >
              <Text style={styles.endButtonText}>End Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      
      <Modal
        visible={isPauseModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Workout Paused</Text>
            <Text style={styles.modalTime}>{formatTime(elapsedTime)}</Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={styles.resumeButton} 
                onPress={handleResume}
              >
                <Text style={styles.resumeButtonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalEndButton} 
                onPress={handleEndWorkout}
              >
                <Text style={styles.modalEndButtonText}>End Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20, // Exact value from mockup
    display: 'flex',
    flexDirection: 'column',
  },
  currentSegment: {
    borderRadius: 15, // Exact value from mockup
    padding: 20, // Exact value from mockup
    marginBottom: 20, // Exact value from mockup
    alignItems: 'center',
    borderWidth: 1,
    textAlign: 'center',
  },
  segmentTime: {
    fontSize: 64, // Exact value from mockup
    fontWeight: 'bold',
    color: COLORS.white,
    margin: 10, // Exact value from mockup
  },
  paceBadge: {
    paddingHorizontal: 20, // Exact value from mockup
    paddingVertical: 8, // Exact value from mockup
    borderRadius: 20, // Exact value from mockup
    marginVertical: 10, // Exact value from mockup
  },
  paceBadgeText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 18, // Exact value from mockup
  },
  inclineInfo: {
    fontSize: 16, // Exact value from mockup
    color: 'rgba(255, 255, 255, 0.6)', // Exact value from mockup
    marginTop: 5, // Exact value from mockup
  },
  nextSegment: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12, // Exact value from mockup
    padding: 15, // Exact value from mockup
    marginBottom: 20, // Exact value from mockup
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextLabel: {
    fontSize: 14, // Exact value from mockup
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)', // Exact value from mockup
  },
  nextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextTime: {
    fontWeight: 'bold',
    marginRight: 10, // Exact value from mockup
    fontSize: 16, // Based on mockup
  },
  nextPace: {
    fontWeight: 'bold',
    color: COLORS.white,
    fontSize: 16, // Based on mockup
  },
  timelineContainer: {
    marginBottom: 20, // Exact value from mockup
    marginTop: 'auto', // Push to the bottom of available space
  },
  timelineTitle: {
    fontSize: 16, // Exact value from mockup
    fontWeight: 'bold',
    marginBottom: 10, // Exact value from mockup
    color: COLORS.white,
    opacity: 0.9, // Exact value from mockup
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, // Exact value from mockup
    fontSize: 12, // Exact value from mockup
    color: 'rgba(255, 255, 255, 0.7)', // Exact value from mockup
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 10, // Exact value from mockup
    height: 10, // Exact value from mockup
    borderRadius: 2, // Exact value from mockup
    marginRight: 4, // Exact value from mockup
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.7)', // Exact value from mockup
    fontSize: 12, // Exact value from mockup
  },
  barTimeline: {
    position: 'relative',
    height: 40, // Exact value from mockup
    width: '100%',
    backgroundColor: COLORS.darkGray, // Exact value from mockup
    borderRadius: 12, // Exact value from mockup
    overflow: 'hidden',
    padding: 0,
    boxSizing: 'border-box',
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Exact value from mockup
    zIndex: 1,
    borderRadius: 12, // Match container radius
  },
  progressMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2, // Exact value from mockup
    backgroundColor: COLORS.white,
    zIndex: 3, // Above the overlay and bars
  },
  timelineBarContainer: {
    flexDirection: 'row',
    height: 32, // Exact value from mockup
    width: '100%',
    alignItems: 'flex-end',
    padding: 4, // Exact value from mockup (padding top/bottom)
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 0,
  },
  timelineBar: {
    width: 4, // Exact value from mockup
    borderRadius: 2, // Exact value from mockup
    margin: 0,
  },
  timelineTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5, // Exact value from mockup
    fontSize: 11, // Exact value from mockup
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.5)', // Exact value from mockup
    fontSize: 11, // Exact value from mockup
  },
  controlButtonsContainer: {
    marginTop: 'auto', // Auto margin to push to bottom
  },
  controlButtonsRow: {
    flexDirection: 'row',
    gap: 10, // Exact value from mockup
    marginBottom: 10, // Exact value from mockup
  },
  pauseButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25, // Exact value from mockup
    padding: 15, // Exact value from mockup
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2, // Takes 2/3 of the row as in mockup
  },
  pauseButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 16, // Exact value from mockup
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Exact value from mockup
    borderRadius: 25, // Exact value from mockup
    padding: 15, // Exact value from mockup
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Exact value from mockup
    flex: 1, // Takes 1/3 of the row as in mockup
  },
  skipButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16, // Exact value from mockup
  },
  endButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)', // Exact value from mockup
    borderRadius: 25, // Exact value from mockup
    padding: 15, // Exact value from mockup
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)', // Exact value from mockup
    marginTop: 10, // Exact value from mockup
  },
  endButtonText: {
    color: '#ff6b6b', // Exact value from mockup
    fontWeight: 'bold',
    fontSize: 16, // Exact value from mockup
  },
  loadingText: {
    fontSize: FONT_SIZES.large,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: SPACING.large,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.medium,
  },
  modalTime: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: SPACING.large,
  },
  modalButtonsContainer: {
    width: '100%',
  },
  resumeButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  resumeButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalEndButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  modalEndButtonText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  transitioningSegment: {
    transform: [{ scale: 1.02 }],
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default WorkoutInProgressScreen;