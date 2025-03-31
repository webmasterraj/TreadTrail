import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { queueAudioDownloads, initAudioCache, getCachedFileUri, isAudioCached, updateAudioCacheMetadata } from './audioCaching';
import { WorkoutProgram, WorkoutSegment } from '../types';

// Bundled countdown sound
const COUNTDOWN_SOUND = require('../assets/audio/countdown.aac');

// Debug flags
const DEBUG_AUDIO_UTILS = false;

// Debug logging helper
const logDebug = (message: string, ...args: any[]) => {
  if (DEBUG_AUDIO_UTILS) console.log(`[DEBUG-AUDIO-UTILS] ${message}`, ...args);
};

/**
 * Initialize the audio system
 */
export const initializeAudioSystem = async (): Promise<void> => {
  try {
    logDebug('Initializing audio system');
    
    // Set up audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    logDebug('Audio mode set successfully');
    
    // Initialize audio cache
    await initAudioCache();
    logDebug('Audio cache initialized');
  } catch (error) {
    console.error('Error initializing audio system:', error);
  }
};

/**
 * Load the countdown sound that's bundled with the app
 */
export const loadCountdownSound = async (): Promise<Audio.Sound> => {
  const sound = new Audio.Sound();
  await sound.loadAsync(COUNTDOWN_SOUND);
  return sound;
};

/**
 * Generate a filename for local caching based on the audio URL
 * @param audioUrl The full audio URL from the backend
 */
export const getAudioFilenameFromUrl = (url: string): string => {
  // Extract the filename from the URL
  const parts = url.split('/');
  return parts[parts.length - 1];
};

/**
 * Load a segment audio file from cache or download from the provided URL
 * @param segment The workout segment containing the audio file URL
 */
export const loadSegmentAudio = async (
  segment: WorkoutSegment
): Promise<Audio.Sound | null> => {
  try {    
    // Check if segment has audio
    if (!segment.audio || !segment.audio.file) {
      logDebug(`No audio file URL provided for segment`);
      return null;
    }
    
    const audioUrl = segment.audio.file;
    
    // Extract filename from URL
    const filename = getAudioFilenameFromUrl(audioUrl);
    
    // Check if audio is cached
    const fileUri = getCachedFileUri(filename);
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    // If file is cached, load from cache
    if (fileInfo.exists) {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: fileInfo.uri });
      return sound;
    }
    
    // If not cached, download and cache
    const downloadResult = await FileSystem.downloadAsync(
      audioUrl,
      fileUri
    );
    
    // Load the downloaded file
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri: downloadResult.uri });
    return sound;
  } catch (error) {
    console.error(`Error loading segment audio:`, error);
    return null;
  }
};

/**
 * Queue background downloads for all audio files in a workout
 * @param workout The workout program
 */
export const queueWorkoutAudioDownloads = async (workout: WorkoutProgram): Promise<void> => {
  if (!workout || !workout.segments) return;
  
  logDebug(`Queueing audio downloads for workout: ${workout.name}, segments: ${workout.segments.length}`);
  
  // Log all segments to debug
  workout.segments.forEach((segment, index) => {
    logDebug(`Segment ${index} type: ${segment.type}, audio:`, JSON.stringify(segment.audio, null, 2));
  });
  
  const audioFiles = workout.segments
    .map((segment) => {
      if (segment.audio && segment.audio.file) {
        const audioUrl = segment.audio.file;
        logDebug(`Found audio URL for segment: ${audioUrl}`);
        const filename = getAudioFilenameFromUrl(audioUrl);
        return {
          url: audioUrl,
          filename: filename
        };
      } else {
        logDebug(`No audio file for segment type: ${segment.type}`);
      }
      return null;
    })
    .filter(item => item !== null) as Array<{ url: string; filename: string }>;
  
  if (audioFiles.length > 0) {
    logDebug(`Queueing ${audioFiles.length} audio files for download`);
    await queueAudioDownloads(audioFiles);
  } else {
    logDebug('No audio files to download for this workout');
  }
};

/**
 * Pre-fetch audio files for all workout programs in the background
 * This improves user experience by ensuring audio is ready when a workout is started
 * @param workoutPrograms Array of workout programs to pre-fetch audio for
 */
export const preFetchWorkoutAudio = async (
  workoutPrograms: WorkoutProgram[]
): Promise<void> => {
  try {
    logDebug(`Starting background pre-fetch for ${workoutPrograms.length} workout programs`);
    
    // Create a queue of audio files to download
    const audioFilesToCheck: Array<{ url: string, filename: string }> = [];
    
    // Collect all unique audio URLs from all workout programs
    workoutPrograms.forEach(workout => {
      if (workout.segments) {
        workout.segments.forEach(segment => {
          if (segment.audio && segment.audio.file) {
            const audioUrl = segment.audio.file;
            const filename = getAudioFilenameFromUrl(audioUrl);
            
            // Add to check queue if not already included
            if (!audioFilesToCheck.find(item => item.url === audioUrl)) {
              audioFilesToCheck.push({ url: audioUrl, filename });
            }
          }
        });
      }
    });
    
    logDebug(`Found ${audioFilesToCheck.length} unique audio files to check for pre-fetch`);
    
    // Check which files need to be downloaded
    const filesToDownload: Array<{ url: string, filename: string }> = [];
    
    for (const audioFile of audioFilesToCheck) {
      const isCached = await isAudioCached(audioFile.filename);
      if (!isCached) {
        filesToDownload.push(audioFile);
      }
    }
    
    logDebug(`${filesToDownload.length} audio files need downloading, ${audioFilesToCheck.length - filesToDownload.length} already cached`);
    
    // If no files need downloading, we're done
    if (filesToDownload.length === 0) {
      logDebug('All audio files already cached, skipping downloads');
      return;
    }
    
    // Process downloads in the background
    let downloadedCount = 0;
    let errorCount = 0;
    
    // Use Promise.all to track overall progress
    await Promise.all(filesToDownload.map(async (audioFile) => {
      try {
        const fileUri = getCachedFileUri(audioFile.filename);
        
        await FileSystem.downloadAsync(audioFile.url, fileUri);
        // Update metadata to track this file
        await updateAudioCacheMetadata(audioFile.filename, audioFile.url);
        downloadedCount++;        
      } catch (error) {
        // Don't throw errors for background downloads, just count them
        errorCount++;
      }
    }));
    
    logDebug(`Pre-fetch complete: ${downloadedCount} files downloaded, ${errorCount} errors`);
  } catch (error) {
    console.warn('Error in pre-fetch process:', error);
    // Don't throw the error since this is a background operation
  }
};
