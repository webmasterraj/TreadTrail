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
  selectIsCompleted,
  formatTime,
  formatCountdownTime,
  startWorkout as startWorkoutAction,
  pauseWorkout as pauseWorkoutAction,
  resumeWorkout as resumeWorkoutAction,
  skipSegment as skipSegmentAction,
  endWorkout as endWorkoutAction,
  resetSkipState
} from '../redux/slices/workoutSlice';
import { createWorkoutSession } from '../utils/historyUtils';
import useWorkoutTimer from '../hooks/useWorkoutTimer';
import { addWorkoutSession } from '../redux/slices/workoutProgramsSlice';

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
  const isCompleted = useAppSelector(selectIsCompleted);
  
  // Initialize the Redux timer
  // Use the hook at the component level for proper lifecycle management
  const timer = useWorkoutTimer();

  // Track if workout has been initialized
  const hasInitializedRef = useRef(false);

  // Initialize workout when component mounts (but only once!)
  useEffect(() => {
    // Critical fix: Only initialize once to prevent constant restarting
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    
    // Start the workout using Redux only
    dispatch(startWorkoutAction(workoutId))
      .unwrap()
      .then(() => {
        // Workout started successfully
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
      prevSegmentIndexRef.current = currentSegmentIndex;
      
      // Force immediate position calculation on segment change
      if (activeWorkout) {
        updateWorkoutPosition();
      }
    }
  }, [currentSegmentIndex]);
  
  // Monitor changes to segmentTimeRemaining for timer sync
  useEffect(() => {
    // Update relevant state on timer change - helps with syncing after skips
    if (activeWorkout && segmentTimeRemaining > 0) {
      // When context updates segment time, ensure our UI is in sync
      const currentSegment = activeWorkout.segments[currentSegmentIndex];
      
      // If we're close to the segment's total duration, we probably just switched segments
      // For example, if a 90-second segment shows 90 or 89 seconds remaining
      if (segmentTimeRemaining >= currentSegment.duration - 2) {
        // New segment detected - ensure timers are in sync
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
  }, [currentSegmentIndex]);
  
  // Calculate the position in the workout including skipped segments
  const calculateWorkoutPosition = useCallback(() => {
    // If we're not in an active workout, use elapsedTime directly
    if (!activeWorkout || !isWorkoutActive) return elapsedTime;
    
    // If we're currently skipping, don't recalculate (avoids conflicting with the skip logic)
    if (skipActionRef.current || isSkipping) {
      return lastPositionRef.current;
    }
    
    // In the Redux implementation, we can just use the elapsedTime directly
    // since it's properly managed by the reducer logic
    const newPosition = elapsedTime;
    
    // Still keep the lastPositionRef to ensure we never go backward
    const finalPosition = Math.max(lastPositionRef.current, newPosition);
    
    // Update our reference
    lastPositionRef.current = finalPosition;
    
    return finalPosition;
  }, [
    activeWorkout, 
    isWorkoutActive, 
    elapsedTime,
    isSkipping
  ]);
  
  // Update workout position
  const updateWorkoutPosition = useCallback(() => {
    const newPosition = calculateWorkoutPosition();
    setWorkoutPosition(newPosition);
  }, [calculateWorkoutPosition, workoutPosition]);

  // Update workout position whenever relevant state changes
  useEffect(() => {
    // Don't update from workoutContext if we're in the middle of skipping
    if (skipActionRef.current) {
      return;
    }
    
    updateWorkoutPosition();
  }, [updateWorkoutPosition, currentSegmentIndex, segmentTimeRemaining]);
  
  // Handle automatic workout completion when the isCompleted flag is set
  useEffect(() => {
    if (isCompleted && isWorkoutActive) {
      // Complete the workout after a brief delay
      const timeoutId = setTimeout(() => {
        handleCompleteWorkout();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isCompleted, isWorkoutActive]);

  // We're now using the Redux isSkipping state instead of local state

  // Track last skip time to throttle skip requests
  const lastSkipTimeRef = useRef(0);
  

  // Skip segment handler using Redux
  const handleSkipSegment = useCallback(() => {
    // Prevent multiple skips - add a 750ms throttle to prevent double-taps and UI jumpiness
    const now = Date.now();
    if (isSkipping || skipActionRef.current || (now - lastSkipTimeRef.current < 750)) {
      return;
    }
    
    // Update last skip time and store it for subsequent use
    const skipTime = Date.now();
    lastSkipTimeRef.current = skipTime;
    
    // Set skipping state locally to prevent UI issues
    skipActionRef.current = true;
    
    // If no workout is active, do nothing
    if (!activeWorkout || !isWorkoutActive) {
      skipActionRef.current = false;
      return;
    }
    
    // Save the current segment index in a local variable for reliability
    const currentIndex = currentSegmentIndex;
    const nextIndex = currentIndex + 1;
    
    // If this is the last segment, mark it as complete by setting progress to 100%
    if (nextIndex >= activeWorkout.segments.length) {
      skipActionRef.current = false;
      
      // Set all animations to 100%
      const progress = 1.0; // 100%
      progressAnimation.setValue(progress);
      overlayAnimation.setValue(progress);
      
      // Calculate total workout time
      let totalTime = 0;
      for (let i = 0; i < activeWorkout.segments.length; i++) {
        totalTime += activeWorkout.segments[i].duration;
      }
      
      // Force position to the end
      lastPositionRef.current = totalTime;
      setWorkoutPosition(totalTime);
      
      // When workout ends normally by completing all segments or skipping to the end,
      // directly go to the completion screen without asking
      setTimeout(() => {
        handleCompleteWorkout();
      }, 500);
      
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
      newPosition = Math.min(newPosition, workoutTotalTime);
    }
    
    // Update our references to ensure we don't go backward
    lastPositionRef.current = newPosition;
    
    // Force setting the new position with immediate effects
    setWorkoutPosition(newPosition);
    
    // Calculate and set progress value
    const progress = Math.min(newPosition / workoutTotalTime, 1);
    
    // CRITICAL FIX: Set animated values directly without animation to ensure immediate update
    progressAnimation.setValue(progress);
    overlayAnimation.setValue(progress);
    
    // DISPATCH REDUX ACTION TO SKIP SEGMENT
    dispatch(skipSegmentAction())
      .unwrap()
      .then(() => {
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
      return;
    }
    
    // Calculate progress as a percentage (0-1)
    const progress = Math.min(workoutPosition / workoutTotalTime, 1);
    
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
        const newProgress = Math.min(workoutPosition / workoutTotalTime, 1);
        progressAnimation.setValue(newProgress);
        overlayAnimation.setValue(newProgress);
      }
    });
    
  }, [workoutPosition, isPaused, isWorkoutActive, activeWorkout, workoutTotalTime, isSkipping]);

  // Define control handlers
  const handlePause = () => {
    dispatch(pauseWorkoutAction());
    setIsPauseModalVisible(true);
  };

  const handleResume = () => {
    dispatch(resumeWorkoutAction());
    setIsPauseModalVisible(false);
  };
  
  const handleReturnToLibrary = () => {
    // Simply end the workout without saving and return to the library
    dispatch(endWorkoutAction());
    navigation.navigate('WorkoutLibrary');
  };
  
  const handleEndWorkout = () => {
    // Show a confirmation dialog asking the user what they want to do
    Alert.alert(
      'End Workout',
      'What would you like to do?',
      [
        {
          text: 'Return to Workout Library',
          onPress: handleReturnToLibrary,
          style: 'default',
        },
        {
          text: 'Mark as Complete',
          onPress: handleCompleteWorkout,
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Define the complete workout handler
  const handleCompleteWorkout = () => {
    // First create a session from the current workout state
    if (activeWorkout) {
      // Generate a unique ID for the session
      const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Create completed segments array
      const completedSegments = activeWorkout.segments.map((segment, index) => {
        return {
          type: segment.type,
          duration: index < currentSegmentIndex ? segment.duration : 
                   index === currentSegmentIndex ? segmentElapsedTime : 0,
          plannedDuration: segment.duration,
          skipped: index > currentSegmentIndex || 
                  (index === currentSegmentIndex && segmentElapsedTime < segment.duration)
        };
      });
      
      // Create the session object
      const now = new Date().toISOString();
      const session = {
        id: sessionId,
        workoutId: activeWorkout.id,
        workoutName: activeWorkout.name,
        date: now.split('T')[0], // Just the date part
        startTime: new Date().toISOString(), // In a real implementation, track the actual start time
        endTime: now,
        duration: elapsedTime,
        completed: currentSegmentIndex >= activeWorkout.segments.length - 1,
        pauses: [], // Could track pauses in a real implementation
        segments: completedSegments,
      };
      
      // Save the session using the utility function
      createWorkoutSession(session).then(() => {
        // End the workout in Redux
        dispatch(endWorkoutAction());
        
        // IMPORTANT: Add the session to Redux directly to ensure stats are calculated properly
        dispatch(addWorkoutSession(session))
          .catch(err => {
            console.error('Error adding session to Redux:', err);
          });
        
        // Navigate to the complete screen
        navigation.navigate('WorkoutComplete', { sessionId });
      }).catch(error => {
        console.error('Error saving workout session:', error);
        // Still end the workout in redux
        dispatch(endWorkoutAction());
        navigation.navigate('WorkoutLibrary');
      });
    } else {
      // If somehow no active workout, just end it and go back
      dispatch(endWorkoutAction());
      navigation.navigate('WorkoutLibrary');
    }
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
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseIcon}>
              <Text style={styles.pauseIconSymbol}>II</Text>
            </View>
            
            <Text style={styles.pauseTitle}>Workout Paused</Text>
            <Text style={styles.workoutName}>{activeWorkout?.name || "Workout"}</Text>
            
            <View style={styles.workoutProgress}>
              <Text style={styles.progressText}>{formatTime(elapsedTime)}</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(100, (elapsedTime / workoutTotalTime) * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>{formatTime(workoutTotalTime)}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.resumeButton]} 
                onPress={handleResume}
              >
                <Text style={styles.resumeButtonText}>Resume Workout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.restartButton]}
                onPress={() => {
                  // For now just restart from beginning by end and then navigating
                  setIsPauseModalVisible(false);
                  dispatch(endWorkoutAction());
                  navigation.replace('WorkoutDetails', { workoutId: activeWorkout.id });
                }}
              >
                <Text style={styles.restartButtonText}>Restart Workout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.endButtonModal]} 
                onPress={() => {
                  setIsPauseModalVisible(false);
                  handleEndWorkout();
                }}
              >
                <Text style={styles.endButtonModalText}>End Workout</Text>
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
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  pauseIcon: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pauseIconSymbol: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  pauseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  workoutName: {
    fontSize: 22,
    color: COLORS.accent,
    marginBottom: 20,
    textAlign: 'center',
  },
  workoutProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    maxWidth: 250,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.mediumGray || '#222222',
    borderRadius: 3,
    marginHorizontal: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    fontWeight: '500',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 250,
    gap: 15,
  },
  resumeButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  restartButton: {
    backgroundColor: COLORS.mediumGray || '#222222',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  restartButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  endButtonModal: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
  },
  endButtonModalText: {
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