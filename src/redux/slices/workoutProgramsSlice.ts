import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutProgram, WorkoutSession, Stats } from '../../types';
import { DEFAULT_WORKOUT_PROGRAMS } from '../../constants/workoutData';

// Storage keys
const WORKOUT_PROGRAMS_KEY = '@treadtrail:workout_programs';
const WORKOUT_HISTORY_KEY = '@treadtrail:workout_history';
const STATS_KEY = '@treadtrail:stats';

// Initial stats
const INITIAL_STATS: Stats = {
  lastUpdated: new Date().toISOString(),
  stats: {
    totalWorkouts: 0,
    totalDuration: 0,
    totalSegmentsCompleted: 0,
    workoutsByDifficulty: {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
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
export const fetchWorkoutPrograms = createAsyncThunk(
  'workoutPrograms/fetch',
  async (_, { rejectWithValue }) => {
    try {
      // Always use default workout programs
      console.log('[workoutProgramsSlice] Using default workout programs');
      return DEFAULT_WORKOUT_PROGRAMS;
    } catch (error) {
      return rejectWithValue('Failed to fetch workout programs');
    }
  }
);

export const fetchWorkoutHistory = createAsyncThunk(
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

export const fetchStats = createAsyncThunk(
  'workoutPrograms/fetchStats',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      // Load stats from storage
      const storedStats = await AsyncStorage.getItem(STATS_KEY);
      let stats;
      
      if (storedStats) {
        stats = JSON.parse(storedStats) as Stats;
      } else {
        // Initialize empty stats
        await AsyncStorage.setItem(STATS_KEY, JSON.stringify(INITIAL_STATS));
        stats = INITIAL_STATS;
      }
      
      // Force a recalculation of stats based on current workout history
      await dispatch(updateStats()).unwrap();
      
      // Return the recalculated stats by getting them from state after updateStats
      const newState = getState() as { workoutPrograms: WorkoutProgramsState };
      return newState.workoutPrograms.stats;
    } catch (error) {
      console.error('Error in fetchStats:', error);
      return rejectWithValue('Failed to fetch stats');
    }
  }
);

// We've removed the toggleFavorite thunk and are using directSetFavorite reducer instead

export const addWorkoutSession = createAsyncThunk(
  'workoutPrograms/addSession',
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
      
      // Trigger stats update
      await dispatch(updateStats()).unwrap();
      
      return {
        session,
        updatedPrograms,
      };
    } catch (error) {
      console.error('Error in addWorkoutSession thunk:', error);
      return rejectWithValue('Failed to save workout session');
    }
  }
);

export const updateStats = createAsyncThunk(
  'workoutPrograms/updateStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms, stats } = state.workoutPrograms;
      
      // Clone current stats
      const newStats: Stats = JSON.parse(JSON.stringify(stats));
      newStats.lastUpdated = new Date().toISOString();
      
      // Helper function to find workout by ID
      const getWorkoutById = (id: string): WorkoutProgram | undefined => {
        return workoutPrograms.find(workout => workout.id === id);
      };
      
      // Calculate new stats
      const updatedStats = {
        totalWorkouts: workoutHistory.length,
        totalDuration: workoutHistory.reduce((sum, session) => sum + (session.duration || 0), 0),
        totalSegmentsCompleted: workoutHistory.reduce((sum, session) => {
          // Add safety check for sessions that might have undefined segments
          if (!session.segments) {
            return sum;
          }
          return sum + session.segments.filter(segment => segment && !segment.skipped).length;
        }, 0),
        workoutsByDifficulty: {
          beginner: 0,
          intermediate: 0,
          advanced: 0,
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
          console.log(`DEBUG_STATS: Session has no workoutId`, session);
          return;
        }
        
        // Count by difficulty and focus
        const workout = getWorkoutById(session.workoutId);
        if (workout) {
          // Make sure the values exist in our enum objects
          if (workout.difficulty && updatedStats.workoutsByDifficulty[workout.difficulty] !== undefined) {
            updatedStats.workoutsByDifficulty[workout.difficulty]++;
          }
          
          if (workout.focus && updatedStats.workoutsByFocus[workout.focus] !== undefined) {
            updatedStats.workoutsByFocus[workout.focus]++;
          }
        }
      });
      
      updatedStats.longestWorkout = {
        duration: longestDuration,
        date: longestDate,
      };
      
      // Save updated stats
      newStats.stats = updatedStats;
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      
      return newStats;
    } catch (error) {
      console.error('Error in updateStats thunk:', error);
      return rejectWithValue('Failed to update stats');
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
        
        // Persist to storage asynchronously
        AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(state.workoutPrograms))
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
  },
});

// Export actions
export const { toggleWorkoutFavorite } = workoutProgramsSlice.actions;

// Export reducer
export default workoutProgramsSlice.reducer;

// Selectors
export const selectWorkoutPrograms = (state: { workoutPrograms: WorkoutProgramsState }) => 
  state.workoutPrograms.workoutPrograms;

export const selectWorkoutHistory = (state: { workoutPrograms: WorkoutProgramsState }) => 
  state.workoutPrograms.workoutHistory;

export const selectStats = (state: { workoutPrograms: WorkoutProgramsState }) => 
  state.workoutPrograms.stats;

export const selectIsLoading = (state: { workoutPrograms: WorkoutProgramsState }) => 
  state.workoutPrograms.isLoading;

export const selectError = (state: { workoutPrograms: WorkoutProgramsState }) => 
  state.workoutPrograms.error;

// Helper selectors
export const selectWorkoutById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutPrograms.find(workout => workout.id === id);

export const selectSessionById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutHistory.find(session => session.id === id);