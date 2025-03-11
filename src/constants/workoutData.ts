import { WorkoutProgram } from '../types';
import { generateUniqueId } from '../utils/helpers';

// Default workout programs as specified in the PRD
export const DEFAULT_WORKOUT_PROGRAMS: WorkoutProgram[] = [
  // Quick HIIT (20 min)
  {
    id: 'workout-1',
    name: 'Quick HIIT',
    description: 'Alternating 30-second Sprint intervals with 90-second Recovery periods. High intensity, perfect for a quick but effective workout.',
    duration: 1200, // 20 minutes in seconds
    difficulty: 'intermediate',
    focus: 'hiit',
    favorite: false,
    lastUsed: null,
    segments: [
      // Warm up (2 minutes)
      { type: 'base', duration: 120, incline: 1 },
      
      // 8 rounds of Sprint/Recovery (total 16 minutes)
      { type: 'sprint', duration: 30, incline: 1 },
      { type: 'recovery', duration: 90, incline: 1 },
      { type: 'sprint', duration: 30, incline: 1 },
      { type: 'recovery', duration: 90, incline: 1 },
      { type: 'sprint', duration: 30, incline: 1 },
      { type: 'recovery', duration: 90, incline: 1 },
      { type: 'sprint', duration: 30, incline: 1 },
      { type: 'recovery', duration: 90, incline: 1 },
      { type: 'sprint', duration: 30, incline: 1 },
      { type: 'recovery', duration: 90, incline: 1 },
      { type: 'sprint', duration: 30, incline: 1 },
      { type: 'recovery', duration: 90, incline: 1 },
      { type: 'sprint', duration: 30, incline: 1 },
      { type: 'recovery', duration: 90, incline: 1 },
      { type: 'sprint', duration: 30, incline: 1 },
      { type: 'recovery', duration: 90, incline: 1 },
      
      // Cool down (2 minutes)
      { type: 'base', duration: 120, incline: 1 }
    ]
  },
  
  // Fat Burn (30 min)
  {
    id: 'workout-2',
    name: 'Fat Burn',
    description: 'Alternating Base and Run paces with gradually increasing inclines. Designed to maximize calorie burn through sustained effort.',
    duration: 1800, // 30 minutes in seconds
    difficulty: 'intermediate',
    focus: 'fat_burn',
    favorite: false,
    lastUsed: null,
    segments: [
      // Warm up (2 minutes)
      { type: 'base', duration: 120, incline: 1 },
      
      // Main workout (25 minutes)
      { type: 'base', duration: 180, incline: 2 },
      { type: 'run', duration: 120, incline: 2 },
      { type: 'base', duration: 180, incline: 3 },
      { type: 'run', duration: 120, incline: 3 },
      { type: 'base', duration: 180, incline: 4 },
      { type: 'run', duration: 120, incline: 4 },
      { type: 'base', duration: 180, incline: 5 },
      { type: 'run', duration: 120, incline: 5 },
      { type: 'base', duration: 180, incline: 3 },
      { type: 'run', duration: 120, incline: 3 },
      
      // Cool down (3 minutes)
      { type: 'base', duration: 120, incline: 2 },
      { type: 'recovery', duration: 60, incline: 1 }
    ]
  },
  
  // Endurance Builder (45 min)
  {
    id: 'workout-3',
    name: 'Endurance Builder',
    description: 'Longer intervals with Base and Run paces and varied inclines. Builds aerobic capacity and mental stamina.',
    duration: 2700, // 45 minutes in seconds
    difficulty: 'advanced',
    focus: 'endurance',
    favorite: false,
    lastUsed: null,
    segments: [
      // Warm up (2 minutes)
      { type: 'base', duration: 120, incline: 1 },
      
      // Main workout (35 minutes)
      { type: 'base', duration: 300, incline: 2 },
      { type: 'run', duration: 180, incline: 2 },
      { type: 'base', duration: 300, incline: 3 },
      { type: 'run', duration: 180, incline: 3 },
      { type: 'base', duration: 300, incline: 4 },
      { type: 'run', duration: 180, incline: 4 },
      { type: 'base', duration: 300, incline: 3 },
      { type: 'run', duration: 240, incline: 3 },
      { type: 'base', duration: 300, incline: 2 },
      { type: 'run', duration: 120, incline: 2 },
      
      // Cool down (3 minutes)
      { type: 'base', duration: 120, incline: 1 },
      { type: 'recovery', duration: 60, incline: 1 }
    ]
  },
  
  // Beginner Intro (15 min)
  {
    id: 'workout-4',
    name: 'Beginner Intro',
    description: 'Gentle introduction with mostly Base pace and brief Run intervals. Perfect for those new to interval training.',
    duration: 900, // 15 minutes in seconds
    difficulty: 'beginner',
    focus: 'endurance',
    favorite: false,
    lastUsed: null,
    segments: [
      // Warm up (2 minutes)
      { type: 'recovery', duration: 60, incline: 1 },
      { type: 'base', duration: 60, incline: 1 },
      
      // Main workout (11 minutes)
      { type: 'base', duration: 180, incline: 1 },
      { type: 'run', duration: 60, incline: 1 },
      { type: 'base', duration: 180, incline: 2 },
      { type: 'run', duration: 60, incline: 2 },
      { type: 'base', duration: 180, incline: 1 },
      
      // Cool down (2 minutes)
      { type: 'recovery', duration: 120, incline: 1 }
    ]
  },
  
  // Speed Ladder (25 min)
  {
    id: 'workout-5',
    name: 'Speed Ladder',
    description: 'Progressive increases in pace from Recovery to Sprint. Challenges you to push your limits step by step.',
    duration: 1500, // 25 minutes in seconds
    difficulty: 'advanced',
    focus: 'hiit',
    favorite: false,
    lastUsed: null,
    segments: [
      // Warm up (5 minutes)
      { type: 'base', duration: 300, incline: 1 },
      
      // Ladder up (8 minutes)
      { type: 'recovery', duration: 60, incline: 1 },
      { type: 'base', duration: 120, incline: 1 },
      { type: 'run', duration: 120, incline: 1 },
      { type: 'sprint', duration: 60, incline: 1 },
      { type: 'recovery', duration: 120, incline: 1 },
      
      // Ladder up again (8 minutes)
      { type: 'base', duration: 120, incline: 2 },
      { type: 'run', duration: 120, incline: 2 },
      { type: 'sprint', duration: 60, incline: 2 },
      { type: 'recovery', duration: 180, incline: 1 },
      
      // Final push (2 minutes)
      { type: 'base', duration: 60, incline: 1 },
      { type: 'run', duration: 30, incline: 1 },
      { type: 'sprint', duration: 30, incline: 1 },
      
      // Cool down (2 minutes)
      { type: 'recovery', duration: 120, incline: 1 }
    ]
  }
];