#!/usr/bin/env ts-node

/**
 * TreadTrail Workout Management Script
 * 
 * This script handles:
 * 1. Generating audio files for workout segments using ElevenLabs API
 * 2. Uploading workout data to Supabase
 * 3. Uploading audio files to Supabase storage
 * 
 * Usage:
 *   npx ts-node ./scripts/manage_workouts.ts [options]
 * 
 * Options:
 *   --generate-audio     Only generates audio from ElevenLabs
 *   --upload-workouts    Only uploads workout data from data/workoutData.ts
 *   --upload-audio       Only uploads local audio files from .local/audio
 *   --all                Does all 3 above (in order)
 *   --api-key KEY        ElevenLabs API key (overrides ELEVENLABS_API_KEY env variable)
 *   --voice VOICE_ID     ElevenLabs voice ID to use (optional)
 *   --limit N            Limit the number of files to generate
 */

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { WORKOUT_PROGRAMS } from '../data/workoutData';
import { WorkoutProgram, WorkoutSegment } from '../src/types';
import axios from 'axios';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Default ElevenLabs voice ID (Hope)
const DEFAULT_VOICE_ID = "tnSpp4vdxKPjI9w0GnoV";

// Directory paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOCAL_AUDIO_DIR = path.join(PROJECT_ROOT, '.local', 'audio');
const AUDIO_EXT = '.aac';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
  .option('--generate-audio', 'Only generates audio from ElevenLabs')
  .option('--upload-workouts', 'Only uploads workout data from data/workoutData.ts')
  .option('--upload-audio', 'Only uploads local audio files from .local/audio')
  .option('--all', 'Does all 3 above (in order)')
  .option('--api-key <key>', 'ElevenLabs API key (overrides ELEVENLABS_API_KEY env variable)')
  .option('--voice <id>', 'ElevenLabs voice ID', DEFAULT_VOICE_ID)
  .option('--limit <n>', 'Limit the number of files to generate', parseInt)
  .parse(process.argv);

const options = program.opts();

/**
 * Create the local audio directory if it doesn't exist.
 */
function createLocalAudioDir(): void {
  if (!fs.existsSync(LOCAL_AUDIO_DIR)) {
    fs.mkdirSync(LOCAL_AUDIO_DIR, { recursive: true });
    console.log(`Created local audio directory: ${LOCAL_AUDIO_DIR}`);
  }
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
  
  if (prevSegment === null) {
    // First segment
    return `Let's start with ${paceType} pace for ${durationText} at ${incline}% incline.`;
  } else {
    // Transition from previous segment
    return generateTransitionText(prevSegment, segment);
  }
}

/**
 * Generate transition-specific audio text.
 * @param fromSegment - Current segment
 * @param toSegment - Next segment
 * @returns Text for the transition audio
 */
function generateTransitionText(fromSegment: WorkoutSegment, toSegment: WorkoutSegment): string {
  const fromType = fromSegment.type;
  const toType = toSegment.type.charAt(0).toUpperCase() + toSegment.type.slice(1);
  const durationText = formatDuration(toSegment.duration);
  const incline = toSegment.incline;
  
  if (fromType === toSegment.type && fromSegment.incline === incline) {
    return `Continue at ${toType} pace for ${durationText}.`;
  } else if (fromType === toSegment.type) {
    return `Continue at ${toType} pace for ${durationText}, but change incline to ${incline}%.`;
  } else {
    return `Now switch to ${toType} pace for ${durationText} at ${incline}% incline.`;
  }
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
    console.error(`Error getting audio duration for ${filePath}:`, error);
    return 0;
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
    
    console.log(`Generated audio file: ${filename} (${duration.toFixed(2)} seconds)`);
    
    return duration;
  } catch (error) {
    console.error(`Error generating audio file:`, error);
    return null;
  }
}

/**
 * Check if an audio file exists for a workout segment.
 * @param workoutId - Workout ID
 * @param segmentIndex - Segment index
 * @returns True if the audio file exists
 */
function audioFileExists(workoutId: string, segmentIndex: number): boolean {
  const filename = `${workoutId}-segment-${segmentIndex}${AUDIO_EXT}`;
  const filePath = path.join(LOCAL_AUDIO_DIR, filename);
  return fs.existsSync(filePath);
}

/**
 * Generate audio files for workout segments.
 * @param apiKey - ElevenLabs API key
 * @param voiceId - ElevenLabs voice ID
 * @param limit - Limit the number of files to generate
 */
async function generateAudio(apiKey: string, voiceId: string, limit?: number): Promise<void> {
  // Use API key from environment variable if not provided as command line argument
  const elevenlabsApiKey = apiKey || process.env.ELEVENLABS_API_KEY;
  
  if (!elevenlabsApiKey) {
    console.error('Missing ElevenLabs API key. Please provide --api-key or set ELEVENLABS_API_KEY in .env file.');
    process.exit(1);
  }
  
  console.log('Starting audio generation...');
  
  // Create local audio directory if it doesn't exist
  createLocalAudioDir();
  
  // Audio information for segments
  const audioInfo: AudioInfo = {};
  
  // Generate audio files for each segment
  let filesGenerated = 0;
  
  for (const workout of WORKOUT_PROGRAMS) {
    for (let i = 0; i < workout.segments.length; i++) {
      // Skip if we've reached the limit
      if (limit && filesGenerated >= limit) {
        break;
      }
      
      const segment = workout.segments[i];
      const segmentId = `${workout.id}-segment-${i}`;
      const filename = `${segmentId}${AUDIO_EXT}`;
      const filePath = path.join(LOCAL_AUDIO_DIR, filename);
      
      // Skip if audio already exists for this segment
      if (audioFileExists(workout.id, i)) {
        console.log(`Skipping segment ${segmentId} (audio already exists)`);
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
      const duration = await generateAudioFile(text, filePath, elevenlabsApiKey, voiceId);
      
      if (duration) {
        filesGenerated++;
      }
    }
  }
  
  console.log(`Generated ${filesGenerated} audio files.`);
}

/**
 * Upload workout data to Supabase.
 */
async function uploadWorkouts(): Promise<void> {
  console.log('Starting workout import...');
  
  try {
    // Process each workout program
    for (const workout of WORKOUT_PROGRAMS) {
      console.log(`Processing workout: ${workout.name}`);
      
      // Check if workout already exists
      const { data: existingWorkout } = await supabase
        .from('workout_programs')
        .select('id')
        .eq('name', workout.name)
        .single();
      
      if (existingWorkout) {
        console.log(`Workout "${workout.name}" already exists, updating...`);
        
        // Update existing workout
        const { data: updatedWorkout, error: updateError } = await supabase
          .from('workout_programs')
          .update({
            description: workout.description,
            duration: workout.duration,
            category: workout.category,
            is_active: true,
            is_premium: workout.premium || false,
            intensity: workout.intensity || 1
          })
          .eq('id', existingWorkout.id)
          .select('id')
          .single();
        
        if (updateError) {
          console.error(`Error updating workout ${workout.name}:`, updateError);
          continue;
        }
        
        console.log(`Updated workout: ${workout.name} with ID: ${updatedWorkout.id}`);
        
        // Process segments - first delete existing segments
        const { error: deleteError } = await supabase
          .from('workout_segments')
          .delete()
          .eq('workout_id', updatedWorkout.id);
        
        if (deleteError) {
          console.error(`Error deleting segments for workout ${workout.name}:`, deleteError);
          continue;
        }
        
        // Insert new segments
        for (let i = 0; i < workout.segments.length; i++) {
          const segment = workout.segments[i];
          
          // Insert segment
          const { error: segmentError } = await supabase
            .from('workout_segments')
            .insert({
              workout_id: updatedWorkout.id,
              sequence_number: i,
              type: segment.type,
              duration: segment.duration,
              incline: segment.incline,
              audio_file_url: `${workout.id}-segment-${i}${AUDIO_EXT}`,
            });
          
          if (segmentError) {
            console.error(`Error inserting segment ${i} for workout ${workout.name}:`, segmentError);
          }
        }
        
        console.log(`Inserted ${workout.segments.length} segments for workout: ${workout.name}`);
        continue;
      }
      
      // Generate UUID for new workout
      const workoutId = workout.id || uuidv4();
      
      // Insert workout program
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_programs')
        .insert({
          id: workoutId,
          name: workout.name,
          description: workout.description,
          duration: workout.duration,
          category: workout.category,
          is_active: true,
          is_premium: workout.premium || false,
          intensity: workout.intensity || 1
        })
        .select('id')
        .single();
      
      if (workoutError) {
        console.error(`Error inserting workout ${workout.name}:`, workoutError);
        continue;
      }
      
      console.log(`Inserted workout: ${workout.name} with ID: ${workoutData.id}`);
      
      // Process segments
      for (let i = 0; i < workout.segments.length; i++) {
        const segment = workout.segments[i];
        
        // Insert segment
        const { error: segmentError } = await supabase
          .from('workout_segments')
          .insert({
            workout_id: workoutData.id,
            sequence_number: i,
            type: segment.type,
            duration: segment.duration,
            incline: segment.incline,
            audio_file_url: `${workout.id}-segment-${i}${AUDIO_EXT}`,
          });
        
        if (segmentError) {
          console.error(`Error inserting segment ${i} for workout ${workout.name}:`, segmentError);
        }
      }
      
      console.log(`Inserted ${workout.segments.length} segments for workout: ${workout.name}`);
    }
    
    console.log('Workout import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

/**
 * Check if a file exists in Supabase storage.
 * @param bucket - Bucket name
 * @param path - File path
 * @returns True if the file exists
 */
async function fileExistsInStorage(bucket: string, path: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .download(path);
    
    if (error) {
      if (error.message.includes('Not Found')) {
        return false;
      }
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking if file exists in storage:`, error);
    return false;
  }
}

/**
 * Upload audio files to Supabase storage.
 */
async function uploadAudio(): Promise<void> {
  console.log('Starting audio file upload...');
  
  try {
    // Check if directory exists
    if (!fs.existsSync(LOCAL_AUDIO_DIR)) {
      console.log('Local audio directory not found, skipping audio upload');
      return;
    }
    
    const files = fs.readdirSync(LOCAL_AUDIO_DIR).filter(file => file.endsWith(AUDIO_EXT));
    
    for (const file of files) {
      // Check if file already exists in Supabase storage
      const exists = await fileExistsInStorage('workout_audio', file);
      
      if (exists) {
        console.log(`Skipping ${file} (already exists in Supabase storage)`);
        continue;
      }
      
      const filePath = path.join(LOCAL_AUDIO_DIR, file);
      const fileContent = fs.readFileSync(filePath);
      
      // Upload to Supabase
      const { data, error } = await supabase
        .storage
        .from('workout_audio')
        .upload(file, fileContent, {
          contentType: 'audio/aac',
          upsert: false
        });
      
      if (error) {
        console.error(`Error uploading audio file ${file}:`, error);
      } else {
        console.log(`Uploaded audio file: ${file}`);
      }
    }
    
    console.log('Audio file upload completed!');
  } catch (error) {
    console.error('Error during audio upload:', error);
  }
}

/**
 * Main function.
 */
async function main(): Promise<void> {
  // Validate options
  if (!options.generateAudio && !options.uploadWorkouts && !options.uploadAudio && !options.all) {
    console.error('Please specify at least one action: --generate-audio, --upload-workouts, --upload-audio, or --all');
    program.help();
    return;
  }
  
  // Add .local to .gitignore if not already there
  const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    let gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('.local')) {
      gitignore += '\n# Local audio files\n.local\n';
      fs.writeFileSync(gitignorePath, gitignore);
      console.log('Added .local to .gitignore');
    }
  }
  
  // Create local audio directory
  createLocalAudioDir();
  
  // Perform actions based on options
  if (options.all || options.generateAudio) {
    await generateAudio(options.apiKey, options.voice, options.limit);
  }
  
  if (options.all || options.uploadWorkouts) {
    await uploadWorkouts();
  }
  
  if (options.all || options.uploadAudio) {
    await uploadAudio();
  }
  
  console.log('All tasks completed!');
}

// Run the main function
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
