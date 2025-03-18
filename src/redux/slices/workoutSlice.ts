import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getWorkoutById } from '../../utils/workoutData';
import { Workout, WorkoutSegment } from '../../types/workout';

// Define types for workout state
export interface WorkoutState {
  // Workout data
  activeWorkout: Workout | null;
  
  // Timer state
  isRunning: boolean;
  startTime: number | null;        // Timestamp when workout started
  elapsedTime: number;             // Total elapsed time in seconds (integer)
  pausedTime: number;              // Time spent in paused state (integer)
  lastTickTime: number | null;     // Last time the timer ticked
  
  // Segment state
  currentSegmentIndex: number;
  segmentStartTime: number | null; // Timestamp when segment started
  segmentElapsedTime: number;      // Elapsed time in current segment (integer)
  
  // UI state
  isSkipping: boolean;             // Whether skip operation is in progress
  isTransitioning: boolean;        // Whether segment transition is happening
  isCompleted: boolean;            // Whether the workout has been completed
  
  // Debug state
  debugInfo: {
    lastAction: string;
    actionTimestamp: number;
    timerSyncDelta: number;        // Difference between timers for debugging
  };
}

// Define initial state
const initialState: WorkoutState = {
  activeWorkout: null,
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  pausedTime: 0,
  lastTickTime: null,
  currentSegmentIndex: 0,
  segmentStartTime: null,
  segmentElapsedTime: 0,
  isSkipping: false,
  isTransitioning: false,
  isCompleted: false,
  debugInfo: {
    lastAction: '',
    actionTimestamp: 0,
    timerSyncDelta: 0,
  },
};

// Async thunks
export const startWorkout = createAsyncThunk(
  'workout/start',
  async (workoutId: string, { rejectWithValue }) => {
    try {
      const workout = getWorkoutById(workoutId);
      if (!workout || workout.segments.length === 0) {
        return rejectWithValue('Invalid workout or no segments found');
      }
      return workout;
    } catch (error) {
      return rejectWithValue('Failed to start workout');
    }
  }
);

export const skipSegment = createAsyncThunk(
  'workout/skipSegment',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { workout: WorkoutState };
    const { workout } = state;
    
    // Prevent skipping if no active workout
    if (!workout.activeWorkout) {
      return rejectWithValue('Cannot skip segment');
    }
    
    // Prevent skipping if on last segment
    if (workout.currentSegmentIndex >= workout.activeWorkout.segments.length - 1) {
      return rejectWithValue('Already on last segment');
    }
    
    return {
      timestamp: Date.now(),
    };
  }
);

// Create workout slice
const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    pauseWorkout: (state) => {
      if (state.isRunning) {
        state.isRunning = false;
        state.debugInfo.lastAction = 'pause';
        state.debugInfo.actionTimestamp = Date.now();
      }
    },
    resumeWorkout: (state) => {
      if (!state.isRunning && state.activeWorkout) {
        state.isRunning = true;
        state.lastTickTime = Date.now();
        state.debugInfo.lastAction = 'resume';
        state.debugInfo.actionTimestamp = Date.now();
      }
    },
    endWorkout: (state) => {
      // Keep a reference to the workout data before clearing state
      // The async thunk will use this data to create a session
      const sessionData = {
        activeWorkout: state.activeWorkout,
        elapsedTime: state.elapsedTime,
        currentSegmentIndex: state.currentSegmentIndex,
        segmentElapsedTime: state.segmentElapsedTime,
        startTime: state.startTime,
      };
      
      // Store this data somewhere it can be accessed by the endWorkout thunk
      // For simplicity, we're returning to initial state, but in a real implementation
      // you'd dispatch another action to save the session
      
      return initialState;
    },
    timerTick: (state, action: PayloadAction<{ timestamp: number }>) => {
      if (!state.isRunning || !state.activeWorkout) return;
      
      const { timestamp } = action.payload;
      const lastTickTime = state.lastTickTime || timestamp;
      const deltaTime = (timestamp - lastTickTime) / 1000; // Convert to seconds
      
      // Update elapsed time - always round down for elapsed time (counts up)
      state.elapsedTime = Math.floor(state.elapsedTime + deltaTime);
      
      // Update segment elapsed time - always round down for elapsed time
      if (state.currentSegmentIndex < state.activeWorkout.segments.length) {
        const currentSegment = state.activeWorkout.segments[state.currentSegmentIndex];
        state.segmentElapsedTime = Math.min(
          currentSegment.duration,  // Cap at segment duration
          Math.floor(state.segmentElapsedTime + deltaTime)
        );
        
        // Check if segment is complete
        if (state.segmentElapsedTime >= currentSegment.duration && !state.isTransitioning) {
          // Auto-advance to next segment if not on last segment
          if (state.currentSegmentIndex < state.activeWorkout.segments.length - 1) {
            state.isTransitioning = true;
            state.currentSegmentIndex += 1;
            state.segmentElapsedTime = 0;
            state.segmentStartTime = timestamp;
            state.isTransitioning = false;
            state.debugInfo.lastAction = 'auto-advance';
            state.debugInfo.actionTimestamp = timestamp;
          } else {
            // This is the last segment and it's complete - mark the workout as complete
            // We don't actually end the workout here, as that would lose state
            // Instead, we set a new state flag that the component can check
            state.isCompleted = true;
            state.debugInfo.lastAction = 'auto-complete';
            state.debugInfo.actionTimestamp = timestamp;
          }
        }
      }
      
      // Update last tick time
      state.lastTickTime = timestamp;
      
      // Update debug info
      const currentSegment = state.activeWorkout.segments[state.currentSegmentIndex];
      const segmentRemaining = currentSegment.duration - state.segmentElapsedTime;
      state.debugInfo.timerSyncDelta = segmentRemaining;
    },
    resetSkipState: (state) => {
      state.isSkipping = false;
    },
  },
  extraReducers: (builder) => {
    // Handle startWorkout
    builder.addCase(startWorkout.fulfilled, (state, action) => {
      const now = Date.now();
      state.activeWorkout = action.payload;
      state.isRunning = true;
      state.startTime = now;
      state.lastTickTime = now;
      state.elapsedTime = 0; // Start at exactly 0 seconds
      state.pausedTime = 0;  // Start with 0 pause time
      state.currentSegmentIndex = 0;
      state.segmentStartTime = now;
      state.segmentElapsedTime = 0; // Start at exactly 0 seconds in segment
      state.isSkipping = false;
      state.isTransitioning = false;
      state.debugInfo = {
        lastAction: 'start',
        actionTimestamp: now,
        timerSyncDelta: 0,
      };
    });
    
    // Handle skipSegment
    builder.addCase(skipSegment.fulfilled, (state, action) => {
      if (!state.activeWorkout) return;
      
      const { timestamp } = action.payload;
      
      // Set skipping flag
      state.isSkipping = true;
      state.isTransitioning = true;
      
      // Get current segment
      const currentSegment = state.activeWorkout.segments[state.currentSegmentIndex];
      
      // Calculate remaining time in current segment (as integer)
      // Use Math.ceil for remaining time to be consistent with the display calculation
      const segmentRemaining = Math.ceil(currentSegment.duration - state.segmentElapsedTime);
      
      // Add remaining time to elapsed time (effectively skipping the segment)
      // Continue using Math.floor for elapsed time to be consistent with the timer tick calculation
      state.elapsedTime = Math.floor(state.elapsedTime + segmentRemaining);
      
      // Move to next segment
      state.currentSegmentIndex += 1;
      
      // Reset segment elapsed time
      state.segmentElapsedTime = 0;
      state.segmentStartTime = timestamp;
      
      // Update debug info
      state.debugInfo = {
        lastAction: 'skip',
        actionTimestamp: timestamp,
        timerSyncDelta: 0,
      };
      
      // Clear transition flag
      state.isTransitioning = false;
    });
    
    // Handle skip rejection
    builder.addCase(skipSegment.rejected, (state) => {
      state.isSkipping = false;
      state.isTransitioning = false;
    });
  },
});

// Export actions
export const { 
  pauseWorkout, 
  resumeWorkout, 
  endWorkout, 
  timerTick,
  resetSkipState
} = workoutSlice.actions;

// Export reducer
export default workoutSlice.reducer;

// Selectors
export const selectActiveWorkout = (state: { workout: WorkoutState }) => state.workout.activeWorkout;
export const selectIsRunning = (state: { workout: WorkoutState }) => state.workout.isRunning;
export const selectElapsedTime = (state: { workout: WorkoutState }) => state.workout.elapsedTime;
export const selectCurrentSegmentIndex = (state: { workout: WorkoutState }) => state.workout.currentSegmentIndex;
export const selectSegmentElapsedTime = (state: { workout: WorkoutState }) => state.workout.segmentElapsedTime;
export const selectIsSkipping = (state: { workout: WorkoutState }) => state.workout.isSkipping;
export const selectIsCompleted = (state: { workout: WorkoutState }) => state.workout.isCompleted;
export const selectDebugInfo = (state: { workout: WorkoutState }) => state.workout.debugInfo;

// Computed selectors
export const selectCurrentSegment = (state: { workout: WorkoutState }) => {
  const { activeWorkout, currentSegmentIndex } = state.workout;
  if (!activeWorkout || !activeWorkout.segments || activeWorkout.segments.length === 0) {
    return null;
  }
  return activeWorkout.segments[currentSegmentIndex] || null;
};

export const selectSegmentRemaining = (state: { workout: WorkoutState }) => {
  const { activeWorkout, currentSegmentIndex, segmentElapsedTime } = state.workout;
  if (!activeWorkout || !activeWorkout.segments || activeWorkout.segments.length === 0) {
    return 0;
  }
  
  const currentSegment = activeWorkout.segments[currentSegmentIndex];
  if (!currentSegment) return 0;
  
  // Always round up for remaining time (counts down)
  // This ensures we don't show 0 prematurely and matches how countdown timers typically work
  return Math.max(0, Math.ceil(currentSegment.duration - segmentElapsedTime));
};

export const selectTotalDuration = (state: { workout: WorkoutState }) => {
  const { activeWorkout } = state.workout;
  if (!activeWorkout || !activeWorkout.segments) return 0;
  
  return activeWorkout.segments.reduce((total, segment) => total + segment.duration, 0);
};

export const selectWorkoutProgress = (state: { workout: WorkoutState }) => {
  const { activeWorkout, elapsedTime } = state.workout;
  if (!activeWorkout || !activeWorkout.segments) return 0;
  
  const totalDuration = activeWorkout.segments.reduce((total, segment) => total + segment.duration, 0);
  return totalDuration > 0 ? Math.min(1, elapsedTime / totalDuration) : 0;
};

// Format time helper (mm:ss)
export const formatTime = (seconds: number): string => {
  // For counting down timers, round up to show complete seconds remaining
  // For counting up timers, the default Math.floor is fine
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format time specifically for countdown timers - rounds up to show complete seconds remaining
export const formatCountdownTime = (seconds: number): string => {
  // Round up to the nearest second for countdown display
  const roundedSeconds = Math.ceil(seconds);
  const mins = Math.floor(roundedSeconds / 60);
  const secs = roundedSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
