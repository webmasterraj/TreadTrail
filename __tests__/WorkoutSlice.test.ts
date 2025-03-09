import * as workoutSlice from '../src/redux/slices/workoutSlice';

describe('WorkoutSlice Redux Integration', () => {
  // Set up mock workout data
  const mockWorkout = {
    id: 'workout-123',
    name: 'Test Workout',
    segments: [
      { type: 'recovery', duration: 30, incline: 1 },
      { type: 'run', duration: 60, incline: 2 },
      { type: 'sprint', duration: 45, incline: 3 }
    ]
  };

  // Mock initial state
  const initialState = {
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
    debugInfo: {
      lastAction: '',
      actionTimestamp: 0,
      timerSyncDelta: 0,
    }
  };

  // Mock getWorkoutById function
  jest.mock('../src/context/DataContext', () => ({
    getWorkoutById: jest.fn(() => mockWorkout)
  }));

  test('timer tick updates elapsed time and segment time correctly', () => {
    // Set up an active workout state
    let state = {
      ...initialState,
      activeWorkout: mockWorkout,
      isRunning: true,
      startTime: 1000,
      lastTickTime: 1000,
      segmentStartTime: 1000,
    };

    // First tick after 1 second
    const firstTickTime = 2000;
    state = workoutSlice.default(state, workoutSlice.timerTick({ timestamp: firstTickTime }));
    
    // Check that the times updated correctly
    expect(state.elapsedTime).toBe(1); // 1 second elapsed
    expect(state.segmentElapsedTime).toBe(1); // 1 second elapsed in segment
    expect(state.lastTickTime).toBe(firstTickTime);
    
    // Second tick after another second
    const secondTickTime = 3000;
    state = workoutSlice.default(state, workoutSlice.timerTick({ timestamp: secondTickTime }));
    
    // Check times again
    expect(state.elapsedTime).toBe(2); // 2 seconds elapsed total
    expect(state.segmentElapsedTime).toBe(2); // 2 seconds elapsed in segment
    expect(state.lastTickTime).toBe(secondTickTime);
  });

  test('skip segment moves to next segment and updates times correctly', () => {
    // Set up an active workout with some elapsed time
    let state = {
      ...initialState,
      activeWorkout: mockWorkout,
      isRunning: true,
      currentSegmentIndex: 0,
      elapsedTime: 10,
      segmentElapsedTime: 10,
      segmentStartTime: 1000,
    };
    
    // Call skipSegment with a timestamp
    const skipTime = 2000;
    const action = {
      type: workoutSlice.skipSegment.fulfilled.type,
      payload: { timestamp: skipTime }
    };
    
    state = workoutSlice.default(state, action);
    
    // Verify segment changed
    expect(state.currentSegmentIndex).toBe(1);
    
    // Verify elapsed time updated (should add remaining time in segment)
    // First segment duration is 30, we had 10 elapsed, so 20 more added
    expect(state.elapsedTime).toBe(30);
    
    // Segment elapsed time should reset
    expect(state.segmentElapsedTime).toBe(0);
    
    // Segment start time should update
    expect(state.segmentStartTime).toBe(skipTime);
    
    // Skip flags should be set
    expect(state.isSkipping).toBe(true);
  });

  test('timer tick updates values properly during segment transition', () => {
    // Set up an active workout with segment almost complete
    let state = {
      ...initialState,
      activeWorkout: mockWorkout,
      isRunning: true,
      currentSegmentIndex: 0,
      elapsedTime: 29,
      segmentElapsedTime: 29, // 1 second from completion
      isTransitioning: false,
      lastTickTime: 1000
    };
    
    // Tick to complete the segment
    const tickTime = 2000;
    state = workoutSlice.default(state, workoutSlice.timerTick({ timestamp: tickTime }));
    
    // Verify elapsed time increments correctly
    expect(state.elapsedTime).toBeGreaterThan(29);
    
    // Last tick time gets updated
    expect(state.lastTickTime).toBe(tickTime);
    
    // Debug info is updated
    expect(state.debugInfo.lastAction).toBeDefined();
  });

  test('pause and resume work correctly', () => {
    // Set up an active workout
    let state = {
      ...initialState,
      activeWorkout: mockWorkout,
      isRunning: true,
      elapsedTime: 15,
    };
    
    // Pause the workout
    state = workoutSlice.default(state, workoutSlice.pauseWorkout());
    
    // Verify workout is paused
    expect(state.isRunning).toBe(false);
    
    // Timer ticks should not update times when paused
    const tickTime = 2000;
    const pausedState = workoutSlice.default(state, workoutSlice.timerTick({ timestamp: tickTime }));
    
    // Times should not change
    expect(pausedState.elapsedTime).toBe(15);
    
    // Resume the workout
    const resumedState = workoutSlice.default(state, workoutSlice.resumeWorkout());
    
    // Verify workout is running again
    expect(resumedState.isRunning).toBe(true);
    expect(resumedState.lastTickTime).not.toBeNull();
  });
});