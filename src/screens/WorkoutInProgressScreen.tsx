import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Dimensions, 
  Platform, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  Animated, 
  LayoutChangeEvent, 
  Modal, 
  Easing, 
  BackHandler 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaceType, WorkoutSegment } from '../types';
import { COLORS, FONT_SIZES, SPACING, PACE_COLORS } from '../styles/theme';
import { WorkoutVisualization } from '../components/workout';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectActiveWorkout, 
  selectCurrentSegment, 
  selectCurrentSegmentIndex, 
  selectElapsedTime, 
  selectHasStarted, 
  selectIsRunning, 
  selectIsPaused, 
  selectIsSkipping,
  selectIsCompleted,
  formatCountdownTime,
  loadWorkout as loadWorkoutAction,
  startWorkout as startWorkoutAction,
  pauseWorkout as pauseWorkoutAction,
  resumeWorkout as resumeWorkoutAction,
  skipSegment as skipSegmentAction,
  endWorkout as endWorkoutAction,
  completeWorkout as completeWorkoutAction,
  selectSegmentElapsedTime,
  selectSegmentRemaining,
  selectTotalDuration,
  resetSkipState,
  formatTime
} from '../redux/slices/workoutSlice';
import { UserContext } from '../context';
import { createWorkoutSession } from '../utils/historyUtils';
import useWorkoutTimer from '../hooks/useWorkoutTimer';
import useWorkoutAudio from '../hooks/useWorkoutAudio';
import { addWorkoutSession } from '../redux/slices/workoutProgramsSlice';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid, AVPlaybackStatus } from 'expo-av';
import { useSubscription } from '../context/SubscriptionContext';
import { calculateSegmentCalories } from '../utils/calorieUtils';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { audioFiles } from './audiofiles';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutInProgress'>;

// Define types for the CircularProgress component
interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  elapsedTime: number;
  totalDuration: number;
}

// Circular progress component for workout progress
const CircularProgress: React.FC<CircularProgressProps> = ({ 
  progress, 
  size = 80, 
  strokeWidth = 8, 
  circleColor = 'rgba(255, 255, 255, 0.1)', 
  progressColor = COLORS.lightGray,
  elapsedTime,
  totalDuration
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          stroke={circleColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress Circle */}
        <Circle
          stroke={progressColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressTime}>{formatTime(elapsedTime)}</Text>
        <Text style={styles.totalTime}>/ {formatTime(totalDuration)}</Text>
      </View>
    </View>
  );
};

const formatSegmentDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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
  const dispatch = useDispatch();
  const activeWorkout = useSelector(selectActiveWorkout);
  const isWorkoutActive = activeWorkout !== null;
  const isRunning = useSelector(selectIsRunning);
  const elapsedTime = useSelector(selectElapsedTime);
  const hasStarted = isWorkoutActive && (isRunning || elapsedTime > 0);
  const isPaused = isWorkoutActive && !isRunning;
  const currentSegmentIndex = useSelector(selectCurrentSegmentIndex);
  const segmentElapsedTime = useSelector(selectSegmentElapsedTime);
  const currentSegment = useSelector(selectCurrentSegment);
  const segmentTimeRemaining = useSelector(selectSegmentRemaining);
  const workoutTotalTime = useSelector(selectTotalDuration);
  const isSkipping = useSelector(selectIsSkipping);
  const isCompleted = useSelector(selectIsCompleted);
  
  // Calculate total duration
  const totalDuration = useMemo(() => {
    if (!activeWorkout || !activeWorkout.segments) return 0;
    
    // Calculate total duration for all segments
    return activeWorkout.segments.reduce((sum: number, segment: { duration: number }) => {
      return sum + segment.duration;
    }, 0);
  }, [activeWorkout]);

  // Initialize the Redux timer
  // Use the hook at the component level for proper lifecycle management
  const timer = useWorkoutTimer();

  // Track if workout has been initialized
  const hasInitializedRef = useRef(false);

  // Get user preferences from context
  const { userSettings } = useContext(UserContext);
  const preferences = userSettings?.preferences || { enableAudioCues: true, units: 'imperial', darkMode: false };
  const paceSettings = userSettings?.paceSettings || { recovery: { speed: 3, incline: 1 }, base: { speed: 5, incline: 1 }, run: { speed: 7, incline: 2 }, sprint: { speed: 9, incline: 2 } };

  // Get subscription info
  const { subscriptionInfo } = useSubscription();
  const isPremium = subscriptionInfo.isActive || subscriptionInfo.trialActive;

  // State for calorie tracking
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [segmentCalories, setSegmentCalories] = useState(0);
  const userWeight = userSettings?.profile?.weight;
  const hasWeight = !!userWeight;

  // Calculate calories burned in real-time
  useEffect(() => {
    if (isPremium && hasWeight && currentSegment && isRunning) {
      // Get pace settings for the current segment type
      const paceType = currentSegment.type as PaceType;
      const pace = paceSettings[paceType];

      if (pace) {
        // Calculate calories for the current segment
        const caloriesPerMinute = calculateSegmentCalories(
          pace.speed,
          userWeight,
          1, // 1 minute
          pace.incline
        );

        // Update calories based on elapsed time (convert seconds to minutes)
        const newSegmentCalories = caloriesPerMinute * (segmentElapsedTime / 60);
        setSegmentCalories(newSegmentCalories);

        // Calculate total calories for completed segments
        let totalCalories = 0;
        if (activeWorkout && activeWorkout.segments) {
          for (let i = 0; i < currentSegmentIndex; i++) {
            const segment = activeWorkout.segments[i];
            const segmentPace = paceSettings[segment.type as PaceType];
            if (segmentPace) {
              totalCalories += calculateSegmentCalories(
                segmentPace.speed,
                userWeight,
                segment.duration / 60, // Convert seconds to minutes
                segmentPace.incline
              );
            }
          }
        }

        // Add current segment calories
        setCaloriesBurned(totalCalories + newSegmentCalories);
      }
    }
  }, [
    isPremium, 
    hasWeight, 
    currentSegment, 
    segmentElapsedTime, 
    isRunning, 
    currentSegmentIndex, 
    paceSettings, 
    userWeight,
    activeWorkout
  ]);

  // Initialize audio for workout
  // useEffect(() => {
    
  //   setupAudio();
    
  //   // Cleanup audio when component unmounts
  //   return () => {
  //     if (preferences.enableAudioCues) {
  //       stopAudio();
  //     }
  //   };
  // }, []);

  const setupAudio = async () => {
    try {
      // We don't need to explicitly request permissions for audio playback
      // Just set audio mode for best compatibility
      console.log("iGold ::: [WorkoutScreen] Setting up audio mode");

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
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

  // Initialize workout when component mounts (but only once!)
  useEffect(() => {
    // Critical fix: Only initialize once to prevent constant restarting
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    // Load the workout data without starting it
    dispatch(loadWorkoutAction(workoutId))
      .unwrap()
      .catch((error) => {
        console.log('[WorkoutScreen] Failed to load workout:', error);
        Alert.alert(
          'Error',
          'Failed to load workout. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      });

    // Set up back handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // We can't reference handlePause here directly since it's defined later
      // Instead, we'll just dispatch the pause action directly
      if (isWorkoutActive) {
        dispatch(pauseWorkoutAction());
        setIsPauseModalVisible(true);
      }
      return true;
    });

    // Cleanup
    return () => {
      backHandler.remove();
      // Make sure to stop all audio when component unmounts
      // We can't reference stopAudio here directly since it's defined later
    };
  }, [dispatch, workoutId, isWorkoutActive]);

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

  // Add a separate useEffect for audio cleanup
  useEffect(() => {
    // Cleanup function to ensure audio is stopped when component unmounts
    return () => {
      if (preferences.enableAudioCues) {
        stopAudio();
      }
    };
  }, [stopAudio, preferences.enableAudioCues]);

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
  // useEffect(() => {
  //   if (!activeWorkout || !audioEnabled) return;
    
  //   const loadSegmentAudio = async () => {
  //     try {
  //       // Clean up any existing sounds
  //       for (const key in sounds) {
  //         const sound = sounds[key];
  //         if (sound) {
  //           await sound.unloadAsync();
  //           delete sounds[key];
  //         }
  //       }
        
  //       console.log("iGold ::: Loading segment audio...");

  //       // Load audio for each segment that has an audio file
  //       for (let i = 0; i < activeWorkout.segments.length; i++) {
  //         const segment = activeWorkout.segments[i];
  //         if (segment.audio && segment.audio.file) {
  //           try {
  //             // const { sound } = await Audio.Sound.createAsync({ uri: segment.audio.uri });
  //             // const { sound } = await Audio.Sound.createAsync(require(`./assets/audio/${segment.audio.file}`));
  //             const audioFile = audioFiles[segment.audio.file as string];
  //             if (!audioFile) {
  //               console.warn(`Audio file not found in mapping: ${segment.audio.file}`);
  //               continue;
  //             }
  //             const { sound } = await Audio.Sound.createAsync(audioFile);
              
  //             sounds[`segment-${i}`] = sound;
  //             console.log(`Segment ${i},  ::: url = ${segment.audio.file} audio loaded successfully`);
  //           } catch (e) {
  //             console.error(`Failed to load audio for segment ${i}:`, e);
  //           }
  //         }
  //       }
        
  //     } catch (e) {
  //       console.error("Error loading segment audio:", e);
  //     }
  //   };
    
  //   loadSegmentAudio();
    
  //   // Clean up sounds when component unmounts
  //   return () => {
  //     Object.values(sounds).forEach(sound => {
  //       if (sound) {
  //         sound.unloadAsync().catch(e => console.error("Error unloading sound:", e));
  //       }
  //     });
  //   };
  // }, [activeWorkout, audioEnabled]);

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
      const pauseDuration = 3; // Pause between voiceover and countdown
      const totalDuration = voiceoverDuration + pauseDuration + countdownDuration;

      const timeUntilNextSegment = currentSegment.duration - segmentElapsedTime;
      
      console.log(`iGold ::: timeUntilNextSegment =${timeUntilNextSegment},  totalDuration = ${totalDuration}`);

      // Start playing the sequence so that the countdown ends exactly when the segment changes
      if (timeUntilNextSegment <= totalDuration && 
          timeUntilNextSegment > totalDuration - 1 &&
          audioPlayingRef.current !== `segment-${currentSegmentIndex + 1}`) {
        
        console.log(`iGold ::: Playing audio sequence for segment ${currentSegmentIndex + 1}`);
        
        playAudioSequence();
      }
    }
  }, [currentSegmentIndex, segmentElapsedTime, isRunning, activeWorkout, audioEnabled]);

  const playCountdown = async () => {
    try {
      // try {
      //   await Audio.setAudioModeAsync({
      //     playsInSilentModeIOS: true,
      //     staysActiveInBackground: true,
      //     interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      //     shouldDuckAndroid: true,
      //     interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      //     playThroughEarpieceAndroid: false,
      //     allowsRecordingIOS: false,
      //   });
      // } catch (audioModeError) {
      //   console.log('Error setting audio mode for countdown:', audioModeError);
      // }
      
      
      const { sound } = await Audio.Sound.createAsync(
        require('./../assets/audio/countdown.aac'),
        { shouldPlay: true }
      );
      
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        
        if (status.didJustFinish) {
          
          await audioDuckBack()
        }
      });
      
      
    } catch (innerError) {
      
    }
  };

  const playAudioSequence = async () => {
    // Play the voiceover for the next segment if it exists
    const soundKey = `segment-${currentSegmentIndex + 1}`;
    
    await setupAudio();

    const segment = activeWorkout.segments[currentSegmentIndex + 1];
    const audioFile = audioFiles[segment.audio.file as string];
    if (!audioFile) {
      console.warn(`Audio file not found in mapping: ${segment.audio.file}`);
      return;
    }
    
    const { sound } = await Audio.Sound.createAsync(
      audioFile,
      { shouldPlay: true }
    );


    if (sound) {
      audioPlayingRef.current = soundKey;
      try {

        await sound.playAsync();
        
        // Reset the reference when done playing
        sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            audioPlayingRef.current = null;

            await playCountdown()
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

  const audioDuckBack = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true, // Ensures sound plays even in silent mode
        staysActiveInBackground: true, // Keeps audio active when the app is in the background
        shouldDuckAndroid: true, // Enables audio ducking on Android
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      });
    } catch (error) {
      console.error("Error setting audio mode:", error);
    }

    
    const { sound } = await Audio.Sound.createAsync(
      require("./../assets/audio/silent_audio.mp3"),
      { shouldPlay: true }
    );
    await sound.playAsync();

    // Unload sound when done
    sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();        
        console.log(`unaudio playback finished.`);
      }
    });

  };

  /**
   * Progress Indicator Management
   * 
   * The progress indicator is managed through Redux to ensure consistent positioning
   * across component re-renders and during segment transitions.
   * 
   * Two effects handle progress indicator updates:
   * 1. When skipping segments - ensures proper alignment with segment bars
   * 2. During normal workout progress - updates based on elapsed time
   * 
   * This approach provides better visual feedback during workouts, especially
   * when transitioning between segments.
   */

  // Track when skipping occurs to ensure proper progress line positioning
  useEffect(() => {
    if (isSkipping && currentSegmentIndex > 0) {
      // Calculate segment start times for debugging
      const segmentStartTimes = [];
      let accumulatedTime = 0;

      if (activeWorkout && activeWorkout.segments) {
        for (let i = 0; i < activeWorkout.segments.length; i++) {
          segmentStartTimes.push(accumulatedTime);
          accumulatedTime += activeWorkout.segments[i].duration;
        }
      }

      // When skipping, ensure the progress line is positioned correctly
      if (totalDuration > 0) {
        const position = (elapsedTime / totalDuration) * 100;
      }
    }
  }, [isSkipping, currentSegmentIndex, elapsedTime, totalDuration, dispatch, activeWorkout]);

  // Handle skip state reset
  useEffect(() => {
    // If skipping was true and is now false, we can reset the skip state
    if (!isSkipping && prevIsSkippingRef.current) {
      prevIsSkippingRef.current = false;
    }

    // Update previous skipping state
    prevIsSkippingRef.current = isSkipping;
  }, [isSkipping, elapsedTime, totalDuration, dispatch]);

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

    // Prevent multiple skips by checking if already skipping
    if (isSkipping || skipActionRef.current) {
      return;
    }

    skipActionRef.current = true;

    dispatch(skipSegmentAction());

    // Reset skip state after a longer delay to prevent multiple skips
    setTimeout(() => {
      dispatch(resetSkipState());
      skipActionRef.current = false;
    }, 500); // Increased from 100ms to 500ms for better debounce

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
            // Stop any playing audio first
            if (audioEnabled) {
              stopAudio();
            }

            // Then end the workout and navigate back
            dispatch(endWorkoutAction());
            navigation.goBack();
          }
        }
      ]
    );
  };

  // Handle start workout button press
  const handleStartWorkout = () => {
    dispatch(startWorkoutAction(workoutId));
  };

  // Handle workout completion
  const handleWorkoutComplete = () => {
    // First create a session from the current workout state
    if (activeWorkout) {
      // Generate a unique ID for the session
      const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Create completed segments array
      const completedSegments = activeWorkout.segments.map((segment: WorkoutSegment, index: number) => {
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
        
      // Get user's pace settings to include in the session
      const paceSettings = userSettings?.paceSettings;
        
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
        paceSettings: paceSettings, // Add pace settings to allow distance calculation
        caloriesBurned: isPremium && hasWeight ? Math.round(caloriesBurned) : undefined,
      };

      console.log('Creating workout session with pace settings:', paceSettings);

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
    }
  };

  // Dev function to complete workout immediately
  const handleDevCompleteWorkout = () => {
    if (!__DEV__) return; // Only available in development mode
    
    // First create a session from the current workout state
    if (activeWorkout) {
      // Generate a unique ID for the session
      const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Create completed segments array - mark all as completed
      const completedSegments = activeWorkout.segments.map((segment: WorkoutSegment) => {
        return {
          type: segment.type,
          duration: segment.duration, // Mark all segments as fully completed
          plannedDuration: segment.duration,
          skipped: false // No segments skipped
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
        date: localDateString,
        startTime: now.toISOString(),
        endTime: now.toISOString(),
        duration: totalDuration, // Use total duration instead of elapsed time
        completed: true, // Mark as fully completed
        pauses: [],
        segments: completedSegments,
        paceSettings: paceSettings, // Add pace settings to allow distance calculation
        caloriesBurned: isPremium && hasWeight ? Math.round(caloriesBurned) : undefined,
      };

      // Stop any playing audio
      if (audioEnabled) {
        stopAudio();
      }

      // Save the session using the utility function
      createWorkoutSession(session).then(() => {
        // End the workout in Redux
        dispatch(endWorkoutAction());

        // Add the session to Redux
        dispatch(addWorkoutSession(session))
          .catch(err => {
            console.error('Error adding session to Redux:', err);
          });

        // Navigate to the complete screen
        navigation.navigate('WorkoutComplete', { sessionId });
      }).catch(error => {
        console.error('Error saving workout session:', error);
        dispatch(endWorkoutAction());
        navigation.navigate('WorkoutLibrary');
      });
    }
  };

  // Handle segment transition animation
  const handleSegmentTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  // Add state for layout measurements
  const [timerSectionHeight, setTimerSectionHeight] = useState(0);
  const [controlsSectionHeight, setControlsSectionHeight] = useState(0);
  const [visualizationHeight, setVisualizationHeight] = useState(150); // Default height

  // Calculate visualization height when other sections are measured
  useEffect(() => {
    if (timerSectionHeight > 0 && controlsSectionHeight > 0) {
      const screenHeight = Dimensions.get('window').height;
      const statusBarHeight = StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 0);
      const safeAreaPadding = Platform.OS === 'ios' ? 34 : 0; // Bottom safe area for iOS
      const navigationHeight = 60; // Approximate height of navigation header
      const verticalMargins = 40; // Total vertical margins/padding

      // Calculate available space
      const availableHeight = screenHeight - statusBarHeight - navigationHeight - 
                              timerSectionHeight - controlsSectionHeight - 
                              safeAreaPadding - verticalMargins;

      // Set visualization height to a reasonable value based on available space
      const newHeight = Math.max(availableHeight * 0.8, 120); // At least 120px or 80% of available space
      setVisualizationHeight(newHeight);
    }
  }, [timerSectionHeight, controlsSectionHeight]);

  // If no active workout yet, show loading
  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </SafeAreaView>
    );
  }

  // Get the next segment (if any)
  const nextSegment = activeWorkout.segments && currentSegmentIndex < activeWorkout.segments.length - 1
    ? activeWorkout.segments[currentSegmentIndex + 1] 
    : null;

  // Calculate progress percentage for circular progress
  const progressPercentage = totalDuration > 0 ? (elapsedTime / totalDuration) * 100 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, { paddingBottom: 150 }]}>
          {/* Current Segment Panel - Now shows countdown timer for current segment */}
          <View 
            style={[
              styles.currentSegment,
              { 
                backgroundColor: currentSegment?.type === 'recovery' ? COLORS.recoveryMuted :
                                currentSegment?.type === 'base' ? COLORS.baseMuted :
                                currentSegment?.type === 'run' ? COLORS.runMuted : 
                                COLORS.sprintMuted, 
                borderColor: currentSegment ? PACE_COLORS[currentSegment.type as PaceType] : COLORS.white
              },
              isTransitioning && styles.transitioningSegment
            ]}
            onLayout={(e: LayoutChangeEvent) => setTimerSectionHeight(e.nativeEvent.layout.height)}
          >
            {/* Segment countdown timer (counts down) */}
            <Text style={styles.cardLabel}>Current Segment</Text>
            {currentSegment && (
              <View style={[styles.paceBadge, { backgroundColor: PACE_COLORS[currentSegment.type as PaceType] }]}>
                <Text style={styles.paceBadgeText}>{currentSegment.type.charAt(0).toUpperCase() + currentSegment.type.slice(1)} Pace</Text>
              </View>
            )}
            <Text style={styles.segmentTime} testID="segment-countdown">{formatCountdownTime(segmentTimeRemaining)}</Text>
            <View style={styles.segmentInfoRow}>
              {currentSegment && (
                <Text style={styles.inclineInfo}>Incline: {currentSegment.incline}%</Text>
              )}
            </View>

            {/* Weight prompt for premium users without weight */}
            {isPremium && !hasWeight && (
              <TouchableOpacity 
                style={styles.weightPromptBanner}
                onPress={() => {
                  if (isRunning) {
                    dispatch(pauseWorkoutAction());
                  }
                  navigation.navigate('Settings');
                }}
              >
                <Ionicons name="information-circle" size={16} color={COLORS.white} style={styles.weightPromptIcon} />
                <Text style={styles.weightPromptText}>Set weight in Settings to track calories</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Split Info Cards */}
          <View style={styles.splitCardsContainer}>
            {/* Workout Progress Card with Circular Progress */}
            {/* <View style={styles.workoutProgressCard}>
              <Text style={styles.cardLabel}>Total</Text>
              <CircularProgress 
                progress={progressPercentage}
                size={80}
                strokeWidth={8}
                elapsedTime={elapsedTime}
                totalDuration={totalDuration}
              />
            </View> */}
            
            {/* Next Segment Info with Static Value */}
            <View style={[styles.nextSegment, styles.noBottomMargin]}>
              <Text style={styles.nextLabel}>Next:</Text>
              <View style={styles.nextInfo}>
                {nextSegment ? (
                  <>
                    <View style={[styles.nextPaceBadge, { backgroundColor: PACE_COLORS[nextSegment.type as PaceType] }]}>
                    <Text style={[styles.nextPaceBadgeText]}>
                      {nextSegment.type.charAt(0).toUpperCase() + nextSegment.type.slice(1)} Pace
                    </Text>
                    </View>
                    <Text style={styles.nextTime}>
                      {formatSegmentDuration(nextSegment.duration)}
                    </Text>
                    <Text style={styles.nextInclineInfo}>{nextSegment.incline}%</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.finishFlag}>🏁</Text>
                    <Text style={styles.nextPace}>
                      Last Segment
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Timeline */}
          <View style={[styles.timelineContainerNoGap, { maxHeight: '45%' }]}>
            <Text style={styles.timelineTitle}>Workout Timeline</Text>

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

            {/* Use the shared WorkoutVisualization component with dynamic height */}
            <View 
              style={[
                styles.visualizationWrapper,
                { height: visualizationHeight, maxHeight: '100%' }
              ]}
            >
              <WorkoutVisualization 
                segments={activeWorkout.segments} 
                currentSegmentIndex={currentSegmentIndex}
                progressIndicatorPosition={Math.min((elapsedTime / totalDuration) * 100, 99.9)}
                minutePerBar={false}
                maxBars={40}
                containerHeight={visualizationHeight - 100} 
                connectingLineOffset={10} 
                showOverlay={true} 
                showTimeLabels={true} 
                showTicks={true}
              />
            </View>
          </View>

          {/* Calories counter - only shown if user weight is provided */}
          {isPremium && hasWeight && (
            <View style={styles.caloriesContainer}>
              <View style={styles.caloriesBadge}>
                <Text style={styles.caloriesText}>
                  Calories: <Text style={styles.caloriesValue}>{Math.round(caloriesBurned)}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Control Buttons */}
          <View 
            style={styles.controlButtonsContainer}
            onLayout={(e: LayoutChangeEvent) => setControlsSectionHeight(e.nativeEvent.layout.height)}
          >
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
              {__DEV__ && (
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    styles.devButton
                  ]} 
                  onPress={handleDevCompleteWorkout}
                >
                  <Text style={[
                    styles.buttonText,
                  ]}>Dev Complete</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={[
                styles.endButton, 
                !hasStarted && styles.startButton
              ]} 
              onPress={hasStarted ? handleEndWorkout : handleStartWorkout}
            >
              <Text style={[
                styles.endButtonText,
                !hasStarted && styles.startButtonText
              ]}>
                {hasStarted ? "Quit Workout" : "Start Workout"}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity 
              style={[
                styles.startButton
              ]} 
              onPress={async () => {
                try {
                  // Set audio mode for proper ducking
                  await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
                  });
            
                  // Wait 10 seconds
                  await new Promise(resolve => setTimeout(resolve, 10000));
            
                  // Create and play the sound
                  const { sound } = await Audio.Sound.createAsync(
                    require('./../assets/audio/baby-steps-segment-0.aac'),
                    { shouldPlay: true }
                  );
                  
                  await sound.playAsync();
                  
                  // Unload sound when done
                  sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
                    if (status.isLoaded && status.didJustFinish) {
                      await sound.unloadAsync();
                    }
                  });
            
                } catch (error) {
                  Alert.alert('Error', 'Failed to play audio');
                  console.error('Audio test error:', error);
                } finally {
                  
                }
              }}
            >
              <Text style={[
                styles.startButtonText
              ]}>
                TEST
              </Text>
            </TouchableOpacity> */}

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
                <View style={[styles.progressBar, { width: `${Math.min(100, (elapsedTime / totalDuration) * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>{formatTime(totalDuration)}</Text>
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
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingBottom: 150,
  },
  currentSegment: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    textAlign: 'center',
  },
  transitioningSegment: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  segmentTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
    margin: 2,
  },
  paceBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 5,
  },
  paceBadgeText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  inclineInfo: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    // marginTop: 5,
  },
  splitCardsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  workoutProgressCard: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  nextSegment: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  nextLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.white,
    marginRight: 10,
    fontWeight: 'bold',
  },
  nextInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nextTime: {
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 15,
  },
  nextInclineInfo: {
    fontSize: FONT_SIZES.small,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 15,
  },
  nextTimeRemaining: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  nextPace: {
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
  },
  nextPaceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextPaceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  nextPaceBadgeText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 12,
  },
  noBottomMargin: {
    marginBottom: 0,
  },
  finishFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  timelineContainerNoGap: {
    marginTop: 0,
    paddingTop: 10,
    flex: 1,
    justifyContent: 'flex-start',
    marginBottom: 20,
    maxHeight: '45%',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.white,
    opacity: 0.9,
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  visualizationWrapper: {
    width: '100%',
    marginVertical: 10,
    minHeight: 120,
    maxHeight: '100%',
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: 16,
    paddingBottom: 40,
  },
  controlButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.black,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkGray,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  controlButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  pauseButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  pauseButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: COLORS.mediumGray,
  },
  endButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)', 
    borderRadius: 25, 
    padding: 15, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)', 
    marginTop: 10, 
  },
  startButton: {
    backgroundColor: 'green', 
    // backgroundColor: 'rgba(76, 187, 23, 0.15)', 
    borderColor: 'rgba(0, 200, 83, 0.3)', 
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: COLORS.mediumGray,
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
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  progressTime: {
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  totalTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.5,
  },
  cardLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.white,
    opacity: 0.7,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  segmentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.small,
  },
  caloriesInfo: {
    fontSize: FONT_SIZES.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  weightPromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.small,
    borderRadius: 20,
    marginTop: SPACING.small,
    alignSelf: 'center',
  },
  weightPromptIcon: {
    marginRight: SPACING.xs,
  },
  weightPromptText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
  },
  devButton: {
    backgroundColor: 'blue',
  },
  caloriesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    paddingVertical: 5,
    width: '100%',
  },
  caloriesBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  caloriesText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.lightGray,
    fontWeight: '500',
  },
  caloriesValue: {
    fontSize: FONT_SIZES.small,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default WorkoutInProgressScreen;