import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { selectWorkoutById } from './workoutProgramsSlice';
import { WorkoutProgram, WorkoutSegment as Segment } from '../../types';

// Define types for workout state
export interface WorkoutState {
  // Workout data
  activeWorkout: WorkoutProgram | null;
  
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
  
  // Progress indicator state
  progressIndicatorPosition: number; // Position as a percentage (0-100)
  
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
  progressIndicatorPosition: 0,
  debugInfo: {
    lastAction: '',
    actionTimestamp: 0,
    timerSyncDelta: 0,
  },
};

// Async thunks
export const loadWorkout = createAsyncThunk(
  'workout/load',
  async (workoutId: string, { rejectWithValue, getState }) => {
    try {
      console.log('[workoutSlice] Loading workout with ID:', workoutId);
      const state = getState() as any;
      const workout = selectWorkoutById(workoutId)(state);
      
      if (!workout) {
        console.error('[workoutSlice] Workout not found for ID:', workoutId);
        return rejectWithValue('Workout not found');
      }
      
      if (!workout.segments || workout.segments.length === 0) {
        console.error('[workoutSlice] Workout has no segments:', workoutId);
        return rejectWithValue('Workout has no segments');
      }
      
      console.log(`[workoutSlice] Workout ${workout.name} has ${workout.segments.length} segments`);
      workout.segments.forEach((segment, index) => {
        console.log(`[workoutSlice] Segment ${index}:`, JSON.stringify({
          type: segment.type,
          duration: segment.duration,
          incline: segment.incline,
          audio: segment.audio
        }, null, 2));
      });
      
      const workoutCopy = JSON.parse(JSON.stringify(workout));
      
      console.log('[workoutSlice] Successfully loaded workout:', workout.name);
      return workoutCopy;
    } catch (error) {
      console.error('[workoutSlice] Error loading workout:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load workout');
    }
  }
);

export const startWorkout = createAsyncThunk(
  'workout/start',
  async (workoutId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const workout = selectWorkoutById(workoutId)(state);
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
    
    return {
      timestamp: Date.now(),
      isLastSegment: workout.currentSegmentIndex >= workout.activeWorkout.segments.length - 1
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
      if (!state.activeWorkout || !state.isRunning) return;
      
      const { timestamp } = action.payload;
      
      if (state.lastTickTime === null) {
        // First tick after starting or resuming
        state.lastTickTime = timestamp;
        return;
      }
      
      // Skip this tick if we're currently skipping a segment
      if (state.isSkipping) {
        state.lastTickTime = timestamp;
        return;
      }
      
      // Calculate elapsed time since last tick
      const elapsedSinceLastTick = Math.floor((timestamp - state.lastTickTime) / 1000);
      
      // Ignore ticks that are too close together (less than 1 second)
      if (elapsedSinceLastTick < 1) {
        return;
      }
      
      // Store previous values for debugging
      const prevElapsedTime = state.elapsedTime;
      const prevSegmentElapsedTime = state.segmentElapsedTime;
      
      // Update elapsed times
      if (state.startTime !== null) {
        // Calculate total elapsed time based on start time and paused time
        const rawElapsedTime = Math.floor((timestamp - state.startTime) / 1000) - state.pausedTime;
        
        // Update segment elapsed time
        if (state.segmentStartTime !== null) {
          state.segmentElapsedTime = Math.floor((timestamp - state.segmentStartTime) / 1000);
        }
        
        // Only update elapsed time if it's different to avoid unnecessary renders
        if (rawElapsedTime !== state.elapsedTime) {
          // Don't update elapsed time if it would result in a large jump backward
          // This prevents resetting progress after a skip
          if (rawElapsedTime < state.elapsedTime && state.elapsedTime - rawElapsedTime > 10) {
            // Keep the current elapsed time but update segment elapsed time
            state.segmentElapsedTime += elapsedSinceLastTick;
          } else {
            state.elapsedTime = rawElapsedTime;
          }
        }
      }
      
      // Get current segment
      const currentSegment = state.activeWorkout.segments[state.currentSegmentIndex];
      
      // Check if segment is complete
      if (state.segmentElapsedTime >= currentSegment.duration) {
        // Segment is complete, move to next segment
        const isLastSegment = state.currentSegmentIndex === state.activeWorkout.segments.length - 1;
        
        if (!isLastSegment) {
          // Move to next segment
          state.currentSegmentIndex += 1;
          state.segmentStartTime = timestamp;
          state.segmentElapsedTime = 0;
          state.isTransitioning = true;
        } else {
          // Workout complete
          state.isCompleted = true;
          state.isRunning = false;
        }
      }
      
      // Update progress indicator position if needed
      if (state.activeWorkout && !state.isSkipping) {
        const totalDuration = state.activeWorkout.segments.reduce(
          (sum: number, segment: { duration: number }) => sum + segment.duration, 0
        );
        
        if (totalDuration > 0) {
          // Calculate new position based on elapsed time
          const newPosition = Math.min(100, Math.max(0, (state.elapsedTime / totalDuration) * 100));
          
          // Only update if there's a significant change to avoid unnecessary renders
          const positionDiff = Math.abs(newPosition - state.progressIndicatorPosition);
          
          if (positionDiff >= 1 || positionDiff < 0.1) {
            // Update the progress indicator position
            state.progressIndicatorPosition = newPosition;
          }
        }
      }
      
      // Update last tick time
      state.lastTickTime = timestamp;
      
      // Update debug info
      const segmentRemaining = currentSegment.duration - state.segmentElapsedTime;
      state.debugInfo.timerSyncDelta = segmentRemaining;
    },
    resetSkipState: (state) => {
      // Store the current position and elapsed time before resetting
      const currentPosition = state.progressIndicatorPosition;
      const currentElapsedTime = state.elapsedTime;
      
      // Reset skipping flag but preserve other state
      state.isSkipping = false;
      
      // Ensure we don't lose progress indicator position
      state.progressIndicatorPosition = currentPosition;
      
      // Update debug info
      state.debugInfo = {
        ...state.debugInfo,
        lastAction: 'resetSkipState',
        actionTimestamp: Date.now(),
      };
    },
    updateProgressIndicator: (state, action: PayloadAction<{ position: number }>) => {
      const oldPosition = state.progressIndicatorPosition;
      state.progressIndicatorPosition = action.payload.position;
    },
  },
  extraReducers: (builder) => {
    // Handle loadWorkout
    builder.addCase(loadWorkout.fulfilled, (state, action) => {
      state.activeWorkout = action.payload;
      state.isRunning = false;
      state.startTime = null;
      state.lastTickTime = null;
      state.elapsedTime = 0;
      state.pausedTime = 0;
      state.currentSegmentIndex = 0;
      state.segmentStartTime = null;
      state.segmentElapsedTime = 0;
      state.isSkipping = false;
      state.isTransitioning = false;
      state.debugInfo = {
        lastAction: 'load',
        actionTimestamp: Date.now(),
        timerSyncDelta: 0,
      };
    });
    
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
      
      const { timestamp, isLastSegment } = action.payload;
      
      // Set skipping flag
      state.isSkipping = true;
      state.isTransitioning = true;
      
      // Get current segment
      const currentSegment = state.activeWorkout.segments[state.currentSegmentIndex];
      
      // Calculate remaining time in current segment (as integer)
      // Use Math.ceil for remaining time to be consistent with the display calculation
      const segmentRemaining = Math.ceil(currentSegment.duration - state.segmentElapsedTime);
      
      // Store the previous values for debugging
      const prevElapsedTime = state.elapsedTime;
      const prevSegmentIndex = state.currentSegmentIndex;
      
      // Add remaining time to elapsed time (effectively skipping the segment)
      // Continue using Math.floor for elapsed time to be consistent with the timer tick calculation
      state.elapsedTime = Math.floor(state.elapsedTime + segmentRemaining);
      
      // IMPORTANT FIX: Update the startTime to match the new elapsed time
      // This ensures that future rawElapsedTime calculations in timerTick will be correct
      if (state.startTime !== null) {
        // Calculate what the start time should be to match our current elapsed time
        // Formula: startTime = currentTime - (elapsedTime * 1000) - (pausedTime * 1000)
        state.startTime = timestamp - (state.elapsedTime * 1000) - (state.pausedTime * 1000);
      }
      
      // Move to next segment
      state.currentSegmentIndex += 1;
      
      // Reset segment elapsed time and set segment start time
      // IMPORTANT: Set segmentStartTime to the current timestamp to ensure segment elapsed time starts from 0
      state.segmentElapsedTime = 0;
      state.segmentStartTime = timestamp;
      
      // Calculate progress indicator position based on elapsed time
      if (state.activeWorkout) {
        const totalDuration = state.activeWorkout.segments.reduce(
          (sum: number, segment: { duration: number }) => sum + segment.duration, 0
        );
        
        if (totalDuration > 0) {
          // Calculate progress percentage with bounds checking
          const newPosition = Math.min(100, Math.max(0, (state.elapsedTime / totalDuration) * 100));
          
          // Store the previous position for debugging
          const prevPosition = state.progressIndicatorPosition;
          state.progressIndicatorPosition = newPosition;
        }
      }
      
      // Update debug info
      state.debugInfo = {
        lastAction: 'skip',
        actionTimestamp: timestamp,
        timerSyncDelta: 0,
      };
      
      // Clear transition flag
      state.isTransitioning = false;
      
      // If this is the last segment, mark the workout as complete
      if (isLastSegment) {
        state.isCompleted = true;
      }
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
  resetSkipState,
  updateProgressIndicator
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

// Progress indicator selectors
export const selectProgressIndicatorPosition = (state: { workout: WorkoutState }) => 
  state.workout.progressIndicatorPosition;

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
