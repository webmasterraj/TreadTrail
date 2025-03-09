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
  
  // Track workout position based on context's elapsed time
  const [workoutPosition, setWorkoutPosition] = useState(0);
  
  // Refs to handle skipping segments properly
  const skipActionRef = useRef(false);
  const prevSegmentIndexRef = useRef(0);
  
  // We no longer need displayTimeRemaining state - using context directly

  const { 
    activeWorkout,
    isWorkoutActive,
    currentSegmentIndex,
    elapsedTime,
    segmentTimeRemaining,
    segmentTotalTime,      // Get additional timer properties
    workoutTotalTime,
    workoutStartTime,
    segmentStartTime,
    isPaused,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    skipToNextSegment,
    endWorkout,
  } = useContext(WorkoutContext);

  const { getWorkoutById } = useContext(DataContext);

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
    
    // Setup an emergency check that periodically verifies the position and progress markers
    // are consistent, especially after skipping segments
    const emergencyCheckTimer = setInterval(() => {
      if (skipActionRef.current || !activeWorkout) return;
      
      // Verify that our progress marker matches our workoutPosition
      const expectedProgress = Math.min(workoutPosition / getTotalDuration(), 1);
      
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
  }, []);

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

  // Calculate total workout duration
  const getTotalDuration = useCallback(() => {
    return activeWorkout?.segments.reduce((total, segment) => total + segment.duration, 0) || 1;
  }, [activeWorkout]);

  // Track the last position we calculated to ensure we never go backward
  const lastPositionRef = useRef(0);
  
  // Track the elapsed time since last segment change
  const [elapsedSinceSegmentChange, setElapsedSinceSegmentChange] = useState(0);
  
  // Remember when the last segment change occurred
  const lastSegmentChangeTimeRef = useRef(Date.now());
  
  // Create a reference to track accurate elapsed time
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Check for segment changes and update timer
  useEffect(() => {
    // Clear previous timer if it exists
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // When segment changes, reset our counter and update timestamp
    lastSegmentChangeTimeRef.current = Date.now();
    setElapsedSinceSegmentChange(0);
    
    // Function to update elapsed time
    const updateElapsedTime = () => {
      if (!isPaused) {
        // Calculate how many full seconds have passed
        const timeSinceChange = Date.now() - lastSegmentChangeTimeRef.current;
        const newElapsed = Math.floor(timeSinceChange / 1000);
        
        // Only update if the value has changed
        if (newElapsed !== elapsedSinceSegmentChange) {
          // console.log(`[WorkoutScreen] Timer tick: ${elapsedSinceSegmentChange} -> ${newElapsed}`);
          setElapsedSinceSegmentChange(newElapsed);
        }
      }
    };
    
    // Start timer with a faster update rate
    timerIntervalRef.current = setInterval(updateElapsedTime, 250);
    
    // Call once immediately to ensure we have an initial value
    updateElapsedTime();
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentSegmentIndex, isPaused]);
  
  // Calculate the position in the workout including skipped segments
  const calculateWorkoutPosition = useCallback(() => {
    // If we're not in an active workout, use the last known position
    if (!activeWorkout || !isWorkoutActive) return lastPositionRef.current;
    
    // If we're currently skipping, don't recalculate (avoids conflicting with the skip logic)
    if (skipActionRef.current) {
      console.log('[WorkoutScreen] Skip in progress, using last position:', lastPositionRef.current);
      return lastPositionRef.current;
    }
    
    // Defensive programming - ensure valid segment index
    if (currentSegmentIndex < 0 || currentSegmentIndex >= activeWorkout.segments.length) {
      console.log(`[WorkoutScreen] WARNING: Invalid segment index: ${currentSegmentIndex}`);
      return lastPositionRef.current;
    }
    
    // Sum the durations of all completed segments
    let completedDuration = 0;
    for (let i = 0; i < currentSegmentIndex; i++) {
      if (i < activeWorkout.segments.length) {
        completedDuration += activeWorkout.segments[i].duration;
      } else {
        console.log(`[WorkoutScreen] WARNING: Tried to access invalid segment index: ${i}`);
      }
    }
    
    // Add the elapsed time in the current segment (with safety checks)
    const currentSegment = activeWorkout.segments[currentSegmentIndex];
    if (!currentSegment) {
      console.log(`[WorkoutScreen] WARNING: Current segment is undefined at index ${currentSegmentIndex}`);
      return Math.max(lastPositionRef.current, completedDuration);
    }
    
    const currentSegmentDuration = currentSegment.duration || 0;
    
    // IMPORTANT: Always use our own timer for consistency
    // This is critical to avoid the timer inconsistencies we were seeing
    const currentSegmentElapsed = Math.min(elapsedSinceSegmentChange, currentSegmentDuration);
    
    // Calculate the new position - base segments plus elapsed time in current segment
    const newPosition = completedDuration + currentSegmentElapsed;
    
    // Never go backward in position
    const finalPosition = Math.max(lastPositionRef.current, newPosition);
    
    // Only log when position changes to reduce noise
    if (finalPosition !== lastPositionRef.current) {
      console.log(`[WorkoutScreen] Position update: ${lastPositionRef.current} -> ${finalPosition} (using elapsed: ${currentSegmentElapsed})`);
    }
    
    // Update our reference
    lastPositionRef.current = finalPosition;
    
    return finalPosition;
  }, [
    activeWorkout, 
    isWorkoutActive, 
    currentSegmentIndex, 
    elapsedSinceSegmentChange,
    skipActionRef
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

  // State to track if a skip operation is in progress
  const [isSkipping, setIsSkipping] = useState(false);

  // ULTRA-DEFENSIVE skip segment handler
  const handleSkipSegment = useCallback(() => {
    // Prevent multiple skips
    if (isSkipping || skipActionRef.current) {
      console.log('[WorkoutScreen] Skip already in progress, ignoring request');
      return;
    }
    
    // Set skipping state to prevent multiple skips
    setIsSkipping(true);
    skipActionRef.current = true;
    
    console.log('[WorkoutScreen] Skip button pressed');
    
    // If no workout is active, do nothing
    if (!activeWorkout || !isWorkoutActive) {
      console.log('[WorkoutScreen] Cannot skip - no active workout');
      setIsSkipping(false);
      skipActionRef.current = false;
      return;
    }
    
    // Save the current segment index in a local variable for reliability
    const currentIndex = currentSegmentIndex;
    const nextIndex = currentIndex + 1;
    
    // If this is the last segment, do nothing
    if (nextIndex >= activeWorkout.segments.length) {
      console.log('[WorkoutScreen] Cannot skip - already on last segment');
      setIsSkipping(false);
      skipActionRef.current = false;
      return;
    }
    
    // Get the current and next segments
    const currentSegment = activeWorkout.segments[currentIndex];
    const nextSegment = activeWorkout.segments[nextIndex];
    
    // Calculate what the position will be after skipping
    let newPosition = 0;
    
    // Add all previous segments
    for (let i = 0; i < currentIndex; i++) {
      newPosition += activeWorkout.segments[i].duration;
    }
    
    // Add current segment (fully counted when skipped)
    newPosition += currentSegment.duration;
    
    // Ensure new position is reasonable
    const totalDuration = getTotalDuration();
    if (newPosition > totalDuration) {
      console.log(`[WorkoutScreen] WARNING: Calculated position ${newPosition} exceeds total duration ${totalDuration}`);
      newPosition = Math.min(newPosition, totalDuration);
    }
    
    console.log(`[WorkoutScreen] Skipping segment ${currentIndex}. Setting position to ${newPosition}`);
    
    // Update our references to ensure we don't go backward
    lastPositionRef.current = newPosition;
    
    // Force setting the new position with immediate effects
    setWorkoutPosition(newPosition);
    
    // CRITICAL FIX: Reset local timing references BEFORE calling context skip
    // This ensures our local timer starts fresh with the new segment
    const now = Date.now();
    lastSegmentChangeTimeRef.current = now;
    setElapsedSinceSegmentChange(0);
    
    // Calculate and set progress value
    const progress = Math.min(newPosition / totalDuration, 1);
    console.log(`[WorkoutScreen] Setting progress to ${progress.toFixed(2)} (${newPosition}/${totalDuration})`);
    
    // CRITICAL FIX: Set animated values directly without animation to ensure immediate update
    progressAnimation.setValue(progress);
    overlayAnimation.setValue(progress);
    
    // Store the values we just set for verification
    const targetPosition = newPosition;
    const targetProgress = progress;
    
    // Store the expected segment time remaining after skip
    const expectedTimeRemaining = nextSegment.duration;
    
    // Set a flag to indicate we're in the middle of a skip operation
    // This prevents other effects from interfering with our state during the transition
    skipActionRef.current = true;
    
    // CALL CONTEXT'S SKIP FUNCTION
    // This should update currentSegmentIndex and segmentTimeRemaining
    const skipStartTime = new Date().toISOString();
    console.log(`[WorkoutScreen] SKIP START @ ${skipStartTime} - calling context skipToNextSegment`);
    skipToNextSegment();
    
    // Clear the skip flag after a short delay to allow state to settle
    setTimeout(() => {
      skipActionRef.current = false;
      setIsSkipping(false);
      
      // Force a final position update to ensure everything is in sync
      updateWorkoutPosition();
      
      console.log(`[WorkoutScreen] Skip operation complete, cleared skip flag`);
    }, 500); // Increased delay to ensure state settles
    
  }, [
    activeWorkout, 
    currentSegmentIndex, 
    getTotalDuration,
    isWorkoutActive,
    skipToNextSegment,
    updateWorkoutPosition,
    isSkipping,
  ]);

  // Update progress animation when workout position changes
  useEffect(() => {
    if (!activeWorkout || !isWorkoutActive) return;
    
    // Skip animation updates triggered by the timer during a skip action
    if (skipActionRef.current) {
      console.log('[WorkoutScreen] Skip in progress, not updating animation from timer');
      return;
    }
    
    // Calculate progress as a percentage (0-1)
    const progress = Math.min(workoutPosition / getTotalDuration(), 1);
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
        const newProgress = Math.min(workoutPosition / getTotalDuration(), 1);
        progressAnimation.setValue(newProgress);
        overlayAnimation.setValue(newProgress);
      }
    });
    
  }, [workoutPosition, isPaused, isWorkoutActive, activeWorkout, getTotalDuration]);

  const handlePause = () => {
    pauseWorkout();
    setIsPauseModalVisible(true);
  };

  const handleResume = () => {
    resumeWorkout();
    setIsPauseModalVisible(false);
  };

  const handleEndWorkout = () => {
    endWorkout();
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

  const currentSegment = activeWorkout.segments[currentSegmentIndex];
  
  const nextSegment = currentSegmentIndex < activeWorkout.segments.length - 1 
    ? activeWorkout.segments[currentSegmentIndex + 1] 
    : null;
  
  const totalDuration = getTotalDuration();
  
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
    
    // Distribute the bars among segments based on duration proportion
    for (let i = 0; i < totalBars; i++) {
      // If we've used all the bars for the current segment, move to the next one
      if (segmentBarsRemaining <= 0 && segmentIndex < activeWorkout.segments.length) {
        const segment = activeWorkout.segments[segmentIndex];
        const segmentDuration = segment.duration;
        const segmentProportion = segmentDuration / totalDuration;
        segmentBarsRemaining = Math.round(segmentProportion * totalBars);
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
              marginHorizontal: 1, // Add small gap between bars
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
              backgroundColor: currentSegment.type === 'recovery' ? COLORS.recoveryMuted :
                            currentSegment.type === 'base' ? COLORS.baseMuted :
                            currentSegment.type === 'run' ? COLORS.runMuted : 
                            COLORS.sprintMuted, 
              borderColor: PACE_COLORS[currentSegment.type as PaceType] 
            },
            isTransitioning && styles.transitioningSegment
          ]}>
            {/* Position in workout (counts up, jumps when skipping) */}
            <Text style={styles.segmentTime} testID="workout-position">{formatTime(workoutPosition)}</Text>
            <View style={[styles.paceBadge, { backgroundColor: PACE_COLORS[currentSegment.type as PaceType] }]}>
              <Text style={styles.paceBadgeText}>{currentSegment.type.charAt(0).toUpperCase() + currentSegment.type.slice(1)} Pace</Text>
            </View>
            <Text style={styles.inclineInfo}>Incline: {currentSegment.incline}%</Text>
          </View>
          
          {/* Current Segment Remaining Time */}
          <View style={styles.nextSegment}>
            <Text style={styles.nextLabel}>Remaining:</Text>
            <View style={styles.nextInfo}>
              <Text style={[styles.nextTime, { color: PACE_COLORS[currentSegment.type as PaceType] }]}>
                {formatTime(segmentTimeRemaining)}
              </Text>
              <Text style={styles.nextPace}>
                Current Segment
              </Text>
            </View>
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
          
          {/* Debug info */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>segmentTimeRemaining: {segmentTimeRemaining}</Text>
            <Text style={styles.debugText}>position: {workoutPosition}</Text>
            <Text style={styles.debugText}>elapsedSinceSegmentChange: {elapsedSinceSegmentChange}</Text>
          </View>
          
          
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
                testID="progress-marker"
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
    marginBottom: 0, // Removing the margin to fix spacing
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
    marginTop: 15, // Reduced from 20 to minimize space
    flex: 1, // Allow timeline to flex
    justifyContent: 'flex-end', // Push to the bottom
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
    justifyContent: 'center',
    position: 'relative',
    zIndex: 0,
  },
  timelineBar: {
    width: 4, // Exact value from mockup
    borderRadius: 2, // Exact value from mockup
    margin: 1,
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
    marginTop: 20, // Add more space above controls
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