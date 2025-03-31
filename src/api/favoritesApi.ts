import supabase from './supabaseClient';

/**
 * Fetches all favorite workouts for the current user
 * @returns Array of favorite workout IDs
 */
export const fetchUserFavorites = async (): Promise<string[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.log('No authenticated user found');
      return [];
    }

    const userId = session.session.user.id;
    const { data, error } = await supabase
      .from('user_favorite_workouts')
      .select('workout_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user favorites:', error);
      throw error;
    }

    return data?.map(item => item.workout_id) || [];
  } catch (error) {
    console.error('Error in fetchUserFavorites:', error);
    return [];
  }
};

/**
 * Adds a workout to user's favorites
 * @param workoutId ID of the workout to favorite
 * @returns true if successful, false otherwise
 */
export const addFavoriteWorkout = async (workoutId: string): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.log('No authenticated user found');
      return false;
    }

    const userId = session.session.user.id;
    const { error } = await supabase
      .from('user_favorite_workouts')
      .insert([{ user_id: userId, workout_id: workoutId }]);

    if (error) {
      // If error is about unique constraint, it means the workout is already favorited
      if (error.code === '23505') {
        console.log('Workout already favorited');
        return true;
      }
      console.error('Error adding favorite workout:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addFavoriteWorkout:', error);
    return false;
  }
};

/**
 * Removes a workout from user's favorites
 * @param workoutId ID of the workout to unfavorite
 * @returns true if successful, false otherwise
 */
export const removeFavoriteWorkout = async (workoutId: string): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.log('No authenticated user found');
      return false;
    }

    const userId = session.session.user.id;
    const { error } = await supabase
      .from('user_favorite_workouts')
      .delete()
      .eq('user_id', userId)
      .eq('workout_id', workoutId);

    if (error) {
      console.error('Error removing favorite workout:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeFavoriteWorkout:', error);
    return false;
  }
};
