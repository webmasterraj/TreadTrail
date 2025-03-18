#!/usr/bin/env ts-node

/**
 * Generate audio files for workout segments using ElevenLabs API.
 * 
 * This script reads the workout data directly from the TreadTrail app and generates
 * audio files for each segment that doesn't already have audio.
 * 
 * Usage:
 *   npx ts-node ./scripts/generate_workout_audio.ts
 * 
 * Options:
 *   --api-key KEY      ElevenLabs API key (required)
 *   --voice VOICE_ID   ElevenLabs voice ID to use (optional)
 *   --limit N          Limit the number of files to generate
 *   --remove           Remove audio files instead of generating them
 *   --segment ID       Specific segment to remove (e.g., "workout-1-segment-2")
 *   --fix              Review audio files and ensure they're in workoutData.ts and useWorkoutAudio.ts
 */

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { DEFAULT_WORKOUT_PROGRAMS } from '../src/constants/workoutData';
import { WorkoutProgram, WorkoutSegment, PaceType } from '../src/types';
import axios from 'axios';
import { getAudioDurationInSeconds } from 'get-audio-duration';

// Default ElevenLabs voice ID (Hope)
const API_KEY = "sk_80388a5a8a13b6a756df0ef81f9e2c2e740097d72b0d87b8";
const DEFAULT_VOICE_ID = "tnSpp4vdxKPjI9w0GnoV";

// Directory paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'src', 'assets', 'audio');
const WORKOUT_DATA_PATH = path.join(PROJECT_ROOT, 'src', 'constants', 'workoutData.ts');
const WORKOUT_AUDIO_PATH = path.join(PROJECT_ROOT, 'src', 'hooks', 'useWorkoutAudio.ts');

// Audio file extension
const AUDIO_EXT = '.aac';

// Interface for audio information
interface AudioInfo {
  [key: string]: {
    file: string;
    duration: number;
  };
}

// Parse command line arguments
const program = new Command();
program
  .option('--api-key <key>', 'ElevenLabs API key', API_KEY)
  .option('--voice <id>', 'ElevenLabs voice ID', DEFAULT_VOICE_ID)
  .option('--limit <n>', 'Limit the number of files to generate', parseInt)
  .option('--remove', 'Remove audio files instead of generating them')
  .option('--segment <id>', 'Specific segment to remove (e.g., "workout-1-segment-2")')
  .option('--fix', 'Review audio files and ensure they\'re in workoutData.ts and useWorkoutAudio.ts')
  .parse(process.argv);

const options = program.opts();

/**
 * Create the audio directory if it doesn't exist.
 */
function createAudioDir(): void {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  console.log(`Audio directory: ${AUDIO_DIR}`);
}

/**
 * Format duration in seconds to a human-readable string.
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  return `${minutes} minute${minutes > 1 ? 's' : ''} and ${remainingSeconds} seconds`;
}

/**
 * Generate the text for the audio cue based on the segment.
 * @param segment - Workout segment
 * @param prevSegment - Previous segment (if any)
 * @returns Text for the audio cue
 */
function generateAudioText(segment: WorkoutSegment, prevSegment: WorkoutSegment | null = null): string {
  const paceType = segment.type.charAt(0).toUpperCase() + segment.type.slice(1);
  const durationText = formatDuration(segment.duration);
  const incline = segment.incline;
  
  // Check if incline is changing from the previous segment
  if (prevSegment && prevSegment.incline === incline) {
    return `${paceType} pace for ${durationText}`;
  } else {
    return `${paceType} pace for ${durationText} at ${incline} percent incline`;
  }
}

/**
 * Generate transition-specific audio text
 * @param fromSegment - Current segment
 * @param toSegment - Next segment
 * @returns Text for the transition audio
 */
function generateTransitionText(fromSegment: WorkoutSegment, toSegment: WorkoutSegment): string {
  const fromType = fromSegment.type.charAt(0).toUpperCase() + fromSegment.type.slice(1);
  const toType = toSegment.type.charAt(0).toUpperCase() + toSegment.type.slice(1);
  const durationText = formatDuration(toSegment.duration);
  const incline = toSegment.incline;
  
  // Check if incline is changing
  if (fromSegment.incline === incline) {
    return `${toType} pace for ${durationText}`;
  } else {
    return `${toType} pace for ${durationText} at ${incline} percent incline`;
  }
}

/**
 * Generate a generic "next segment" audio text
 * @param segment - Next segment
 * @returns Text for the next segment audio
 */
function generateNextText(segment: WorkoutSegment): string {
  const paceType = segment.type.charAt(0).toUpperCase() + segment.type.slice(1);
  const durationText = formatDuration(segment.duration);
  
  return `Next up: ${paceType} pace for ${durationText}. Get ready!`;
}

/**
 * Get the actual duration of an audio file in seconds.
 * @param filePath - Path to the audio file
 * @returns Duration in seconds
 */
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const duration = await getAudioDurationInSeconds(filePath);
    return duration;
  } catch (error) {
    console.error(`Error getting audio duration: ${(error as Error).message}`);
    // Return a fallback duration if we can't get the actual duration
    return 3.0; // Default fallback duration
  }
}

/**
 * Generate an audio file using ElevenLabs API.
 * @param text - Text to convert to speech
 * @param filename - Output filename
 * @param apiKey - ElevenLabs API key
 * @param voiceId - ElevenLabs voice ID
 * @returns Duration of the audio file or null if failed
 */
async function generateAudioFile(
  text: string, 
  filename: string, 
  apiKey: string, 
  voiceId: string
): Promise<number | null> {
  try {
    // Use axios to make the API call to ElevenLabs
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const headers = {
      'Accept': 'audio/aac',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    };
    
    const data = {
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 1.0,
        similarity_boost: 0.75,
        speed: 0.85
      }
    };
    
    const response = await axios.post(url, data, { 
      headers,
      responseType: 'arraybuffer'
    });
    
    // Save audio to file
    fs.writeFileSync(filename, Buffer.from(response.data));
    
    // Get the actual duration of the audio file
    const duration = await getAudioDuration(filename);
    
    console.log(`Generated audio file: ${filename} (${duration.toFixed(1)}s)`);
    return duration;
  } catch (error) {
    console.error(`Error generating audio: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Update the workout data file with the audio information.
 * @param workoutData - Workout data
 * @param audioInfo - Audio information for segments
 */
function updateWorkoutData(workoutData: WorkoutProgram[], audioInfo: AudioInfo): void {
  // Read the original file content
  const content = fs.readFileSync(WORKOUT_DATA_PATH, 'utf8');
  
  // Create a copy of the workout data with audio information
  const updatedWorkoutData = JSON.parse(JSON.stringify(workoutData)) as WorkoutProgram[];
  
  // Update the audio information for each segment
  for (const workout of updatedWorkoutData) {
    for (let i = 0; i < workout.segments.length; i++) {
      const segmentId = `${workout.id}-segment-${i}`;
      if (audioInfo[segmentId]) {
        workout.segments[i].audio = {
          file: audioInfo[segmentId].file,
          duration: audioInfo[segmentId].duration
        };
      }
    }
  }
  
  // Create the updated content
  const updatedContent = content.replace(
    /export const DEFAULT_WORKOUT_PROGRAMS: WorkoutProgram\[\] = .*?;/s,
    `export const DEFAULT_WORKOUT_PROGRAMS: WorkoutProgram[] = ${JSON.stringify(updatedWorkoutData, null, 2)};`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(WORKOUT_DATA_PATH, updatedContent, 'utf8');
  console.log(`Updated workout data file: ${WORKOUT_DATA_PATH}`);
}

/**
 * Remove audio files and update workout data to remove audio references.
 * @param segment - Specific segment to remove (if any)
 */
function removeAudioFiles(segment: string | null = null): void {
  // Get all audio files
  const files = fs.readdirSync(AUDIO_DIR).filter(file => file.endsWith(AUDIO_EXT));
  
  // Filter files to remove
  const filesToRemove = segment
    ? files.filter(file => file.startsWith(segment))
    : files;
  
  // Remove files
  for (const file of filesToRemove) {
    const filePath = path.join(AUDIO_DIR, file);
    fs.unlinkSync(filePath);
    console.log(`Removed audio file: ${filePath}`);
  }
  
  // Update workout data to remove audio references
  if (filesToRemove.length > 0) {
    removeAudioReferencesFromWorkoutData(segment);
  }
  
  console.log(`Removed ${filesToRemove.length} audio files.`);
}

/**
 * Remove audio references from workout data file.
 * @param segment - Specific segment to remove (if any)
 */
function removeAudioReferencesFromWorkoutData(segment: string | null = null): void {
  // Read the original file content
  const content = fs.readFileSync(WORKOUT_DATA_PATH, 'utf8');
  
  // Create a copy of the workout data
  const workoutData = JSON.parse(JSON.stringify(DEFAULT_WORKOUT_PROGRAMS)) as WorkoutProgram[];
  
  // Update the audio information for each segment
  for (const workout of workoutData) {
    for (let i = 0; i < workout.segments.length; i++) {
      const segmentId = `${workout.id}-segment-${i}`;
      
      // Remove audio reference if it matches the segment or if no segment is specified
      if (!segment || segmentId === segment) {
        delete workout.segments[i].audio;
      }
    }
  }
  
  // Create the updated content
  const updatedContent = content.replace(
    /export const DEFAULT_WORKOUT_PROGRAMS: WorkoutProgram\[\] = .*?;/s,
    `export const DEFAULT_WORKOUT_PROGRAMS: WorkoutProgram[] = ${JSON.stringify(workoutData, null, 2)};`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(WORKOUT_DATA_PATH, updatedContent, 'utf8');
  console.log(`Updated workout data file to remove audio references: ${WORKOUT_DATA_PATH}`);
}

/**
 * Get all audio files in the audio directory.
 * @returns Array of audio file names
 */
function getAllAudioFiles(): string[] {
  return fs.readdirSync(AUDIO_DIR)
    .filter(file => file.endsWith(AUDIO_EXT))
    .sort();
}

/**
 * Check if an audio file is referenced in the workout data.
 * @param fileName - Audio file name
 * @param workoutData - Workout data
 * @returns True if the audio file is referenced in the workout data
 */
function isAudioFileReferencedInWorkoutData(fileName: string, workoutData: WorkoutProgram[]): boolean {
  for (const workout of workoutData) {
    for (const segment of workout.segments) {
      if (segment.audio?.file === fileName) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if an audio file is included in the useWorkoutAudio.ts file.
 * @param fileName - Audio file name
 * @returns True if the audio file is included in the useWorkoutAudio.ts file
 */
function isAudioFileInUseWorkoutAudio(fileName: string): boolean {
  const content = fs.readFileSync(WORKOUT_AUDIO_PATH, 'utf8');
  return content.includes(`case '${fileName}':`);
}

/**
 * Update the useWorkoutAudio.ts file to include all audio files.
 * @param audioFiles - Array of audio file names
 */
function updateUseWorkoutAudio(audioFiles: string[]): void {
  const content = fs.readFileSync(WORKOUT_AUDIO_PATH, 'utf8');
  
  // Find the switch statement in the file
  const switchRegex = /switch\s*\(\s*nextSegment\.audio\.file\s*\)\s*{([\s\S]*?)default:/;
  const match = content.match(switchRegex);
  
  if (!match) {
    console.error('Could not find switch statement in useWorkoutAudio.ts');
    
    // Try an alternative approach - find the last case statement and add after it
    const lastCaseRegex = /case\s+'[^']+\.aac':[^}]*break;/g;
    const lastCaseMatches = [...content.matchAll(lastCaseRegex)];
    
    if (lastCaseMatches.length === 0) {
      console.error('Could not find any case statements in useWorkoutAudio.ts');
      return;
    }
    
    const lastCaseMatch = lastCaseMatches[lastCaseMatches.length - 1];
    const lastCaseIndex = lastCaseMatch.index! + lastCaseMatch[0].length;
    
    // Generate case statements for all audio files
    let caseStatements = '';
    for (const file of audioFiles) {
      if (!isAudioFileInUseWorkoutAudio(file)) {
        // Check if the file name contains an apostrophe
        if (file.includes("'")) {
          // Use double quotes for the case statement if the file name contains an apostrophe
          caseStatements += `\n                case "${file}":\n`;
        } else {
          caseStatements += `\n                case '${file}':\n`;
        }
        caseStatements += `                  segmentSound = new Audio.Sound();\n`;
        // Always escape apostrophes in the require path
        const escapedFile = file.replace(/'/g, "\\'");
        caseStatements += `                  await segmentSound.loadAsync(require('../assets/audio/${escapedFile}'));\n`;
        caseStatements += `                  break;`;
      }
    }
    
    // If no new case statements, nothing to update
    if (!caseStatements) {
      console.log('All audio files are already included in useWorkoutAudio.ts');
      return;
    }
    
    // Insert the new case statements after the last case statement
    const updatedContent = 
      content.substring(0, lastCaseIndex) + 
      caseStatements + 
      content.substring(lastCaseIndex);
    
    // Write the updated content back to the file
    fs.writeFileSync(WORKOUT_AUDIO_PATH, updatedContent, 'utf8');
    console.log(`Updated useWorkoutAudio.ts with ${caseStatements.split('case').length - 1} new audio files.`);
    return;
  }
  
  // Generate case statements for all audio files
  let caseStatements = '';
  for (const file of audioFiles) {
    if (!isAudioFileInUseWorkoutAudio(file)) {
      // Check if the file name contains an apostrophe
      if (file.includes("'")) {
        // Use double quotes for the case statement if the file name contains an apostrophe
        caseStatements += `                case "${file}":\n`;
      } else {
        caseStatements += `                case '${file}':\n`;
      }
      caseStatements += `                  segmentSound = new Audio.Sound();\n`;
      // Always escape apostrophes in the require path
      const escapedFile = file.replace(/'/g, "\\'");
      caseStatements += `                  await segmentSound.loadAsync(require('../assets/audio/${escapedFile}'));\n`;
      caseStatements += `                  break;\n`;
    }
  }
  
  // If no new case statements, nothing to update
  if (!caseStatements) {
    console.log('All audio files are already included in useWorkoutAudio.ts');
    return;
  }
  
  // Find a good place to insert the new case statements
  // We'll insert them right before the default case
  const updatedContent = content.replace(
    switchRegex,
    (match, p1) => {
      return `switch (nextSegment.audio.file) {${p1}${caseStatements}default:`;
    }
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(WORKOUT_AUDIO_PATH, updatedContent, 'utf8');
  console.log(`Updated useWorkoutAudio.ts with ${caseStatements.split('case').length - 1} new audio files.`);
}

/**
 * Fix audio references in workoutData.ts and useWorkoutAudio.ts.
 */
async function fixAudioReferences(): Promise<void> {
  console.log('Fixing audio references...');
  
  // Get all audio files
  const audioFiles = getAllAudioFiles();
  console.log(`Found ${audioFiles.length} audio files in ${AUDIO_DIR}`);
  
  // Get workout data
  const workoutData = DEFAULT_WORKOUT_PROGRAMS;
  
  // Check which audio files are not referenced in workout data
  const unreferencedFiles = audioFiles.filter(file => !isAudioFileReferencedInWorkoutData(file, workoutData));
  console.log(`Found ${unreferencedFiles.length} audio files not referenced in workoutData.ts`);
  
  // Check which audio files are not included in useWorkoutAudio.ts
  const filesNotInUseWorkoutAudio = audioFiles.filter(file => !isAudioFileInUseWorkoutAudio(file));
  console.log(`Found ${filesNotInUseWorkoutAudio.length} audio files not included in useWorkoutAudio.ts`);
  
  // Update useWorkoutAudio.ts
  if (filesNotInUseWorkoutAudio.length > 0) {
    updateUseWorkoutAudio(audioFiles);
  }
  
  // Update workout data with audio durations for unreferenced files
  if (unreferencedFiles.length > 0) {
    const audioInfo: AudioInfo = {};
    
    for (const file of unreferencedFiles) {
      const filePath = path.join(AUDIO_DIR, file);
      const duration = await getAudioDuration(filePath);
      
      // Extract segment ID from file name (e.g., "workout-1-segment-0.aac" -> "workout-1-segment-0")
      const segmentId = file.replace(AUDIO_EXT, '');
      
      audioInfo[segmentId] = {
        file,
        duration
      };
      
      console.log(`Added audio info for ${segmentId}: ${file} (${duration.toFixed(1)}s)`);
    }
    
    // Update workout data
    updateWorkoutData(workoutData, audioInfo);
  }
  
  console.log('Audio references fixed successfully.');
}

/**
 * Main function.
 */
async function main(): Promise<void> {
  // Create audio directory if it doesn't exist
  createAudioDir();
  
  // Handle fix option
  if (options.fix) {
    await fixAudioReferences();
    return;
  }
  
  // Handle remove option
  if (options.remove) {
    removeAudioFiles(options.segment || null);
    return;
  }
  
  // Get workout data
  const workoutData = DEFAULT_WORKOUT_PROGRAMS;
  
  // Audio information for segments
  const audioInfo: AudioInfo = {};
  
  // Generate audio files for each segment
  let filesGenerated = 0;
  
  for (const workout of workoutData) {
    for (let i = 0; i < workout.segments.length; i++) {
      // Skip if we've reached the limit
      if (options.limit && filesGenerated >= options.limit) {
        break;
      }
      
      const segment = workout.segments[i];
      const segmentId = `${workout.id}-segment-${i}`;
      const filename = `${segmentId}${AUDIO_EXT}`;
      const filePath = path.join(AUDIO_DIR, filename);
      
      // Skip if audio already exists for this segment
      if (segment.audio?.file) {
        console.log(`Skipping segment ${segmentId} (audio already exists)`);
        
        // Make sure we have the audio info for updating the workout data
        audioInfo[segmentId] = {
          file: segment.audio.file,
          duration: segment.audio.duration
        };
        continue;
      }
      
      // Get the previous segment (if any)
      const prevSegment = i > 0 ? workout.segments[i - 1] : null;
      
      // Generate audio text
      let text: string;
      if (i === 0) {
        // First segment
        text = generateAudioText(segment);
      } else {
        // Transition from previous segment
        text = generateTransitionText(prevSegment!, segment);
      }
      
      // Generate the audio file
      console.log(`Generating audio for segment ${segmentId}...`);
      const duration = await generateAudioFile(text, filePath, options.apiKey, options.voice);
      
      if (duration) {
        // Store audio information
        audioInfo[segmentId] = {
          file: filename,
          duration: duration
        };
        
        filesGenerated++;
      }
    }
  }
  
  // Update the workout data file with the audio information
  if (Object.keys(audioInfo).length > 0) {
    updateWorkoutData(workoutData, audioInfo);
  }
  
  console.log(`Generated ${filesGenerated} audio files.`);
}

// Run the main function
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
