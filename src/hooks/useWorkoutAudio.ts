import { useRef, useEffect } from 'react';
import { WorkoutSegment } from '../types';
import { Platform } from 'react-native';

// Import expo-av directly
import { Audio } from 'expo-av';

interface UseWorkoutAudioOptions {
  isRunning: boolean;
  enableAudioCues: boolean;
  currentSegmentIndex: number;
  segmentElapsedTime: number;
  segments: WorkoutSegment[];
}

/**
 * Custom hook to handle workout audio cues
 * This is a simplified v1 implementation that only plays the countdown sound
 */
export const useWorkoutAudio = (options: UseWorkoutAudioOptions) => {
  const { 
    isRunning, 
    enableAudioCues, 
    currentSegmentIndex, 
    segmentElapsedTime, 
    segments 
  } = options;
  
  const countdownSoundRef = useRef<any>(null);
  const countdownPlayingRef = useRef<boolean>(false);
  
  // Handle segment transitions and audio cues
  useEffect(() => {
    // Default enableAudioCues to true if it's undefined
    const audioEnabled = enableAudioCues !== false;
    
    if (!isRunning || !audioEnabled) {
      console.log(`[Audio] Not running or audio cues disabled, skipping check (isRunning: ${isRunning}, audioEnabled: ${audioEnabled})`);
      return;
    }
    
    // Only check the current segment
    if (currentSegmentIndex < segments.length - 1) {
      const currentSegment = segments[currentSegmentIndex];
      const nextSegment = segments[currentSegmentIndex + 1];
      const timeUntilNextSegment = currentSegment.duration - segmentElapsedTime;
      
      console.log(
        `[Audio] Current segment ${currentSegmentIndex} (${currentSegment.type}), ` +
        `time remaining: ${timeUntilNextSegment.toFixed(1)}s, ` +
        `next segment: ${currentSegmentIndex + 1} (${nextSegment.type})`
      );
      
      // Debug audio metadata if present
      if (nextSegment.audio) {
        console.log(
          `[Audio] Next segment has audio: ${nextSegment.audio.file}, ` +
          `duration: ${nextSegment.audio.duration}s`
        );
      }
      
      // Play countdown when within 3 seconds of segment change
      if (timeUntilNextSegment <= 3 && timeUntilNextSegment > 2 && !countdownPlayingRef.current) {
        console.log(
          `[Audio] 🔊 PLAYING COUNTDOWN - exactly ${timeUntilNextSegment.toFixed(1)} seconds ` +
          `before transition to segment ${currentSegmentIndex + 1}`
        );
        
        try {
          console.log("[Audio] Playing countdown sound");
          
          // Mark as playing
          countdownPlayingRef.current = true;
          
          // Use an async function to properly handle await
          const playCountdown = async () => {
            try {
              // Use the pre-loaded sound or create one if it doesn't exist
              if (!countdownSoundRef.current) {
                console.log("[Audio] Creating new sound instance");
                const sound = new Audio.Sound();
                await sound.loadAsync(require('../assets/audio/countdown.mp3'));
                countdownSoundRef.current = sound;
              } else {
                // Ensure the sound is positioned at the beginning
                console.log("[Audio] Using pre-loaded sound");
                await countdownSoundRef.current.setPositionAsync(0);
              }
              
              // Set up a listener to mark when playback finishes
              countdownSoundRef.current.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                  console.log("[Audio] Countdown playback finished");
                  countdownPlayingRef.current = false;
                }
              });
              
              // Start playing
              console.log("[Audio] Starting playback");
              await countdownSoundRef.current.playAsync();
              console.log("[Audio] Playback started successfully");
            } catch (innerError) {
              console.error("[Audio] ❌ Error during playback:", innerError);
              countdownPlayingRef.current = false;
            }
          };
          
          // Start the playback
          playCountdown();
          
        } catch (error) {
          console.error("[Audio] ❌ Error playing countdown:", error);
          countdownPlayingRef.current = false;
        }
      } else if (timeUntilNextSegment <= 3) {
        console.log(
          `[Audio] Within countdown window (${timeUntilNextSegment.toFixed(1)}s) ` +
          `but ${countdownPlayingRef.current ? 'already playing' : 'outside 2-3s range'}`
        );
      }
    } else {
      console.log("[Audio] On last segment, no countdown needed");
    }
  }, [segments, segmentElapsedTime, currentSegmentIndex, isRunning, enableAudioCues]);
  
  // Initialize audio system when component mounts
  useEffect(() => {
    console.log("[Audio] Initializing workout audio hook");
    
    // Initialize Audio system - based on Stack Overflow solution
    const initializeAudio = () => {
      console.log("[Audio] Starting audio initialization");
      
      // We need to use this pattern to handle async code in useEffect
      const setupAudio = async () => {
        try {
          console.log("[Audio] Setting audio mode");
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            shouldDuckAndroid: true,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            playThroughEarpieceAndroid: false
          });
          console.log("[Audio] Audio mode set successfully");
          
          // Pre-load the countdown sound for faster playback
          console.log("[Audio] Pre-loading countdown sound");
          const soundObject = new Audio.Sound();
          await soundObject.loadAsync(require('../assets/audio/countdown.mp3'));
          countdownSoundRef.current = soundObject;
          console.log("[Audio] Countdown sound pre-loaded successfully");
        } catch (error) {
          console.error("[Audio] ❌ Error initializing audio:", error);
        }
      };
      
      // Run the async setup
      setupAudio();
    };
    
    // Run the initialization
    initializeAudio();
    
    // Cleanup function
    return () => {
      console.log("[Audio] Cleaning up workout audio hook on unmount");
      // Make sure to completely unload the sound to free up resources
      if (countdownSoundRef.current) {
        console.log("[Audio] Unloading sound on unmount");
        // We need to handle async cleanup in a synchronous function
        const cleanup = async () => {
          try {
            await countdownSoundRef.current.unloadAsync();
            console.log("[Audio] Sound unloaded successfully");
          } catch (error) {
            console.error("[Audio] Error unloading sound:", error);
          }
        };
        
        // Start the cleanup process
        cleanup();
        
        // Reset the ref immediately
        countdownSoundRef.current = null;
      }
    };
  }, []);
  
  // Function to pause any playing audio
  const pauseAudio = () => {
    if (countdownSoundRef.current) {
      try {
        console.log("[Audio] Pausing countdown sound");
        countdownSoundRef.current.pauseAsync();
        countdownPlayingRef.current = false;
      } catch (e) {
        console.error("[Audio] ❌ Error pausing countdown sound:", e);
      }
    } else {
      console.log("[Audio] No sound to pause");
    }
  };
  
  // Function to stop and cleanup any playing audio
  const stopAudio = () => {
    if (countdownSoundRef.current) {
      try {
        console.log("[Audio] Stopping and cleaning up countdown sound");
        // Stop the sound (will be reused next time)
        countdownSoundRef.current.stopAsync()
          .then(() => {
            console.log("[Audio] Sound stopped successfully");
          })
          .catch(e => {
            console.error("[Audio] Error stopping sound:", e);
          });
        
        countdownPlayingRef.current = false;
      } catch (e) {
        console.error("[Audio] ❌ Error stopping countdown sound:", e);
      }
    } else {
      console.log("[Audio] No sound to stop");
    }
  };
  
  return {
    pauseAudio,
    stopAudio,
    isPlaying: countdownPlayingRef.current
  };
};

export default useWorkoutAudio;