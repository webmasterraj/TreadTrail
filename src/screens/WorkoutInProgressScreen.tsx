import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  selectActiveWorkout, 
  selectIsRunning, 
  selectElapsedTime, 
  selectCurrentSegmentIndex,
  selectSegmentElapsedTime,
  selectCurrentSegment,
  selectSegmentRemaining,
  selectTotalDuration,
  selectIsSkipping,
  formatTime,
  formatCountdownTime,
  startWorkout as startWorkoutAction,
  pauseWorkout as pauseWorkoutAction,
  resumeWorkout as resumeWorkoutAction,
  skipSegment as skipSegmentAction,
  endWorkout as endWorkoutAction,
  resetSkipState
} from '../redux/slices/workoutSlice';
import useWorkoutTimer from '../hooks/useWorkoutTimer';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutInProgress'>;

const WorkoutInProgressScreen: React.FC<Props> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  
  // Track workout position based on Redux's elapsed time
  const [workoutPosition, setWorkoutPosition] = useState(0);
  
  // Refs to handle skipping segments properly
  const skipActionRef = useRef(false);
  const prevSegmentIndexRef = useRef(0);
  
  // Redux state
  const dispatch = useAppDispatch();
  const activeWorkout = useAppSelector(selectActiveWorkout);
  const isWorkoutActive = activeWorkout !== null;
  const isRunning = useAppSelector(selectIsRunning);
  const isPaused = isWorkoutActive && !isRunning;
  const elapsedTime = useAppSelector(selectElapsedTime);
  const currentSegmentIndex = useAppSelector(selectCurrentSegmentIndex);
  const segmentElapsedTime = useAppSelector(selectSegmentElapsedTime);
  const currentSegment = useAppSelector(selectCurrentSegment);
  const segmentTimeRemaining = useAppSelector(selectSegmentRemaining);
  const workoutTotalTime = useAppSelector(selectTotalDuration);
  const isSkipping = useAppSelector(selectIsSkipping);
  
  // Initialize the Redux timer
  useWorkoutTimer();

  // Track if workout has been initialized
  const hasInitializedRef = useRef(false);

  // Initialize workout when component mounts (but only once!)
  useEffect(() => {
    // Critical fix: Only initialize once to prevent constant restarting
    if (hasInitializedRef.current) {
      console.log('[WorkoutScreen] Already initialized, skipping');
      return;
    }
    
    console.log('[WorkoutScreen] Initializing workout with ID:', workoutId);
    hasInitializedRef.current = true;
    
    // Dispatch the async thunk to start the workout
    dispatch(startWorkoutAction(workoutId))
      .unwrap()
      .then(() => {
        console.log('[WorkoutScreen] Workout started successfully');
      })
      .catch((error) => {
        console.log('[WorkoutScreen] Failed to start workout:', error);
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
      });

    // Set up back button handler to show pause screen
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isWorkoutActive) {
        setIsPauseModalVisible(true);
        return true; // Prevent default back behavior
      }
      return false;
    });
    
    // Setup an emergency check that periodically verifies the position and progress markers
    // are consistent, especially after skipping segments
    const emergencyCheckTimer = setInterval(() => {
      if (skipActionRef.current || !activeWorkout) return;
      
      // Verify that our progress marker matches our workoutPosition
      const expectedProgress = Math.min(workoutPosition / workoutTotalTime, 1);
      
      // Get current animated value
      const currentProgressValue = progressValueRef.current;
      
      // If there's a significant discrepancy (more than 5%), fix it
      if (Math.abs(expectedProgress - currentProgressValue) > 0.05) {
        console.log(`[WorkoutScreen] Emergency fix! Progress marker (${currentProgressValue.toFixed(2)}) doesn't match position (${expectedProgress.toFixed(2)})`);
        
        // Force set the values directly
        progressAnimation.setValue(expectedProgress);
        overlayAnimation.setValue(expectedProgress);
      }
    }, 1000); // Checking more frequently (every second)

    return () => {
      backHandler.remove();
      clearInterval(emergencyCheckTimer);
    };
  }, [dispatch, workoutId, navigation, workoutPosition, progressAnimation, overlayAnimation, workoutTotalTime]);

  // Show transition effect when segment changes
  useEffect(() => {
    if (currentSegmentIndex > 0 && isWorkoutActive) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentSegmentIndex, isWorkoutActive]);

  // Detect segment changes
  useEffect(() => {
    if (currentSegmentIndex !== prevSegmentIndexRef.current) {
      console.log(`[WorkoutScreen] Segment changed: ${prevSegmentIndexRef.current} -> ${currentSegmentIndex}`);
      prevSegmentIndexRef.current = currentSegmentIndex;
      
      // Force immediate position calculation on segment change
      if (activeWorkout) {
        updateWorkoutPosition();
      }
    }
  }, [currentSegmentIndex]);
  
  // Monitor changes to segmentTimeRemaining with precise timing logs
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[WorkoutScreen] TIMER UPDATE @ ${timestamp} - segmentTimeRemaining: ${segmentTimeRemaining}`);
    
    // Update relevant state on timer change - helps with syncing after skips
    if (activeWorkout && segmentTimeRemaining > 0) {
      // When context updates segment time, ensure our UI is in sync
      const currentSegment = activeWorkout.segments[currentSegmentIndex];
      
      // If we're close to the segment's total duration, we probably just switched segments
      // For example, if a 90-second segment shows 90 or 89 seconds remaining
      if (segmentTimeRemaining >= currentSegment.duration - 2) {
        console.log('[WorkoutScreen] Detected fresh segment - ensuring all timers in sync');
      }
    }
  }, [segmentTimeRemaining, activeWorkout, currentSegmentIndex]);
  
  // Add detailed logging for segmentTimeRemaining and related values
  useEffect(() => {
    if (!activeWorkout) return;
    
    // Get the total duration of all previous segments
    let previousSegmentsDuration = 0;
    for (let i = 0; i < currentSegmentIndex; i++) {
      previousSegmentsDuration += activeWorkout.segments[i].duration;
    }
    
    // Calculate how far we are into the current segment
    // Ensure we never have negative segment elapsed time, which can happen during transitions
    const segmentElapsedTime = Math.max(0, workoutPosition - previousSegmentsDuration);
    
    // Calculate what the remaining time should be
    const currentSegmentDuration = activeWorkout.segments[currentSegmentIndex].duration;
    const calculatedRemaining = Math.max(0, currentSegmentDuration - segmentElapsedTime);
    
    console.log(`[WorkoutScreen] DETAILED DEBUG - Calculated remaining time: ${calculatedRemaining}`);
    console.log(`[WorkoutScreen] DETAILED DEBUG - Context segmentTimeRemaining: ${segmentTimeRemaining}`);
    console.log(`[WorkoutScreen] DETAILED DEBUG - Segment elapsed time: ${segmentElapsedTime}`);
    console.log(`[WorkoutScreen] DETAILED DEBUG - Current segment duration: ${currentSegmentDuration}`);
    
  }, [workoutPosition, segmentTimeRemaining, activeWorkout, currentSegmentIndex]);

  // Track the last position we calculated to ensure we never go backward
  const lastPositionRef = useRef(0);
  
  // Create refs to track animation values
  const progressValueRef = useRef(0);
  const overlayValueRef = useRef(0);

  // Set up animation value tracking
  useEffect(() => {
    // Set up listeners to track current animation values
    const progressListener = progressAnimation.addListener(({ value }) => {
      progressValueRef.current = value;
    });
    
    const overlayListener = overlayAnimation.addListener(({ value }) => {
      overlayValueRef.current = value;
    });
    
    return () => {
      // Clean up listeners
      progressAnimation.removeListener(progressListener);
      overlayAnimation.removeListener(overlayListener);
    };
  }, [progressAnimation, overlayAnimation]);

  // This useEffect previously had local timer logic 
  // Now we're using the Redux timer, so we don't need to manage it here
  useEffect(() => {
    // Just add an effect for segment changes if needed
    if (currentSegmentIndex > 0) {
      console.log(`[WorkoutScreen] Segment changed to index: ${currentSegmentIndex}`);
    }
  }, [currentSegmentIndex]);
  
  // Calculate the position in the workout including skipped segments
  const calculateWorkoutPosition = useCallback(() => {
    // If we're not in an active workout, use elapsedTime directly
    if (!activeWorkout || !isWorkoutActive) return elapsedTime;
    
    // If we're currently skipping, don't recalculate (avoids conflicting with the skip logic)
    if (skipActionRef.current || isSkipping) {
      console.log('[WorkoutScreen] Skip in progress, using last position:', lastPositionRef.current);
      return lastPositionRef.current;
    }
    
    // In the Redux implementation, we can just use the elapsedTime directly
    // since it's properly managed by the reducer logic
    const newPosition = elapsedTime;
    
    // Still keep the lastPositionRef to ensure we never go backward
    const finalPosition = Math.max(lastPositionRef.current, newPosition);
    
    // Only log when position changes to reduce noise
    if (finalPosition !== lastPositionRef.current) {
      console.log(`[WorkoutScreen] Position update: ${lastPositionRef.current} -> ${finalPosition}`);
    }
    
    // Update our reference
    lastPositionRef.current = finalPosition;
    
    return finalPosition;
  }, [
    activeWorkout, 
    isWorkoutActive, 
    elapsedTime,
    isSkipping
  ]);
  
  // Update workout position with timestamp for sync analysis
  const updateWorkoutPosition = useCallback(() => {
    const newPosition = calculateWorkoutPosition();
    const timestamp = new Date().toISOString();
    console.log(`[WorkoutScreen] POSITION UPDATE @ ${timestamp}: ${workoutPosition} -> ${newPosition}`);
    setWorkoutPosition(newPosition);
  }, [calculateWorkoutPosition, workoutPosition]);

  // Update workout position whenever relevant state changes
  useEffect(() => {
    // Don't update from workoutContext if we're in the middle of skipping
    if (skipActionRef.current) {
      console.log('[WorkoutScreen] Blocking position update from context due to skip in progress');
      return;
    }
    
    updateWorkoutPosition();
    
    // Log segment change details
    if (activeWorkout) {
      const currentSegmentDuration = activeWorkout.segments[currentSegmentIndex].duration;
      console.log(`[WorkoutScreen] Segment duration: ${currentSegmentDuration}, segmentTimeRemaining: ${segmentTimeRemaining}`);
    }
  }, [updateWorkoutPosition, currentSegmentIndex, segmentTimeRemaining]);

  // We're now using the Redux isSkipping state instead of local state

  // Track last skip time to throttle skip requests
  const lastSkipTimeRef = useRef(0);
  
  // Skip segment handler using Redux
  const handleSkipSegment = useCallback(() => {
    // Prevent multiple skips - add a 750ms throttle to prevent double-taps and UI jumpiness
    const now = Date.now();
    if (isSkipping || skipActionRef.current || (now - lastSkipTimeRef.current < 750)) {
      console.log('[WorkoutScreen] Skip already in progress or throttled, ignoring request');
      return;
    }
    
    // Update last skip time and store it for subsequent use
    const skipTime = Date.now();
    lastSkipTimeRef.current = skipTime;
    
    // Set skipping state locally to prevent UI issues
    skipActionRef.current = true;
    
    console.log('[WorkoutScreen] Skip button pressed');
    
    // If no workout is active, do nothing
    if (!activeWorkout || !isWorkoutActive) {
      console.log('[WorkoutScreen] Cannot skip - no active workout');
      skipActionRef.current = false;
      return;
    }
    
    // Save the current segment index in a local variable for reliability
    const currentIndex = currentSegmentIndex;
    const nextIndex = currentIndex + 1;
    
    // If this is the last segment, do nothing
    if (nextIndex >= activeWorkout.segments.length) {
      console.log('[WorkoutScreen] Cannot skip - already on last segment');
      skipActionRef.current = false;
      return;
    }
    
    // Get the current and next segments
    const curSegment = currentSegment;
    if (!curSegment) {
      console.log('[WorkoutScreen] Cannot skip - current segment is undefined');
      skipActionRef.current = false;
      return;
    }
    
    const nextSegment = activeWorkout.segments[nextIndex];
    
    // Calculate what the position will be after skipping
    let newPosition = 0;
    
    // Add all previous segments
    for (let i = 0; i < currentIndex; i++) {
      newPosition += activeWorkout.segments[i].duration;
    }
    
    // Add current segment (fully counted when skipped)
    newPosition += curSegment.duration;
    
    // Ensure new position is reasonable
    if (newPosition > workoutTotalTime) {
      console.log(`[WorkoutScreen] WARNING: Calculated position ${newPosition} exceeds total duration ${workoutTotalTime}`);
      newPosition = Math.min(newPosition, workoutTotalTime);
    }
    
    console.log(`[WorkoutScreen] Skipping segment ${currentIndex}. Setting position to ${newPosition}`);
    
    // Update our references to ensure we don't go backward
    lastPositionRef.current = newPosition;
    
    // Force setting the new position with immediate effects
    setWorkoutPosition(newPosition);
    
    // Calculate and set progress value
    const progress = Math.min(newPosition / workoutTotalTime, 1);
    console.log(`[WorkoutScreen] Setting progress to ${progress.toFixed(2)} (${newPosition}/${workoutTotalTime})`);
    
    // CRITICAL FIX: Set animated values directly without animation to ensure immediate update
    progressAnimation.setValue(progress);
    overlayAnimation.setValue(progress);
    
    // DISPATCH REDUX ACTION TO SKIP SEGMENT
    const skipStartTime = new Date().toISOString();
    console.log(`[WorkoutScreen] SKIP START @ ${skipStartTime} - dispatching skipSegment action`);
    
    dispatch(skipSegmentAction())
      .unwrap()
      .then(() => {
        console.log('[WorkoutScreen] Skip segment action succeeded');
        // Force a final position update to ensure everything is in sync
        updateWorkoutPosition();
      })
      .catch((error) => {
        console.log('[WorkoutScreen] Skip segment action failed:', error);
      })
      .finally(() => {
        // Clear the skip flag after a short delay to allow state to settle
        setTimeout(() => {
          skipActionRef.current = false;
          dispatch(resetSkipState());
          
          console.log(`[WorkoutScreen] Skip operation complete, cleared skip flag`);
        }, 700); // Increased delay to ensure state settles
      });
    
  }, [
    activeWorkout, 
    currentSegmentIndex, 
    currentSegment,
    workoutTotalTime,
    isWorkoutActive,
    updateWorkoutPosition,
    isSkipping,
    dispatch,
    progressAnimation,
    overlayAnimation
  ]);

  // Update progress animation when workout position changes
  useEffect(() => {
    if (!activeWorkout || !isWorkoutActive) return;
    
    // Skip animation updates triggered by the timer during a skip action
    if (skipActionRef.current || isSkipping) {
      console.log('[WorkoutScreen] Skip in progress, not updating animation from timer');
      return;
    }
    
    // Calculate progress as a percentage (0-1)
    const progress = Math.min(workoutPosition / workoutTotalTime, 1);
    console.log(`[WorkoutScreen] Updating progress animation: ${progress.toFixed(2)}`);
    
    // Don't animate if paused
    if (isPaused) return;
    
    // Store current position in a ref for consistency checks
    const currentPositionForCheck = workoutPosition;
    
    // Animate the progress marker and overlay
    Animated.parallel([
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 300, // Faster animation for better responsiveness
        useNativeDriver: false,
        easing: Easing.linear,
      }),
      Animated.timing(overlayAnimation, {
        toValue: progress,
        duration: 300, // Faster animation for better responsiveness
        useNativeDriver: false,
        easing: Easing.linear,
      })
    ]).start(() => {
      // After animation completes, verify we still have the right position
      if (workoutPosition !== currentPositionForCheck && !skipActionRef.current) {
        console.log('[WorkoutScreen] Position changed during animation, updating markers');
        const newProgress = Math.min(workoutPosition / workoutTotalTime, 1);
        progressAnimation.setValue(newProgress);
        overlayAnimation.setValue(newProgress);
      }
    });
    
  }, [workoutPosition, isPaused, isWorkoutActive, activeWorkout, workoutTotalTime, isSkipping]);

  const handlePause = () => {
    dispatch(pauseWorkoutAction());
    setIsPauseModalVisible(true);
  };

  const handleResume = () => {
    dispatch(resumeWorkoutAction());
    setIsPauseModalVisible(false);
  };

  const handleEndWorkout = () => {
    dispatch(endWorkoutAction());
    navigation.navigate('WorkoutLibrary');
  };

  // If no active workout yet, show loading
  if (!isWorkoutActive || !activeWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </SafeAreaView>
    );
  }
  
  // Get the next segment (if any)
  const nextSegment = currentSegmentIndex < activeWorkout.segments.length - 1 
    ? activeWorkout.segments[currentSegmentIndex + 1] 
    : null;
  
  // Render the timeline visualization with individual bars for each segment
  const renderTimelineBars = () => {
    // Create an array of uniformly-sized bars to represent the workout
    // Each bar represents a small time slice - we'll use 40 bars total
    const totalBars = 40;
    const bars = [];
    
    // Calculate each segment's contribution to the total bars
    let position = 0;
    let segmentIndex = 0;
    let segmentBarsRemaining = 0;
    let currentSegmentType = activeWorkout.segments[0].type as PaceType;
    
    // Calculate total workout duration
    const totalDuration = workoutTotalTime;
    
    // Distribute the bars among segments based on duration proportion
    for (let i = 0; i < totalBars; i++) {
      // If we've used all the bars for the current segment, move to the next one
      if (segmentBarsRemaining <= 0 && segmentIndex < activeWorkout.segments.length) {
        const segment = activeWorkout.segments[segmentIndex];
        const segmentDuration = segment.duration;
        const segmentProportion = segmentDuration / totalDuration;
        segmentBarsRemaining = Math.max(1, Math.round(segmentProportion * totalBars));
        currentSegmentType = segment.type as PaceType;
        segmentIndex++;
      }
      
      // Ensure we have at least one bar for each segment
      if (segmentBarsRemaining <= 0) segmentBarsRemaining = 1;
      
      // Create the bar
      const barHeight = getPaceHeight(currentSegmentType);
      
      bars.push(
        <View 
          key={i}
          style={[
            styles.timelineBar, 
            { 
              height: barHeight, 
              backgroundColor: PACE_COLORS[currentSegmentType],
              marginHorizontal: 0, // Remove gap between bars to fix empty space
              flex: 1, // Make bars flex to fill the container
            }
          ]} 
        />
      );
      
      segmentBarsRemaining--;
      position++;
    }
    
    return bars;
  };
  
  // Determine height based on pace type (matching the mockup)
  const getPaceHeight = (paceType: PaceType): number => {
    switch(paceType) {
      case 'recovery': return 8;  // Shortest bars for recovery
      case 'base': return 12;     // Medium-short bars for base
      case 'run': return 18;      // Medium-tall bars for run
      case 'sprint': return 24;   // Tallest bars for sprint
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
              backgroundColor: currentSegment?.type === 'recovery' ? COLORS.recoveryMuted :
                              currentSegment?.type === 'base' ? COLORS.baseMuted :
                              currentSegment?.type === 'run' ? COLORS.runMuted : 
                              COLORS.sprintMuted, 
              borderColor: currentSegment ? PACE_COLORS[currentSegment.type as PaceType] : COLORS.white
            },
            isTransitioning && styles.transitioningSegment
          ]}>
            {/* Position in workout (counts up, jumps when skipping) */}
            <Text style={styles.segmentTime} testID="workout-position">{formatTime(elapsedTime)}</Text>
            {currentSegment && (
              <View style={[styles.paceBadge, { backgroundColor: PACE_COLORS[currentSegment.type as PaceType] }]}>
                <Text style={styles.paceBadgeText}>{currentSegment.type.charAt(0).toUpperCase() + currentSegment.type.slice(1)} Pace</Text>
              </View>
            )}
            {currentSegment && (
              <Text style={styles.inclineInfo}>Incline: {currentSegment.incline}%</Text>
            )}
          </View>
          
          {/* Next Segment Info with Countdown */}
          <View style={[styles.nextSegment, styles.noBottomMargin]}>
            <Text style={styles.nextLabel}>Next:</Text>
            <View style={styles.nextInfo}>
              {nextSegment ? (
                <>
                  <Text style={[styles.nextTime, { color: COLORS.white }]}>
                    {formatCountdownTime(segmentTimeRemaining)}
                  </Text>
                  <Text style={[styles.nextPace, { color: PACE_COLORS[nextSegment.type as PaceType] }]}>
                    {nextSegment.type.charAt(0).toUpperCase() + nextSegment.type.slice(1)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.nextTime, { color: COLORS.white }]}>
                    {formatCountdownTime(segmentTimeRemaining)}
                  </Text>
                  <Text style={styles.nextPace}>
                    Last Segment
                  </Text>
                </>
              )}
            </View>
          </View>
          
          {/* Timeline - moved up with no gap */}
          <View style={styles.timelineContainerNoGap}>
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
                testID="progress-marker"
              />
              
              <View style={styles.timelineBarContainer}>
                {renderTimelineBars()}
              </View>
            </View>
            
            <View style={styles.timelineTimes}>
              <Text style={styles.timeText}>0:00</Text>
              <Text style={styles.timeText}>{formatTime(Math.floor(workoutTotalTime / 4))}</Text>
              <Text style={styles.timeText}>{formatTime(Math.floor(workoutTotalTime / 2))}</Text>
              <Text style={styles.timeText}>{formatTime(Math.floor(workoutTotalTime * 3 / 4))}</Text>
              <Text style={styles.timeText}>{formatTime(workoutTotalTime)}</Text>
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
                style={[styles.button, styles.skipButton, isSkipping && styles.disabledButton]} 
                onPress={handleSkipSegment}
                disabled={isSkipping || isPaused}
                testID="skip-button"
              >
                <Text style={styles.buttonText}>Skip</Text>
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
            <Text style={styles.modalTime}>{formatTime(workoutPosition)}</Text>
            
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
    justifyContent: 'space-between', // Distribute content evenly
  },
  debugContainer: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 5,
    marginVertical: 5,
  },
  debugText: {
    color: '#ffcc00',
    fontFamily: 'monospace',
    fontSize: 12,
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
    marginBottom: 10, // Add a small margin between segments
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noBottomMargin: {
    marginBottom: 0, // Used to remove margin from the last segment info
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
    marginTop: 5, // Reduced spacing as requested in the task
    flex: 1, // Allow timeline to flex
    justifyContent: 'flex-end', // Push to the bottom
    marginBottom: 20, // Space above control buttons
  },
  timelineContainerNoGap: {
    // No top margin to remove blank space
    marginTop: 0,
    paddingTop: 10, // Small padding for spacing
    flex: 0, // Don't flex - this keeps it close to the Next section
    justifyContent: 'flex-start', // Align at the top
    marginBottom: 20, // Space above control buttons
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
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Exact value from mockup
    zIndex: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
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
    height: '100%',
    width: '100%',
    alignItems: 'flex-end',
    padding: 4, // Exact value from mockup (padding top/bottom)
    justifyContent: 'space-between', // Space bars evenly across entire width
    position: 'relative',
    zIndex: 0,
  },
  timelineBar: {
    flex: 1, // Each bar should take equal space
    borderRadius: 0, // Remove border radius to avoid gaps
    height: 20, // Default height, will be overridden
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
    marginTop: 'auto', // Push buttons to the bottom
    paddingTop: 20, // Add padding above controls
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
  disabledButton: {
    opacity: 0.5,
    backgroundColor: COLORS.mediumGray,
  },
  button: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WorkoutInProgressScreen;