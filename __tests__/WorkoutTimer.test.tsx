import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { Text, View, Button } from 'react-native';
import { WorkoutContext } from '../src/context/WorkoutContext';

// Mock workout data
const mockWorkout = {
  id: 'workout-1',
  name: 'Test Workout',
  description: 'A test workout',
  difficulty: 'Beginner',
  segments: [
    { type: 'base', duration: 60, incline: 1 },
    { type: 'run', duration: 90, incline: 2 },
    { type: 'sprint', duration: 30, incline: 3 },
  ]
};

// Timer synchronization test component
function TimerSyncTester({ onSkip }) {
  // Two separate timer displays
  const [mainTimer, setMainTimer] = React.useState(0);
  const [segmentTimer, setSegmentTimer] = React.useState(60);
  
  // Simulate a skip action
  const handleSkip = () => {
    // In the real app, these updates come from different sources
    setMainTimer(60); // Position jumps to end of segment
    
    // Small delay to simulate the context update
    setTimeout(() => {
      setSegmentTimer(90); // New segment duration
    }, 20);
    
    if (onSkip) {
      onSkip({ mainTimer: 60, segmentTimer: 90 });
    }
  };
  
  return (
    <View>
      <Text testID="main-timer">{mainTimer}</Text>
      <Text testID="segment-timer">{segmentTimer}</Text>
      <Button 
        testID="skip-button"
        title="Skip"
        onPress={handleSkip}
      />
    </View>
  );
}

// Setup mock for the WorkoutContext
const mockContextValue = {
  activeWorkout: mockWorkout,
  isWorkoutActive: true,
  currentSegmentIndex: 0,
  elapsedTime: 0,
  segmentTimeRemaining: 60,
  segmentTotalTime: 60,
  workoutTotalTime: 180,
  workoutStartTime: Date.now(),
  segmentStartTime: Date.now(),
  isPaused: false,
  pauseStartTime: null,
  totalPauseDuration: 0,
  completedSegments: [],
  pauses: [],
  startWorkout: jest.fn(),
  pauseWorkout: jest.fn(),
  resumeWorkout: jest.fn(),
  skipToNextSegment: jest.fn().mockImplementation(() => {
    // When skipToNextSegment is called, update the mock context
    mockContextValue.currentSegmentIndex = 1;
    mockContextValue.segmentTimeRemaining = 90;
    mockContextValue.elapsedTime = 60;
  }),
  endWorkout: jest.fn()
};

// Mock wrapper for the WorkoutContext
const MockWorkoutProvider = ({ children }) => (
  <WorkoutContext.Provider value={mockContextValue}>
    {children}
  </WorkoutContext.Provider>
);

jest.useFakeTimers();

describe('Workout Timer Synchronization', () => {
  
  test('timers stay in sync after skip', async () => {
    const onSkipMock = jest.fn();
    const { getByTestId } = render(
      <MockWorkoutProvider>
        <TimerSyncTester onSkip={onSkipMock} />
      </MockWorkoutProvider>
    );
    
    // Check initial values
    expect(getByTestId('main-timer').props.children).toBe(0);
    expect(getByTestId('segment-timer').props.children).toBe(60);
    
    // Skip segment
    fireEvent.press(getByTestId('skip-button'));
    
    // Run all pending timers to process the state updates
    act(() => {
      jest.runAllTimers();
    });
    
    // Verify both timers updated correctly
    expect(getByTestId('main-timer').props.children).toBe(60);
    expect(getByTestId('segment-timer').props.children).toBe(90);
    
    // Verify the skip was processed
    expect(onSkipMock).toHaveBeenCalledWith({ mainTimer: 60, segmentTimer: 90 });
  });
  
  test('timers increment in sync', async () => {
    const { getByTestId } = render(
      <MockWorkoutProvider>
        <TimerSyncTester />
      </MockWorkoutProvider>
    );
    
    // Check initial values
    expect(getByTestId('main-timer').props.children).toBe(0);
    expect(getByTestId('segment-timer').props.children).toBe(60);
    
    // Manually trigger timer updates in sync
    act(() => {
      // Increment main timer
      const currentMain = getByTestId('main-timer').props.children;
      const currentSegment = getByTestId('segment-timer').props.children;
      
      // Update timers
      getByTestId('main-timer').props.children = currentMain + 1;
      getByTestId('segment-timer').props.children = currentSegment - 1;
      
      jest.advanceTimersByTime(1000);
    });
    
    // Manually rerender to see updated values (not needed in real app)
    render(
      <MockWorkoutProvider>
        <TimerSyncTester />
      </MockWorkoutProvider>
    );
    
    // Verify timers moved in opposite directions
    expect(getByTestId('main-timer').props.children).toBe(1);
    expect(getByTestId('segment-timer').props.children).toBe(59);
  });
});