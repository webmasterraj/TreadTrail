import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
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
  StatusBar,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaceType } from '../types';
import { COLORS, FONT_SIZES, SPACING, PACE_COLORS } from '../styles/theme';
import { WorkoutVisualization } from '../components/workout';
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
import { UserContext } from '../context';
import { createWorkoutSession } from '../utils/historyUtils';
import useWorkoutTimer from '../hooks/useWorkoutTimer';
import useWorkoutAudio from '../hooks/useWorkoutAudio';
import { addWorkoutSession } from '../redux/slices/workoutProgramsSlice';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid, AVPlaybackStatus } from 'expo-av';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutInProgress'>;

const WorkoutInProgressScreen: React.FC<Props> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  
  // Audio refs
  const audioPlayingRef = useRef<string | null>(null);
  const sounds = useRef<Record<string, Audio.Sound>>({}).current;
  
  // Track workout position based on Redux's elapsed time
  const [workoutPosition, setWorkoutPosition] = useState(0);
  
  // Refs to handle skipping segments properly
  const skipActionRef = useRef(false);
  const prevSegmentIndexRef = useRef(0);
  const prevIsSkippingRef = useRef(false);
  
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

  // Get user preferences from context
  const { userSettings } = useContext(UserContext);
  const preferences = userSettings?.preferences || { enableAudioCues: true, units: 'imperial', darkMode: false };
  const paceSettings = userSettings?.paceSettings || { recovery: { speed: 3, incline: 1 }, base: { speed: 5, incline: 1 }, run: { speed: 7, incline: 2 }, sprint: { speed: 9, incline: 2 } };

  // Initialize audio for workout
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // We don't need to explicitly request permissions here anymore
        // as they will be handled by the system based on the app.json configuration
        // and in the useWorkoutAudio hook
        
        // Check if audio is enabled in device settings
        const { granted } = await Audio.getPermissionsAsync();
        
        if (!granted) {
          const { granted: newGranted } = await Audio.requestPermissionsAsync();
          
          if (!newGranted) {
            Alert.alert(
              "Audio Permission Required",
              "TreadTrail needs audio permission to play workout sounds. Please enable this in your device settings.",
              [{ text: "OK" }]
            );
          }
        }
        
        // Set audio mode for best compatibility
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false
        });
        
      } catch (error) {
        console.error("[WorkoutScreen] Error setting up audio:", error);
      }
    };
    
    setupAudio();
  }, []);

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
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      });

    // Set up back handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handlePause();
      return true;
    });

    // Cleanup
    return () => {
      backHandler.remove();
    };
  }, []);

  // Use the audio hook for workout cues
  const { pauseAudio, stopAudio, playTestCountdown } = useWorkoutAudio({
    workout: activeWorkout,
    currentSegmentIndex,
    segmentElapsedTime,
    isRunning,
    isSkipping,
    isCompleted,
    enableAudioCues: preferences.enableAudioCues
  });

  // Enable or disable audio based on user preferences
  const audioEnabled = preferences.enableAudioCues;

  // Handle audio cues when workout state changes
  useEffect(() => {
    if (activeWorkout && audioEnabled) {
      // Handle segment transitions
      if (prevSegmentIndexRef.current !== currentSegmentIndex) {
        // Update the previous segment index
        prevSegmentIndexRef.current = currentSegmentIndex;
        
        // Play segment audio if available
        if (currentSegment && currentSegment.audio && !isSkipping) {
          // Play segment audio
        }
      }
      
      // Stop audio when workout is completed
      if (isCompleted) {
        stopAudio();
      }
    }
  }, [currentSegmentIndex, activeWorkout, audioEnabled, currentSegment, isSkipping, isCompleted, stopAudio]);

  // Preload segment audio files
  useEffect(() => {
    if (!activeWorkout || !audioEnabled) return;
    
    const loadSegmentAudio = async () => {
      try {
        // Clean up any existing sounds
        for (const key in sounds) {
          const sound = sounds[key];
          if (sound) {
            await sound.unloadAsync();
            delete sounds[key];
          }
        }
        
        // Load audio for each segment that has an audio file
        for (let i = 0; i < activeWorkout.segments.length; i++) {
          const segment = activeWorkout.segments[i];
          if (segment.audio && segment.audio.uri) {
            try {
              const { sound } = await Audio.Sound.createAsync({ uri: segment.audio.uri });
              sounds[`segment-${i}`] = sound;
            } catch (e) {
              console.error(`Failed to load audio for segment ${i}:`, e);
            }
          }
        }
        
      } catch (e) {
        console.error("Error loading segment audio:", e);
      }
    };
    
    loadSegmentAudio();
    
    // Clean up sounds when component unmounts
    return () => {
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.unloadAsync().catch(e => console.error("Error unloading sound:", e));
        }
      });
    };
  }, [activeWorkout, audioEnabled]);

  // Handle workout completion
  useEffect(() => {
    if (isCompleted && activeWorkout) {
      handleWorkoutComplete();
    }
  }, [isCompleted, activeWorkout]);

  // Handle segment transitions and audio cues
  useEffect(() => {
    if (!activeWorkout || !isRunning || !audioEnabled) return;

    // Check if we need to play audio for the next segment
    if (currentSegmentIndex < activeWorkout.segments.length - 1) {
      const nextSegment = activeWorkout.segments[currentSegmentIndex + 1];
      const currentSegment = activeWorkout.segments[currentSegmentIndex];
      
      // Default voiceover duration if not available
      const voiceoverDuration = (nextSegment.audio && nextSegment.audio.duration) || 3;
      const countdownDuration = 3; // Fixed 3-second countdown
      const pauseDuration = 1; // Pause between voiceover and countdown
      const totalDuration = voiceoverDuration + pauseDuration + countdownDuration;
      
      const timeUntilNextSegment = currentSegment.duration - segmentElapsedTime;
      
      // Start playing the sequence so that the countdown ends exactly when the segment changes
      if (timeUntilNextSegment <= totalDuration && 
          timeUntilNextSegment > totalDuration - 1 &&
          audioPlayingRef.current !== `segment-${currentSegmentIndex + 1}`) {
        
        const playAudioSequence = async () => {
          // Play the voiceover for the next segment if it exists
          const soundKey = `segment-${currentSegmentIndex + 1}`;
          const sound = sounds[soundKey];
          
          if (sound) {
            audioPlayingRef.current = soundKey;
            try {
              await sound.playAsync();
              
              // Reset the reference when done playing
              sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                if (status.isLoaded && status.didJustFinish) {
                  audioPlayingRef.current = null;
                }
              });
            } catch (e) {
              console.error("Error playing segment audio:", e);
              audioPlayingRef.current = null;
            }
          } else {
            console.log(`No audio available for segment ${currentSegmentIndex + 1}`);
          }
        };
        
        playAudioSequence();
      }
    }
  }, [currentSegmentIndex, segmentElapsedTime, isRunning, activeWorkout, audioEnabled]);

  // Handle skip state reset
  useEffect(() => {
    if (!isSkipping && skipActionRef.current) {
      skipActionRef.current = false;
    }
    
    // If skipping was true and is now false, we can reset the skip state
    if (!isSkipping && prevIsSkippingRef.current) {
      prevIsSkippingRef.current = false;
    }
    
    // Update previous skipping state
    prevIsSkippingRef.current = isSkipping;
  }, [isSkipping]);

  // Handle pause button press
  const handlePause = () => {
    if (!isWorkoutActive) return;
    
    dispatch(pauseWorkoutAction());
    setIsPauseModalVisible(true);
    
    // Pause any playing audio
    if (audioEnabled) {
      pauseAudio();
    }
  };

  // Handle resume button press
  const handleResume = () => {
    if (!isWorkoutActive) return;
    
    dispatch(resumeWorkoutAction());
    setIsPauseModalVisible(false);
    
    // No need to resume audio - we'll just play the next cue when appropriate
  };

  // Handle skip button press
  const handleSkip = () => {
    if (!isWorkoutActive) return;
    
    skipActionRef.current = true;
    dispatch(skipSegmentAction());
    
    // Reset skip state after a short delay to allow for multiple skips
    setTimeout(() => {
      dispatch(resetSkipState());
    }, 100);
    
    // Stop any playing audio if audio is enabled
    if (audioEnabled) {
      stopAudio();
    }
  };

  // Handle end workout button press
  const handleEndWorkout = () => {
    Alert.alert(
      'End Workout',
      'Are you sure you want to end this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Workout', 
          style: 'destructive',
          onPress: () => {
            dispatch(endWorkoutAction());
            navigation.goBack();
            
            // Stop any playing audio
            if (audioEnabled) {
              stopAudio();
            }
          }
        }
      ]
    );
  };

  // Handle workout completion
  const handleWorkoutComplete = () => {
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
      const now = new Date();
      const localDateString = 
        now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0');
        
      const session = {
        id: sessionId,
        workoutId: activeWorkout.id,
        workoutName: activeWorkout.name,
        date: localDateString, // Local date string in YYYY-MM-DD format
        startTime: now.toISOString(), // Keep ISO string for full timestamp
        endTime: now.toISOString(),
        duration: elapsedTime,
        completed: currentSegmentIndex >= activeWorkout.segments.length - 1,
        pauses: [], // Could track pauses in a real implementation
        segments: completedSegments,
      };
      
      // Stop any playing audio
      if (audioEnabled) {
        stopAudio();
      }
      
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

  // Handle segment transition animation
  const handleSegmentTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
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
  const nextSegment = currentSegmentIndex < activeWorkout.segments.length 
    ? activeWorkout.segments[currentSegmentIndex + 1] 
    : null;
    
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
            
            {/* Use the shared WorkoutVisualization component */}
            <WorkoutVisualization
              segments={activeWorkout.segments}
              progressPosition={elapsedTime}
              minutePerBar={true} // Each bar represents 1 minute
              showOverlay={true}
              maxBars={40}
            />
            
            <View style={styles.timelineTimes}>
              <Text style={styles.timeText}>0'</Text>
              <Text style={styles.timeText}>{Math.floor(workoutTotalTime / 60 / 4)}'</Text>
              <Text style={styles.timeText}>{Math.floor(workoutTotalTime / 60 / 2)}'</Text>
              <Text style={styles.timeText}>{Math.floor(workoutTotalTime / 60 * 3 / 4)}'</Text>
              <Text style={styles.timeText}>{Math.floor(workoutTotalTime / 60)}'</Text>
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
                style={[
                  styles.button, 
                  styles.skipButton, 
                  isSkipping && styles.disabledButton
                ]} 
                onPress={handleSkip}
                disabled={isSkipping || isPaused}
                testID="skip-button"
              >
                <Text style={[
                  styles.buttonText,
                  isSkipping && styles.disabledButtonText
                ]}>Skip</Text>
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
  transitioningSegment: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
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
    alignItems: 'flex-end', // Align bars at the bottom
    padding: 4, // Padding inside the container
    position: 'relative',
    zIndex: 0,
    justifyContent: 'flex-start', // Align bars from the start (left)
  },
  timelineBar: {
    width: 6, // Default width for a bar
    borderRadius: 3, // Rounded corners like WorkoutLibrary
    height: 15, // Default height, will be overridden
    marginRight: 4, // Default spacing between bars
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
  button: {
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16, // Exact value from mockup
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: COLORS.mediumGray,
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
    width: '100%',
    maxWidth: 300,
  },
  resumeButton: {
    backgroundColor: COLORS.accent,
    marginBottom: 10,
  },
  resumeButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  restartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  restartButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  endButtonModal: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  endButtonModalText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WorkoutInProgressScreen;