import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const AUDIO_CACHE_DIR = `${FileSystem.cacheDirectory}audio/`;
const AUDIO_CACHE_METADATA_KEY = 'AUDIO_CACHE_METADATA';

// Types
interface AudioCacheMetadata {
  [filename: string]: {
    url: string;
    cachedAt: number;
    lastUsed: number;
  };
}

/**
 * Initialize the audio cache directory
 */
export const initAudioCache = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_CACHE_DIR, { intermediates: true });
    }
    
    // Initialize metadata if it doesn't exist
    const metadata = await getAudioCacheMetadata();
    if (!metadata) {
      await saveAudioCacheMetadata({});
    }
  } catch (error) {
    console.error('Error initializing audio cache:', error);
  }
};

/**
 * Get the local URI for a cached audio file
 */
export const getCachedFileUri = (filename: string): string => {
  return `${AUDIO_CACHE_DIR}${filename}`;
};

/**
 * Check if an audio file exists in the cache
 */
export const isAudioCached = async (filename: string): Promise<boolean> => {
  try {
    const fileUri = getCachedFileUri(filename);
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (fileInfo.exists) {
      // Get metadata to check if URL has changed
      const metadataString = await AsyncStorage.getItem(AUDIO_CACHE_METADATA_KEY);
      if (metadataString) {
        const metadata: AudioCacheMetadata = JSON.parse(metadataString);
        const entry = metadata[filename];
        
        // If we don't have metadata for this file, consider it not cached
        if (!entry) {
          console.log(`[AUDIO] File exists but no metadata found for ${filename}, considering not cached`);
          return false;
        }
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[AUDIO] Error checking if audio is cached for ${filename}:`, error);
    return false;
  }
};

/**
 * Get audio cache metadata from AsyncStorage
 */
export const getAudioCacheMetadata = async (): Promise<AudioCacheMetadata | null> => {
  try {
    const metadataJson = await AsyncStorage.getItem(AUDIO_CACHE_METADATA_KEY);
    return metadataJson ? JSON.parse(metadataJson) : null;
  } catch (error) {
    console.error('Error getting audio cache metadata:', error);
    return null;
  }
};

/**
 * Save audio cache metadata to AsyncStorage
 */
export const saveAudioCacheMetadata = async (metadata: AudioCacheMetadata): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUDIO_CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('Error saving audio cache metadata:', error);
  }
};

/**
 * Update audio cache metadata to track usage and URL changes
 */
export const updateAudioCacheMetadata = async (
  filename: string,
  url: string
): Promise<void> => {
  try {
    // Get existing metadata
    const metadataString = await AsyncStorage.getItem(AUDIO_CACHE_METADATA_KEY);
    const metadata: AudioCacheMetadata = metadataString
      ? JSON.parse(metadataString)
      : {};
    
    // Check if the URL has changed for this file
    const existingEntry = metadata[filename];
    const urlChanged = existingEntry && existingEntry.url !== url;
    
    if (urlChanged) {
      console.log(`[AUDIO] URL changed for ${filename}, invalidating cache`);
      // Delete the cached file if URL has changed
      try {
        const fileUri = getCachedFileUri(filename);
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (deleteError) {
        console.error(`[AUDIO] Error deleting cached file ${filename}:`, deleteError);
      }
    }
    
    // Update metadata
    metadata[filename] = {
      url: url,
      cachedAt: existingEntry?.cachedAt || Date.now(),
      lastUsed: existingEntry?.lastUsed || Date.now()
    };
    
    // Save updated metadata
    await saveAudioCacheMetadata(metadata);
  } catch (error) {
    console.error(`[AUDIO] Error updating audio cache metadata for ${filename}:`, error);
  }
};

/**
 * Download and cache an audio file
 */
export const cacheAudioFile = async (
  url: string,
  filename: string
): Promise<string | null> => {
  try {
    // Ensure cache directory exists
    await initAudioCache();
    
    // Get local file URI
    const localUri = getCachedFileUri(filename);
    
    // Check if already cached
    const isCached = await isAudioCached(filename);
    if (isCached) {
      // Update metadata to reflect it's still needed
      await updateAudioCacheMetadata(filename, url);
      console.log(`[AUDIO] Using cached audio file: ${filename}`);
      return localUri;
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log(`[AUDIO] No network connection to download audio file: ${filename}`);
      return null;
    }
    
    console.log(`[AUDIO] Downloading audio file from URL: ${url}`);
    
    // Validate URL format
    if (!url || !url.startsWith('http')) {
      console.error(`[AUDIO] Invalid audio URL format: ${url}`);
      return null;
    }
    
    // Download the file
    try {
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      
      if (downloadResult.status !== 200) {
        console.error(`[AUDIO] Failed to download audio file: ${filename}, status: ${downloadResult.status}`);
        return null;
      }
      
      console.log(`[AUDIO] Successfully downloaded audio file: ${filename}`);
      
      // Update metadata
      await updateAudioCacheMetadata(filename, url);
      
      return localUri;
    } catch (downloadError) {
      console.error(`[AUDIO] Error during download for ${filename}:`, downloadError);
      return null;
    }
  } catch (error) {
    console.error(`[AUDIO] Error caching audio file ${filename}:`, error);
    return null;
  }
};

/**
 * Load an audio file from cache or download if not cached
 */
export const loadCachedAudio = async (
  url: string,
  filename: string
): Promise<Audio.Sound | null> => {
  try {
    // Try to get from cache first
    const isCached = await isAudioCached(filename);
    let localUri: string | null = null;
    
    if (isCached) {
      localUri = getCachedFileUri(filename);
      // Update metadata to reflect usage
      await updateAudioCacheMetadata(filename, url);
    } else {
      // Not cached, try to download
      localUri = await cacheAudioFile(url, filename);
    }
    
    // If we have a local URI, load the sound
    if (localUri) {
      const { sound } = await Audio.Sound.createAsync({ uri: localUri });
      return sound;
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading cached audio ${filename}:`, error);
    return null;
  }
};

/**
 * Queue background downloads for multiple audio files
 */
export const queueAudioDownloads = async (
  audioFiles: Array<{ url: string; filename: string }>
): Promise<void> => {
  try {
    // Initialize cache
    await initAudioCache();
    
    console.log(`[AUDIO] Starting queue of ${audioFiles.length} audio downloads`);
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('[AUDIO] No network connection for background audio downloads');
      return;
    }
    
    // Log all files being queued
    audioFiles.forEach(({ url, filename }, index) => {
      console.log(`[AUDIO] Queuing file ${index}: ${filename} from URL: ${url}`);
    });
    
    // Queue downloads (don't await to allow background processing)
    audioFiles.forEach(async ({ url, filename }, index) => {
      try {
        console.log(`[AUDIO] Checking if ${filename} is already cached`);
        const isCached = await isAudioCached(filename);
        
        if (!isCached) {
          console.log(`[AUDIO] File ${filename} not cached, starting download`);
          
          // Validate URL format
          if (!url || !url.startsWith('http')) {
            console.error(`[AUDIO] Invalid audio URL format: ${url}`);
            return;
          }
          
          cacheAudioFile(url, filename)
            .then(uri => {
              if (uri) {
                console.log(`[AUDIO] Background download complete: ${filename}`);
              } else {
                console.log(`[AUDIO] Background download failed (null URI): ${filename}`);
              }
            })
            .catch(error => {
              console.error(`[AUDIO] Background download failed for ${filename}:`, error);
            });
        } else {
          console.log(`[AUDIO] File ${filename} already cached, skipping download`);
        }
      } catch (error) {
        console.error(`[AUDIO] Error processing file ${filename}:`, error);
      }
    });
  } catch (error) {
    console.error('[AUDIO] Error queuing audio downloads:', error);
  }
};

/**
 * Clean up unused audio files to free up space
 * This removes files that haven't been used in the specified number of days
 */
export const cleanupAudioCache = async (unusedDays: number = 30): Promise<void> => {
  try {
    const metadata = await getAudioCacheMetadata();
    if (!metadata) return;
    
    const now = Date.now();
    const unusedThreshold = now - (unusedDays * 24 * 60 * 60 * 1000);
    const updatedMetadata = { ...metadata };
    
    // Check each file in metadata
    for (const [filename, info] of Object.entries(metadata)) {
      if (info.lastUsed < unusedThreshold) {
        // File hasn't been used recently, delete it
        const fileUri = getCachedFileUri(filename);
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          delete updatedMetadata[filename];
        } catch (error) {
          console.error(`Error deleting unused audio file ${filename}:`, error);
        }
      }
    }
    
    // Save updated metadata
    await saveAudioCacheMetadata(updatedMetadata);
  } catch (error) {
    console.error('Error cleaning up audio cache:', error);
  }
};
