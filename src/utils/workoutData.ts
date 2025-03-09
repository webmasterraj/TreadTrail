import { DEFAULT_WORKOUT_PROGRAMS } from '../constants/workoutData';
import { WorkoutProgram } from '../types/workout';

/**
 * Gets a workout by ID directly from the default programs
 * This is used by Redux to avoid context dependency
 */
export const getWorkoutById = (id: string): WorkoutProgram | null => {
  console.log('[workoutData] Getting workout by ID:', id);
  
  // Use the default workout programs for now - in production this
  // should use AsyncStorage or a more robust data access method
  const workout = DEFAULT_WORKOUT_PROGRAMS.find(workout => workout.id === id);
  
  if (workout) {
    console.log('[workoutData] Found workout:', workout.name);
    return workout;
  } else {
    console.log('[workoutData] Workout not found for ID:', id);
    return null;
  }
};