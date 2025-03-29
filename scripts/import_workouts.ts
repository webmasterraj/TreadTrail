#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { WORKOUT_PROGRAMS } from '../data/workoutData';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

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

// Function to import workouts
async function importWorkouts() {
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
              audio_file_url: segment.audio?.file || null,
            });
          
          if (segmentError) {
            console.error(`Error inserting segment ${i} for workout ${workout.name}:`, segmentError);
          }
        }
        
        console.log(`Inserted ${workout.segments.length} segments for workout: ${workout.name}`);
        continue;
      }
      
      // Generate UUID for new workout
      const workoutId = uuidv4();
      
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
            audio_file_url: segment.audio?.file || null,
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

// Upload audio files to Supabase storage
async function uploadAudioFiles() {
  console.log('Starting audio file upload...');
  
  const audioDir = path.join(__dirname, '../src/assets/audio');
  
  try {
    // Check if directory exists
    if (!fs.existsSync(audioDir)) {
      console.log('Audio directory not found, skipping audio upload');
      return;
    }
    
    const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.aac'));
    
    for (const file of files) {
      const filePath = path.join(audioDir, file);
      const fileContent = fs.readFileSync(filePath);
      
      // Upload to Supabase
      const { data, error } = await supabase
        .storage
        .from('workout_audio')
        .upload(file, fileContent, {
          contentType: 'audio/aac',
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading audio file ${file}:`, error);
      } else {
        console.log(`Uploaded audio file: ${file}`);
        
        // Get public URL
        const { data: urlData } = supabase
          .storage
          .from('workout_audio')
          .getPublicUrl(file);
        
        // Update segments with the public URL
        const { error: updateError } = await supabase
          .from('workout_segments')
          .update({ audio_file_url: urlData.publicUrl })
          .eq('audio_file_url', file);
        
        if (updateError) {
          console.error(`Error updating segment with audio URL for ${file}:`, updateError);
        }
      }
    }
    
    console.log('Audio file upload completed!');
  } catch (error) {
    console.error('Error during audio upload:', error);
  }
}

// Run the import process
async function run() {
  await importWorkouts();
  await uploadAudioFiles();
  console.log('Import process completed!');
}

run();
