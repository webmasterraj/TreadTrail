// Import necessary libraries
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutProgram, WorkoutSession, Stats } from '../../types';
import { calculateTotalDistance } from '../../utils/helpers';
import { fetchUserFavorites, addFavoriteWorkout, removeFavoriteWorkout } from '../../api/favoritesApi';
import supabase from '../../api/supabaseClient';
import NetInfo from '@react-native-community/netinfo';
import { queueWorkoutAudioDownloads } from '../../utils/audioUtils';

// Import types

// Storage keys
const WORKOUT_PROGRAMS_KEY = '@treadtrail:workout_programs';
const WORKOUT_HISTORY_KEY = '@treadtrail:workout_history';
const STATS_KEY = '@treadtrail:stats';
const FAVORITE_WORKOUTS_KEY = '@treadtrail:favorite_workouts';
const PENDING_SYNC_KEY = '@treadtrail:pending_sync';

// Initial stats
const INITIAL_STATS: Stats = {
  lastUpdated: new Date().toISOString(),
  stats: {
    totalWorkouts: 0,
    totalDuration: 0,
    totalSegmentsCompleted: 0,
    totalDistance: 0,
    totalCaloriesBurned: 0,
    workoutsByCategory: {
      'Easy \ud83d\udc23': 0,
      'Trad HIIT \ud83c\udfc3\ud83c\udffc': 0,
      'Hills \u26f0': 0,
      'Endurance \ud83d\udcaa\ud83c\udffd': 0,
      'Death \ud83d\udc80': 0,
    },
    workoutsByFocus: {
      endurance: 0,
      hiit: 0,
      fat_burn: 0,
    },
    lastWorkoutDate: null,
    longestWorkout: {
      duration: 0,
      date: '',
    },
  },
  achievements: [],
};

// Define the state interface
interface WorkoutProgramsState {
  workoutPrograms: WorkoutProgram[];
  workoutHistory: WorkoutSession[];
  stats: Stats;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  pendingSync: {
    workoutHistory: WorkoutSession[];
    favoriteWorkouts: string[];
  };
  lastSyncedAt: string | null;
}

// Define initial state
const initialState: WorkoutProgramsState = {
  workoutPrograms: [],
  workoutHistory: [],
  stats: INITIAL_STATS,
  isLoading: true,
  error: null,
  isSyncing: false,
  pendingSync: {
    workoutHistory: [],
    favoriteWorkouts: []
  },
  lastSyncedAt: null
};

// Async thunks
const fetchWorkoutPrograms = createAsyncThunk(
  'workoutPrograms/fetch',
  async (_, { rejectWithValue }) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      let workoutPrograms: WorkoutProgram[] = [];
      let favoriteIds: string[] = [];
      
      // Get user session
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      // If offline, try to load from cache
      if (!isConnected) {
        console.log('Offline, trying to load workouts from cache');
        const cachedPrograms = await AsyncStorage.getItem('workoutPrograms');
        if (cachedPrograms) {
          workoutPrograms = JSON.parse(cachedPrograms);
          console.log(`Loaded ${workoutPrograms.length} workouts from cache`);
        } else {
          console.log('No cached workout programs found');
          return rejectWithValue('No internet connection and no cached data available');
        }
      } else {
        // Online, fetch from Supabase
        console.log('Fetching workout programs from Supabase');
        
        // Fetch workout programs from Supabase
        const { data: supabaseWorkouts, error: workoutsError } = await supabase
          .from('workout_programs')
          .select('*')
          .eq('is_active', true);
        
        if (workoutsError) {
          console.error('Error fetching workouts from Supabase:', workoutsError);
          
          // Try to use cached data as fallback
          const cachedPrograms = await AsyncStorage.getItem('workoutPrograms');
          if (cachedPrograms) {
            workoutPrograms = JSON.parse(cachedPrograms);
            console.log(`Using cached data due to Supabase error (${workoutPrograms.length} workouts)`);
          } else {
            return rejectWithValue('Failed to fetch workout programs and no cache available');
          }
        } else if (supabaseWorkouts && supabaseWorkouts.length > 0) {
          console.log(`Fetched ${supabaseWorkouts.length} workouts from Supabase`);
          
          // Fetch segments for each workout
          const workoutsWithSegments = await Promise.all(
            supabaseWorkouts.map(async (workout) => {
              const { data: segments, error: segmentsError } = await supabase
                .from('workout_segments')
                .select('*')
                .eq('workout_id', workout.id)
                .order('sequence_number', { ascending: true });
              
              if (segmentsError) {
                console.error(`Error fetching segments for workout ${workout.id}:`, segmentsError);
                return {
                  ...workout,
                  segments: [],
                };
              }
              
              // Transform segments to match app format
              const formattedSegments = segments.map(segment => {
                // Create proper audio object if URL exists
                let audioObj = undefined;
                if (segment.audio_file_url) {
                  audioObj = { file: segment.audio_file_url };
                }
                
                return {
                  type: segment.type,
                  duration: segment.duration,
                  incline: segment.incline,
                  audio: audioObj,
                };
              });
              
              return {
                id: workout.id,
                name: workout.name,
                description: workout.description,
                duration: workout.duration,
                category: workout.category,
                segments: formattedSegments,
                focus: workout.focus || 'endurance', // Default focus if not provided
                premium: workout.is_premium || false, // Default to non-premium
                intensity: workout.intensity || 1, // Default intensity
                favorite: false, // Will be set later
                lastUsed: null
              };
            })
          );
          
          workoutPrograms = workoutsWithSegments;
          console.log(`Processed ${workoutPrograms.length} workouts with segments`);
          
          // Cache the results for offline use
          await AsyncStorage.setItem('workoutPrograms', JSON.stringify(workoutPrograms));
        } else {
          console.log('No workouts found in Supabase');
          
          // Try to use cached data if no workouts found
          const cachedPrograms = await AsyncStorage.getItem('workoutPrograms');
          if (cachedPrograms) {
            workoutPrograms = JSON.parse(cachedPrograms);
            console.log(`Using cached data as no workouts found in Supabase (${workoutPrograms.length} workouts)`);
          } else {
            return rejectWithValue('No workout programs found in database and no cache available');
          }
        }
      }
      
      // Fetch user's favorite workouts
      if (userId) {
        // User is authenticated, fetch favorites from Supabase
        favoriteIds = await fetchUserFavorites();
      } else {
        // User is not authenticated, use local storage as fallback
        const storedFavorites = await AsyncStorage.getItem(FAVORITE_WORKOUTS_KEY);
        if (storedFavorites) {
          favoriteIds = JSON.parse(storedFavorites);
        }
      }
      
      // Apply favorite status to workout programs
      const result = workoutPrograms.map(workout => ({
        ...workout,
        favorite: favoriteIds.includes(workout.id)
      }));
      
      return result;
    } catch (error: any) {
      console.error('Error in fetchWorkoutPrograms:', error);
      return rejectWithValue('Failed to fetch workout programs');
    }
  }
);

// Add fetchWorkoutHistory thunk
const fetchWorkoutHistory = createAsyncThunk(
  'workoutPrograms/fetchWorkoutHistory',
  async (_, { rejectWithValue }) => {
    try {
      // First check if we have cached workout history
      const cachedHistoryJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      let history: WorkoutSession[] = cachedHistoryJson ? JSON.parse(cachedHistoryJson) : [];
      
      // Try to fetch from Supabase if user is logged in
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (userId) {
          const { data: workoutHistory, error } = await supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
          
          if (error) throw new Error(error.message || 'Error fetching workout history');
          
          if (workoutHistory && workoutHistory.length > 0) {
            // Transform the data to match our app's data model
            history = workoutHistory.map(session => ({
              id: session.id,
              workoutId: session.workout_id,
              workoutName: session.workout_name,
              date: session.date,
              startTime: session.start_time,
              endTime: session.end_time,
              duration: session.duration,
              weight: session.user_weight,
              caloriesBurned: session.calories_burned,
              distance: session.distance,
              completed: session.completed,
              pauses: session.pauses,
              segments: session.segments
            }));
            
            // Save to AsyncStorage for offline use
            await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(history));
          }
        }
      } catch (supabaseError) {
        console.error('Error fetching history from Supabase:', supabaseError);
        // Continue with cached data if available
      }
      
      return history;
    } catch (error: any) {
      console.error('Error in fetchWorkoutHistory:', error);
      return rejectWithValue('Failed to fetch workout history');
    }
  }
);

// Add fetchStats thunk
const fetchStats = createAsyncThunk(
  'workoutPrograms/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms } = state.workoutPrograms;
      
      // Calculate stats from workout history and programs
      const stats = calculateStats(workoutHistory, workoutPrograms);
      
      // Save stats to AsyncStorage
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
      
      return stats;
    } catch (error: any) {
      console.error('Error in fetchStats:', error);
      return rejectWithValue('Failed to calculate stats');
    }
  }
);

const fetchWorkoutProgramsFromCache = createAsyncThunk(
  'workoutPrograms/fetchWorkoutProgramsFromCache',
  async (_, { rejectWithValue }) => {
    try {
      // First check if we have cached workout programs
      const cachedWorkoutsJson = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      let workouts: WorkoutProgram[] = cachedWorkoutsJson ? JSON.parse(cachedWorkoutsJson) : [];
      
      // Get favorite workout IDs
      const favoriteWorkoutIdsJson = await AsyncStorage.getItem(FAVORITE_WORKOUTS_KEY);
      const favoriteWorkoutIds: string[] = favoriteWorkoutIdsJson 
        ? JSON.parse(favoriteWorkoutIdsJson) 
        : [];
      
      try {
        // Try to fetch from Supabase
        const { data: workoutData, error } = await supabase
          .from('workout_programs')
          .select(`
            id, 
            name, 
            description, 
            duration, 
            focus, 
            category, 
            intensity,
            is_premium,
            segments (
              id,
              type,
              duration,
              incline,
              audio_file
            )
          `)
          .order('name');
        
        if (error) throw new Error(error.message || 'Error fetching workout programs');
        
        if (workoutData && workoutData.length > 0) {
          // Transform the data to match our app's data model
          workouts = workoutData.map(workout => {
            // Map segments and add audio information
            const segments = workout.segments.map(segment => ({
              type: segment.type,
              duration: segment.duration,
              incline: segment.incline,
              audio: segment.audio_file ? {
                file: segment.audio_file,
                duration: 0 // We don't know the duration from the API
              } : undefined
            }));
            
            // Check if this workout is in favorites
            const isFavorite = favoriteWorkoutIds.includes(workout.id);
            
            return {
              id: workout.id,
              name: workout.name,
              description: workout.description,
              duration: workout.duration,
              focus: workout.focus,
              category: workout.category,
              intensity: workout.intensity,
              premium: workout.is_premium,
              favorite: isFavorite,
              lastUsed: null,
              segments
            };
          });
          
          // Save to AsyncStorage for offline use
          await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(workouts));
          
          // Queue audio downloads for all workouts in the background
          workouts.forEach(workout => {
            queueWorkoutAudioDownloads(workout).catch((error: any) => {
              console.error(`Error queuing audio downloads for workout ${workout.id}:`, error);
            });
          });
        }
      } catch (supabaseError) {
        console.error('Error fetching from Supabase:', supabaseError);
        // Continue with cached data if available
      }
      
      return workouts;
    } catch (error: any) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Add workout session thunk
const addWorkoutSession = createAsyncThunk(
  'workoutPrograms/addWorkoutSession',
  async (session: WorkoutSession, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms } = state.workoutPrograms;
      
      // Add session to local history
      const updatedHistory = [session, ...workoutHistory];
      
      // Persist updated history to local storage
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      // Update workout's lastUsed
      const updatedPrograms = workoutPrograms.map(workout => {
        if (workout.id === session.workoutId) {
          return { ...workout, lastUsed: session.date };
        }
        return workout;
      });
      
      // Persist updated programs to local storage
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
      
      return {
        session,
        updatedPrograms,
      };
    } catch (error: any) {
      console.error('Error in addWorkoutSession:', error);
      return rejectWithValue('Failed to save workout session');
    }
  }
);

// New thunk for toggling workout favorites with backend integration
const toggleFavoriteWorkout = createAsyncThunk(
  'workoutPrograms/toggleFavorite',
  async (workoutId: string, { getState, dispatch }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const workout = state.workoutPrograms.workoutPrograms.find(w => w.id === workoutId);
      
      if (!workout) {
        throw new Error('Workout not found');
      }
      
      // Get current favorite status
      const currentFavorite = Boolean(workout.favorite);
      const newFavoriteStatus = !currentFavorite;
      
      // First update local state for immediate UI feedback
      dispatch(toggleWorkoutFavorite(workoutId));
      
      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session?.user) {
        // User is authenticated, update in Supabase
        if (newFavoriteStatus) {
          await addFavoriteWorkout(workoutId);
        } else {
          await removeFavoriteWorkout(workoutId);
        }
      }
      
      return { workoutId, favorite: newFavoriteStatus };
    } catch (error: any) {
      console.error('Error toggling favorite workout:', error);
      // If there was an error, toggle back to original state
      dispatch(toggleWorkoutFavorite(workoutId));
      throw error;
    }
  }
);

// Create slice
const workoutProgramsSlice = createSlice({
  name: 'workoutPrograms',
  initialState,
  reducers: {
    // Reducer to toggle a workout's favorite status
    toggleWorkoutFavorite: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      
      // Find the workout
      const workoutIndex = state.workoutPrograms.findIndex(w => w.id === id);
      
      if (workoutIndex !== -1) {
        // Get current favorite status and toggle it
        const currentFavorite = Boolean(state.workoutPrograms[workoutIndex].favorite);
        const newFavoriteStatus = !currentFavorite;
        
        // Update the workout object with the new favorite status
        state.workoutPrograms[workoutIndex] = {
          ...state.workoutPrograms[workoutIndex],
          favorite: newFavoriteStatus
        };
        
        // Get all favorite workout IDs
        const favoriteIds = state.workoutPrograms
          .filter(workout => Boolean(workout.favorite))
          .map(workout => workout.id);
        
        // Persist only the favorite IDs to storage asynchronously
        // This is kept for offline fallback
        AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(favoriteIds))
          .catch((err: any) => console.error('AsyncStorage error:', err));
      }
    },
  },

  extraReducers: (builder) => {
    // Handle fetchWorkoutPrograms
    builder.addCase(fetchWorkoutPrograms.pending, (state) => {
      console.log('[DEBUG-REDUX] fetchWorkoutPrograms.pending - Setting isLoading to true');
      // Only set isLoading to true if we don't already have workout programs
      if (state.workoutPrograms.length === 0) {
        state.isLoading = true;
      } else {
        console.log('[DEBUG-REDUX] fetchWorkoutPrograms.pending - Already have data, not setting loading state');
      }
      state.error = null;
    });
    builder.addCase(fetchWorkoutPrograms.fulfilled, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchWorkoutPrograms.fulfilled - Received ${action.payload.length} workouts`);
      state.workoutPrograms = action.payload;
      state.isLoading = false;
      console.log('[DEBUG-REDUX] fetchWorkoutPrograms.fulfilled - Set isLoading to false');
    });
    builder.addCase(fetchWorkoutPrograms.rejected, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchWorkoutPrograms.rejected - Error: ${action.payload}`);
      state.error = action.payload as string;
      state.isLoading = false;
      console.log('[DEBUG-REDUX] fetchWorkoutPrograms.rejected - Set isLoading to false');
    });
    
    // Handle fetchWorkoutHistory
    builder.addCase(fetchWorkoutHistory.pending, (state) => {
      console.log('[DEBUG-REDUX] fetchWorkoutHistory.pending');
      state.error = null;
      // Don't set isLoading to true here to avoid blocking UI
    });
    builder.addCase(fetchWorkoutHistory.fulfilled, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchWorkoutHistory.fulfilled - Received ${action.payload.length} history items`);
      state.workoutHistory = action.payload;
      // Don't modify isLoading here
    });
    builder.addCase(fetchWorkoutHistory.rejected, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchWorkoutHistory.rejected - Error: ${action.payload}`);
      state.error = action.payload as string;
      // Don't modify isLoading here
    });
    
    // Handle fetchStats
    builder.addCase(fetchStats.pending, (state) => {
      console.log('[DEBUG-REDUX] fetchStats.pending');
      state.error = null;
      // Don't set isLoading to true here to avoid blocking UI
    });
    builder.addCase(fetchStats.fulfilled, (state, action) => {
      console.log('[DEBUG-REDUX] fetchStats.fulfilled - Received stats data');
      state.stats = action.payload;
      // Don't modify isLoading here
    });
    builder.addCase(fetchStats.rejected, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchStats.rejected - Error: ${action.payload}`);
      state.error = action.payload as string;
      // Don't modify isLoading here
    });
    
    // Handle addWorkoutSession
    builder.addCase(addWorkoutSession.pending, (state) => {
      // Processing
    });
    builder.addCase(addWorkoutSession.fulfilled, (state, action) => {
      const { session, updatedPrograms } = action.payload;
      state.workoutHistory = [session, ...state.workoutHistory];
      state.workoutPrograms = updatedPrograms;
    });
    builder.addCase(addWorkoutSession.rejected, (state, action) => {
      // Handle error
    });
  },
});

// Export actions and selectors
export const { toggleWorkoutFavorite } = workoutProgramsSlice.actions;

// Export selectors
export const selectWorkoutPrograms = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.workoutPrograms;
export const selectWorkoutHistory = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.workoutHistory;
export const selectStats = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.stats;
export const selectIsLoading = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.isLoading;
export const selectError = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.error;
export const selectIsSyncing = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.isSyncing;
export const selectLastSyncedAt = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.lastSyncedAt;
export const selectPendingSync = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.pendingSync;

// Helper selectors
export const selectWorkoutById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutPrograms.find(workout => workout.id === id);

export const selectSessionById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutHistory.find(session => session.id === id);

// Calculate stats helper function
export function calculateStats(workoutHistory: WorkoutSession[], workoutPrograms: WorkoutProgram[]): Stats {
  const statsData = {
    totalWorkouts: workoutHistory.length,
    totalDuration: workoutHistory.reduce((sum, session) => sum + (session.duration || 0), 0),
    totalSegmentsCompleted: workoutHistory.reduce((sum, session) => {
      // Add safety check for sessions that might have undefined segments
      if (!session.segments) {
        return sum;
      }
      return sum + session.segments.filter(segment => segment && !segment.skipped).length;
    }, 0),
    totalDistance: 0,
    totalCaloriesBurned: 0,
    workoutsByCategory: {
      'Easy \ud83d\udc23': 0,
      'Trad HIIT \ud83c\udfc3\ud83c\udffc': 0,
      'Hills \u26f0': 0,
      'Endurance \ud83d\udcaa\ud83c\udffd': 0,
      'Death \ud83d\udc80': 0,
    },
    workoutsByFocus: {
      endurance: 0,
      hiit: 0,
      fat_burn: 0,
    },
    lastWorkoutDate: workoutHistory.length > 0 ? workoutHistory[0].date : null,
    longestWorkout: {
      duration: 0,
      date: '',
    },
  };

  // Find longest workout
  let longestDuration = 0;
  let longestDate = '';

  // Calculate total distance across all workout sessions
  let totalDistance = 0;

  workoutHistory.forEach(session => {
    if (session.duration && session.duration > longestDuration) {
      longestDuration = session.duration;
      longestDate = session.date || '';
    }

    // Skip invalid sessions
    if (!session.workoutId) {
      return;
    }

    // Count by category and focus
    const workout = workoutPrograms.find(workout => workout.id === session.workoutId);
    if (workout) {
      // Make sure the values exist in our enum objects
      if (workout.category && statsData.workoutsByCategory[workout.category] !== undefined) {
        statsData.workoutsByCategory[workout.category]++;
      }

      if (workout.focus && statsData.workoutsByFocus[workout.focus] !== undefined) {
        statsData.workoutsByFocus[workout.focus]++;
      }
    }

    if (session.distance) {
      totalDistance += session.distance;
    }
    // If distance is not pre-calculated but we have segments and paceSettings, calculate it
    else if (session.segments && session.paceSettings) {
      const sessionDistance = calculateTotalDistance(session.segments, session.paceSettings);
      totalDistance += sessionDistance;
    }
    
    // Add calories burned to total if available
    if (session.caloriesBurned) {
      statsData.totalCaloriesBurned += session.caloriesBurned;
    }
  });

  statsData.longestWorkout = {
    duration: longestDuration,
    date: longestDate,
  };

  statsData.totalDistance = totalDistance;

  // Create the full Stats object
  return {
    stats: statsData,
    lastUpdated: new Date().toISOString(),
    achievements: []
  };
}

// Export reducer
export default workoutProgramsSlice.reducer;

// Export async thunks
export {
  fetchWorkoutPrograms,
  fetchWorkoutHistory,
  fetchStats,
  addWorkoutSession,
  toggleFavoriteWorkout
};