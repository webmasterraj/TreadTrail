import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutProgram, WorkoutSession, Stats } from '../../types';
import { DEFAULT_WORKOUT_PROGRAMS } from '../../constants/workoutData';

// Storage keys
const WORKOUT_PROGRAMS_KEY = '@treadtrail:workout_programs';
const WORKOUT_HISTORY_KEY = '@treadtrail:workout_history';
const STATS_KEY = '@treadtrail:stats';
const FAVORITE_WORKOUTS_KEY = '@treadtrail:favorite_workouts';

// Initial stats
const INITIAL_STATS: Stats = {
  lastUpdated: new Date().toISOString(),
  stats: {
    totalWorkouts: 0,
    totalDuration: 0,
    totalSegmentsCompleted: 0,
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
}

// Define initial state
const initialState: WorkoutProgramsState = {
  workoutPrograms: [],
  workoutHistory: [],
  stats: INITIAL_STATS,
  isLoading: true,
  error: null,
};

// Async thunks
const fetchWorkoutPrograms = createAsyncThunk(
  'workoutPrograms/fetch',
  async (_, { rejectWithValue }) => {
    try {
      // Always use default workout programs for structure
      const workoutPrograms = [...DEFAULT_WORKOUT_PROGRAMS];
      
      // Try to load favorite workout IDs from storage
      const storedFavorites = await AsyncStorage.getItem(FAVORITE_WORKOUTS_KEY);
      
      if (storedFavorites) {
        const favoriteIds = JSON.parse(storedFavorites) as string[];
        
        // Apply favorite status to workout programs
        return workoutPrograms.map(workout => ({
          ...workout,
          favorite: favoriteIds.includes(workout.id)
        }));
      } else {
        return workoutPrograms;
      }
    } catch (error) {
      return rejectWithValue('Failed to fetch workout programs');
    }
  }
);

const fetchWorkoutHistory = createAsyncThunk(
  'workoutPrograms/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      // Load workout history from storage
      const storedHistory = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      if (storedHistory) {
        return JSON.parse(storedHistory) as WorkoutSession[];
      } else {
        // Initialize empty history
        await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify([]));
        return [] as WorkoutSession[];
      }
    } catch (error) {
      return rejectWithValue('Failed to fetch workout history');
    }
  }
);

const fetchStats = createAsyncThunk(
  'workoutPrograms/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Load stats from storage
      const storedStats = await AsyncStorage.getItem(STATS_KEY);
      
      let stats: Stats;
      if (storedStats) {
        // Use stored stats if available
        stats = JSON.parse(storedStats);
      } else {
        // Use initial stats if none stored
        stats = INITIAL_STATS;
      }
      
      // Get current state
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms } = state.workoutPrograms;
      
      // Recalculate stats based on current workout history
      const updatedStats = calculateStats(workoutHistory, workoutPrograms);
      
      // Save stats to AsyncStorage
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      
      return updatedStats;
    } catch (error) {
      return rejectWithValue('Failed to fetch stats');
    }
  }
);

// We've removed the toggleFavorite thunk and are using directSetFavorite reducer instead

const addWorkoutSession = createAsyncThunk(
  'workoutPrograms/addWorkoutSession',
  async (session: WorkoutSession, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms } = state.workoutPrograms;
      
      // Add session to history
      const updatedHistory = [session, ...workoutHistory];
      
      // Persist updated history
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      // Update workout's lastUsed
      const updatedPrograms = workoutPrograms.map(workout => {
        if (workout.id === session.workoutId) {
          return { ...workout, lastUsed: session.date };
        }
        return workout;
      });
      
      // Persist updated programs
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
      
      // Update stats after adding a new workout session
      const updatedStats = calculateStats(updatedHistory, state.workoutPrograms.workoutPrograms);
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      
      return {
        session,
        updatedPrograms,
      };
    } catch (error) {
      return rejectWithValue('Failed to save workout session');
    }
  }
);

const updateStats = createAsyncThunk(
  'workoutPrograms/updateStats',
  async (newStats: Partial<Stats>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms, stats } = state.workoutPrograms;
      
      // Clone current stats
      const updatedStats: Stats = {
        ...state.workoutPrograms.stats,
        ...newStats,
        lastUpdated: new Date().toISOString(),
      };
      
      // Helper function to find workout by ID
      const getWorkoutById = (id: string): WorkoutProgram | undefined => {
        return workoutPrograms.find(workout => workout.id === id);
      };
      
      // Calculate new stats
      const calculatedStats = {
        totalWorkouts: workoutHistory.length,
        totalDuration: workoutHistory.reduce((sum, session) => sum + (session.duration || 0), 0),
        totalSegmentsCompleted: workoutHistory.reduce((sum, session) => {
          // Add safety check for sessions that might have undefined segments
          if (!session.segments) {
            return sum;
          }
          return sum + session.segments.filter(segment => segment && !segment.skipped).length;
        }, 0),
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
        const workout = getWorkoutById(session.workoutId);
        if (workout) {
          // Make sure the values exist in our enum objects
          if (workout.category && calculatedStats.workoutsByCategory[workout.category] !== undefined) {
            calculatedStats.workoutsByCategory[workout.category]++;
          }
          
          if (workout.focus && calculatedStats.workoutsByFocus[workout.focus] !== undefined) {
            calculatedStats.workoutsByFocus[workout.focus]++;
          }
        }
      });
      
      calculatedStats.longestWorkout = {
        duration: longestDuration,
        date: longestDate,
      };
      
      // Save updated stats
      updatedStats.stats = calculatedStats;
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      
      return updatedStats;
    } catch (error) {
      return rejectWithValue('Failed to update stats');
    }
  }
);

const initializeFavoriteWorkouts = createAsyncThunk(
  'workoutPrograms/initializeFavorites',
  async (_, { dispatch, getState }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      
      // Get all favorite workout IDs from current state
      const favoriteIds = state.workoutPrograms.workoutPrograms
        .filter(workout => Boolean(workout.favorite))
        .map(workout => workout.id);
      
      // Store them in AsyncStorage
      await AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(favoriteIds));
      console.log('[workoutProgramsSlice] Initialized favorite workouts:', favoriteIds);
      
      return favoriteIds;
    } catch (error) {
      return [];
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
        AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(favoriteIds))
          .catch(err => console.error('AsyncStorage error:', err));
      }
    }
  },
  extraReducers: (builder) => {
    // Handle fetchWorkoutPrograms
    builder.addCase(fetchWorkoutPrograms.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkoutPrograms.fulfilled, (state, action) => {
      state.workoutPrograms = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchWorkoutPrograms.rejected, (state, action) => {
      state.error = action.payload as string;
      state.isLoading = false;
    });
    
    // Handle fetchWorkoutHistory
    builder.addCase(fetchWorkoutHistory.pending, (state) => {
      // Processing
    });
    builder.addCase(fetchWorkoutHistory.fulfilled, (state, action) => {
      state.workoutHistory = action.payload;
    });
    builder.addCase(fetchWorkoutHistory.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle fetchStats
    builder.addCase(fetchStats.pending, (state) => {
      // Processing
    });
    builder.addCase(fetchStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });
    builder.addCase(fetchStats.rejected, (state, action) => {
      // Handle error
    });
    
    // We removed toggleFavorite handlers and are using directSetFavorite reducer instead
    
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
    
    // Handle updateStats
    builder.addCase(updateStats.pending, (state) => {
      // Processing
    });
    builder.addCase(updateStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });
    builder.addCase(updateStats.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle initializeFavoriteWorkouts
    builder.addCase(initializeFavoriteWorkouts.pending, (state) => {
      // Processing
    });
    builder.addCase(initializeFavoriteWorkouts.fulfilled, (state, action) => {
      // No state update needed
    });
    builder.addCase(initializeFavoriteWorkouts.rejected, (state, action) => {
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

// Export reducer
export default workoutProgramsSlice.reducer;

// Export async thunks
export {
  fetchWorkoutPrograms,
  fetchWorkoutHistory,
  fetchStats,
  addWorkoutSession,
  updateStats,
  initializeFavoriteWorkouts
};

// Helper selectors
export const selectWorkoutById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutPrograms.find(workout => workout.id === id);

export const selectSessionById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutHistory.find(session => session.id === id);

function calculateStats(workoutHistory: WorkoutSession[], workoutPrograms: WorkoutProgram[]): Stats {
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
  });

  statsData.longestWorkout = {
    duration: longestDuration,
    date: longestDate,
  };

  // Create the full Stats object
  return {
    stats: statsData,
    lastUpdated: new Date().toISOString(),
    achievements: []
  };
}