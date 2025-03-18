import { Audio, InterruptionModeAndroid, InterruptionModeIOS, AVPlaybackStatus } from 'expo-av';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRef, useEffect } from 'react';
import { WorkoutSegment, WorkoutProgram } from '../types/index';
import { loadSegmentAudio } from '../utils/audioMapping';

interface UseWorkoutAudioOptions {
  workout: WorkoutProgram | null;
  isRunning: boolean;
  currentSegmentIndex: number;
  segmentElapsedTime: number;
  isSkipping: boolean;
  isCompleted: boolean;
  enableAudioCues: boolean;
}

/**
 * Custom hook to handle workout audio cues
 * This is a simplified v1 implementation that only plays the countdown sound
 */
export const useWorkoutAudio = (options: UseWorkoutAudioOptions) => {
  const { 
    workout,
    isRunning, 
    currentSegmentIndex, 
    segmentElapsedTime,
    isSkipping,
    isCompleted,
    enableAudioCues
  } = options;
  
  const segments = workout?.segments || [];
  
  const countdownSoundRef = useRef<Audio.Sound | null>(null);
  const segmentAudioRef = useRef<Audio.Sound | null>(null);
  const countdownPlayingRef = useRef<boolean>(false);
  const segmentAudioPlayingRef = useRef<boolean>(false);
  const audioInitializedRef = useRef<boolean>(false);
  const lastSegmentAudioTriggeredRef = useRef<number>(-1); // Track which segment audio was last triggered
  const lastSegmentTimeRef = useRef<number>(0); // Track the last time we checked for segment audio
  const countdownTriggeredRef = useRef<boolean>(false); // Track if countdown has been triggered for the current segment
  
  // Handle segment transitions and audio cues
  useEffect(() => {
    if (!isRunning || !enableAudioCues) {
      return;
    }
    
    // Only check the current segment
    if (currentSegmentIndex < segments.length - 1) {
      const currentSegment = segments[currentSegmentIndex];
      const nextSegment = segments[currentSegmentIndex + 1];
      const timeUntilNextSegment = currentSegment.duration - segmentElapsedTime;
      
      // Debounce check - only check if we've moved at least 0.1 seconds since last check
      if (Math.abs(timeUntilNextSegment - lastSegmentTimeRef.current) < 0.1) {
        return;
      }
      
      // Update last check time
      lastSegmentTimeRef.current = timeUntilNextSegment;
      
      // Get the duration of the next segment's audio (if available)
      const segmentAudioDuration = nextSegment.audio?.duration || 0;
      // Duration of countdown sound (approximately 3 seconds)
      const countdownDuration = 3;
      // Buffer time between voice audio and countdown (0.5 seconds)
      const bufferTime = 0.5;
      
      // Calculate when to start the segment audio based on its duration
      // We want to ensure it finishes with enough time for the countdown to play
      const segmentAudioStartTime = segmentAudioDuration + countdownDuration + bufferTime;
      
      // Calculate when to start the countdown
      const countdownStartTime = countdownDuration + 0.5; // Add a small buffer for countdown
      
      // Check for segment audio first (dynamic timing based on audio duration)
      // Only trigger if we haven't already played audio for this segment
      if (timeUntilNextSegment <= segmentAudioStartTime && 
          timeUntilNextSegment >= segmentAudioStartTime - 1 && 
          !segmentAudioPlayingRef.current && 
          !countdownPlayingRef.current &&
          lastSegmentAudioTriggeredRef.current !== currentSegmentIndex) {
        
        // Play the segment audio if available
        const playSegmentAudio = async () => {
          try {
            // Check if the next segment has audio
            if (nextSegment.audio?.file) {
              // Clean up previous segment audio if any
              if (segmentAudioRef.current) {
                await segmentAudioRef.current.unloadAsync();
                segmentAudioRef.current = null;
              }
              
              // Set the flag before attempting to load
              segmentAudioPlayingRef.current = true;
              // Mark this segment as triggered
              lastSegmentAudioTriggeredRef.current = currentSegmentIndex;
              
              // Load the segment audio using our utility function
              const segmentSound = await loadSegmentAudio(nextSegment.audio.file);
              
              if (segmentSound) {
                // Set up status monitoring to play countdown after segment audio finishes
                segmentSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                  if (!status.isLoaded) return;
                  
                  if (status.didJustFinish) {
                    // Segment audio finished, reset the flag
                    segmentAudioPlayingRef.current = false;
                    segmentSound?.unloadAsync().catch(() => {});
                    segmentAudioRef.current = null;
                    
                    // Check if we should play the countdown immediately after segment audio finishes
                    if (!countdownTriggeredRef.current) {
                      const currentTimeUntilNextSegment = currentSegment.duration - segmentElapsedTime;
                      
                      // If we're in the countdown window or past it, play countdown immediately
                      if (currentTimeUntilNextSegment <= 4) {
                        countdownTriggeredRef.current = true;
                        playCountdown();
                      }
                    }
                  }
                });
                
                segmentAudioRef.current = segmentSound;
                await segmentSound.playAsync();
              } else {
                // Reset flag if we couldn't load the sound
                segmentAudioPlayingRef.current = false;
              }
            } else {
              // No audio for this segment
              segmentAudioPlayingRef.current = false;
            }
          } catch (error) {
            // Reset flag on error
            segmentAudioPlayingRef.current = false;
          }
        };
        
        // Start the segment audio playback
        playSegmentAudio();
      }
      
      // Play countdown when approaching segment transition (dynamic timing based on countdown duration)
      // ALWAYS play countdown when in the right time window, even if segment audio is playing
      if (timeUntilNextSegment <= countdownStartTime && 
          timeUntilNextSegment >= countdownStartTime - 0.5 && 
          !countdownPlayingRef.current && 
          !countdownTriggeredRef.current) {
        
        countdownTriggeredRef.current = true;
        playCountdown();
      }
      
      // Failsafe: If we're getting very close to transition and countdown hasn't played yet,
      // force it to play regardless of other conditions
      if (timeUntilNextSegment <= 1.5 && 
          timeUntilNextSegment >= 0.5 && 
          !countdownPlayingRef.current && 
          !countdownTriggeredRef.current) {
        
        // Force stop any segment audio that might be playing
        if (segmentAudioRef.current) {
          try {
            segmentAudioRef.current.stopAsync().catch(() => {});
            segmentAudioRef.current.unloadAsync().catch(() => {});
            segmentAudioRef.current = null;
          } catch (e) {
            // Ignore errors
          }
          segmentAudioPlayingRef.current = false;
        }
        
        countdownTriggeredRef.current = true;
        playCountdown();
      }
    }
  }, [isRunning, enableAudioCues, currentSegmentIndex, segmentElapsedTime, segments]);
  
  // Reset flags when segment changes
  useEffect(() => {
    // Don't immediately reset flags and unload sounds when segment changes
    // This allows any currently playing sounds to finish
    setTimeout(() => {
      countdownPlayingRef.current = false;
      segmentAudioPlayingRef.current = false;
      countdownTriggeredRef.current = false;
      
      // Unload any existing sounds
      if (countdownSoundRef.current) {
        countdownSoundRef.current.unloadAsync().catch(() => {});
      }
      
      if (segmentAudioRef.current) {
        segmentAudioRef.current.unloadAsync().catch(() => {});
        segmentAudioRef.current = null;
      }
    }, 2000); // Wait 2 seconds before cleaning up to ensure sounds finish playing
  }, [currentSegmentIndex]);
  
  // Function to play countdown sound
  const playCountdown = async () => {
    try {
      // Don't play if already playing
      if (countdownPlayingRef.current) {
        return;
      }
      
      // Set flag before attempting to play
      countdownPlayingRef.current = true;
      
      // Unload any existing sound to ensure a fresh start
      if (countdownSoundRef.current) {
        try {
          await countdownSoundRef.current.unloadAsync();
        } catch (e) {
          // Handle error silently
        }
        countdownSoundRef.current = null;
      }
      
      const sound = new Audio.Sound();
      
      try {
        await sound.loadAsync(require('../assets/audio/countdown.aac'));
        countdownSoundRef.current = sound;
        
        // Set up status monitoring
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          
          if (status.didJustFinish) {
            // Add a small delay before resetting the flag to ensure the sound completes
            setTimeout(() => {
              countdownPlayingRef.current = false;
            }, 500);
          }
        });
        
        // Play the sound with increased volume
        await sound.setVolumeAsync(1.0);  // Ensure full volume
        await sound.playAsync();
      } catch (loadError) {
        countdownPlayingRef.current = false;
        
        // Try alternate method as fallback
        try {
          const { sound: altSound } = await Audio.Sound.createAsync(
            require('../assets/audio/countdown.aac'),
            { shouldPlay: true, volume: 1.0 }
          );
          
          countdownSoundRef.current = altSound;
        } catch (altError) {
          countdownPlayingRef.current = false;
        }
      }
    } catch (innerError) {
      countdownPlayingRef.current = false;
    }
  };
  
  // Function to stop audio playback
  const stopAudio = async () => {
    if (countdownSoundRef.current) {
      try {
        await countdownSoundRef.current.stopAsync();
        await countdownSoundRef.current.unloadAsync();
        countdownSoundRef.current = null;
      } catch (e) {
        // Handle error silently
      }
    }
    
    if (segmentAudioRef.current) {
      try {
        await segmentAudioRef.current.stopAsync();
        await segmentAudioRef.current.unloadAsync();
        segmentAudioRef.current = null;
      } catch (e) {
        // Handle error silently
      }
    }
    
    // Reset playing flags
    countdownPlayingRef.current = false;
    segmentAudioPlayingRef.current = false;
    countdownTriggeredRef.current = false;
  };
  
  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (countdownSoundRef.current) {
        countdownSoundRef.current.unloadAsync();
        countdownSoundRef.current = null;
      }
      
      if (segmentAudioRef.current) {
        segmentAudioRef.current.unloadAsync();
        segmentAudioRef.current = null;
      }
    };
  }, []);
  
  // Initialize audio on mount
  useEffect(() => {
    const initializeAudio = async () => {
      if (audioInitializedRef.current) {
        return;
      }
      
      try {
        // Set audio mode for best compatibility
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false, // Prevent microphone permission prompt
        });
        
        try {
          const soundAsset = require('../assets/audio/countdown.aac');
          
          // Try to load the sound to verify it works
          const { sound } = await Audio.Sound.createAsync(soundAsset);
          await sound.unloadAsync();
          
          // Set audio as initialized
          audioInitializedRef.current = true;
        } catch (e) {
          Alert.alert(
            "Audio File Error",
            "Could not load countdown.aac file. Please check that the file exists in the assets/audio folder."
          );
        }
        
      } catch (error) {
        Alert.alert("Audio Error", "Failed to initialize audio system. Some workout cues may not play.");
      }
    };
    
    initializeAudio();
  }, []);
  
  // Function to pause audio playback
  const pauseAudio = async () => {
    if (countdownSoundRef.current) {
      try {
        await countdownSoundRef.current.pauseAsync();
      } catch (e) {
        // Handle error silently
      }
    }
    
    if (segmentAudioRef.current) {
      try {
        await segmentAudioRef.current.pauseAsync();
      } catch (e) {
        // Handle error silently
      }
    }
  };
  
  // Function to play a test countdown sound
  const playTestCountdown = async () => {
    try {
      // Ensure audio mode is set correctly for maximum compatibility
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false, // Prevent microphone permission prompt
      });
      
      // Unload any existing sound to prevent resource conflicts
      if (countdownSoundRef.current) {
        await countdownSoundRef.current.unloadAsync();
        countdownSoundRef.current = null;
      }
      
      // Function to try playing a remote sound as fallback
      const tryRemoteSound = async () => {
        try {
          // Try with a known working remote sound
          const { sound: remoteSound } = await Audio.Sound.createAsync(
            { uri: 'https://docs.expo.dev/static/examples/t-rex-roar.mp3' },
            { shouldPlay: true, volume: 1.0, progressUpdateIntervalMillis: 100 }
          );
          
          // Set up status monitoring
          remoteSound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) {
              return;
            }
            
            if (status.didJustFinish) {
              // Unload the sound when done
              remoteSound.unloadAsync().catch(e => {
                // Handle error silently
              });
            }
          });
          
          // Store reference
          countdownSoundRef.current = remoteSound;
          
          // Alert for remote sound
          Alert.alert(
            "Remote Audio Test",
            "A dinosaur roar sound should be playing from the internet. Can you hear it?",
            [
              { text: "Yes, I hear it", onPress: () => {} },
              { text: "No, I don't hear anything", onPress: () => {} }
            ]
          );
        } catch (remoteError) {
          Alert.alert("Audio Error", "Failed to play any sound. Please check your device settings and ensure audio is enabled.");
        }
      };
      
      // Try with a known working sound first
      try {
        // Play the AAC sound file instead of MP3
        const { sound: beepSound } = await Audio.Sound.createAsync(
          require('../assets/audio/countdown.aac'),
          { shouldPlay: true, volume: 1.0, progressUpdateIntervalMillis: 100 }
        );
        
        // Set up status monitoring
        beepSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            return;
          }
          
          if (status.didJustFinish) {
            // Unload the sound when done
            beepSound.unloadAsync().catch(e => {
              // Handle error silently
            });
          }
        });
        
        // Store reference
        countdownSoundRef.current = beepSound;
        
        // Alert for beep sound
        Alert.alert(
          "Audio Test",
          "A beep sound (AAC format) should be playing now. Can you hear it?",
          [
            { text: "Yes, I hear it", onPress: () => {} },
            { text: "No, I don't hear anything", onPress: () => {
              // Try fallback to remote sound
              tryRemoteSound();
            }}
          ]
        );
      } catch (aacError) {
        // Try fallback to remote sound
        tryRemoteSound();
      }
      
    } catch (e) {
      Alert.alert("Audio Error", "Failed to set up audio: " + (e instanceof Error ? e.message : String(e)));
    }
  };
  
  return {
    pauseAudio,
    stopAudio,
    playTestCountdown,
  };
};

export default useWorkoutAudio;