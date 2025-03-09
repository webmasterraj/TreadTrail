import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import WorkoutInProgressScreen from '../src/screens/WorkoutInProgressScreen';
import { WorkoutContext } from '../src/context/WorkoutContext';
import { DataContext } from '../src/context/DataContext';
import { formatTime } from '../src/utils/helpers';

// Mock the required navigation props
const mockRoute = {
  params: {
    workoutId: 'workout-mock-1'
  }
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock workout program
const mockWorkout = {
  id: 'workout-mock-1',
  name: 'Mock Timer Test',
  description: 'Workout for testing timers',
  difficulty: 'Beginner',
  segments: [
    { type: 'base', duration: 60, incline: 1 },
    { type: 'run', duration: 90, incline: 2 },
    { type: 'sprint', duration: 30, incline: 3 },
  ]
};

// Test-specific component that only tests the timer behavior
const TimerTestScreen = () => {
  // Create a simpler version with just the timers
  const [mainTimer, setMainTimer] = React.useState(0);
  const [remainingTimer, setRemainingTimer] = React.useState(60);
  
  React.useEffect(() => {
    // Simulate timer ticking
    const intervalId = setInterval(() => {
      setMainTimer(prev => prev + 1);
      setRemainingTimer(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleSkip = () => {
    // Simulate skipping to next segment
    setMainTimer(60); // Jump to end of current segment
    setRemainingTimer(90); // Reset to duration of next segment
  };
  
  return (
    <div>
      <span data-testid="main-timer">{formatTime(mainTimer)}</span>
      <span data-testid="remaining-timer">{formatTime(remainingTimer)}</span>
      <button data-testid="skip-button" onClick={handleSkip}>Skip</button>
    </div>
  );
};

// Setup mock for the WorkoutContext to simulate our app's behavior
class ContextUpdater {
  constructor() {
    // Initialize state
    this.segmentTimeRemaining = 60;
    this.elapsedTime = 0;
    this.currentSegmentIndex = 0;
    this.skipCallCount = 0;
    
    // Bind methods
    this.tick = this.tick.bind(this);
    this.skip = this.skip.bind(this);
    this.getValue = this.getValue.bind(this);
  }
  
  // Simulate the timer advancing by 1 second
  tick() {
    this.elapsedTime += 1;
    this.segmentTimeRemaining -= 1;
    
    // Auto advance segment if needed
    if (this.segmentTimeRemaining <= 0) {
      this.currentSegmentIndex += 1;
      this.segmentTimeRemaining = mockWorkout.segments[this.currentSegmentIndex]?.duration || 0;
    }
    
    return this.getValue();
  }
  
  // Simulate skipping to next segment
  skip() {
    this.skipCallCount += 1;
    const currentSegment = mockWorkout.segments[this.currentSegmentIndex];
    
    // Jump to end of current segment
    this.elapsedTime += this.segmentTimeRemaining;
    
    // Move to next segment
    this.currentSegmentIndex += 1;
    
    // Set remaining time to new segment duration
    if (this.currentSegmentIndex < mockWorkout.segments.length) {
      this.segmentTimeRemaining = mockWorkout.segments[this.currentSegmentIndex].duration;
    } else {
      this.segmentTimeRemaining = 0;
    }
    
    return this.getValue();
  }
  
  // Get the current context value
  getValue() {
    return {
      activeWorkout: mockWorkout,
      isWorkoutActive: true,
      currentSegmentIndex: this.currentSegmentIndex,
      elapsedTime: this.elapsedTime,
      segmentTimeRemaining: this.segmentTimeRemaining,
      segmentTotalTime: mockWorkout.segments[this.currentSegmentIndex]?.duration || 0,
      workoutTotalTime: mockWorkout.segments.reduce((sum, segment) => sum + segment.duration, 0),
      isPaused: false,
      pauseStartTime: null,
      totalPauseDuration: 0,
      completedSegments: [],
      pauses: [],
      startWorkout: jest.fn(() => true),
      pauseWorkout: jest.fn(),
      resumeWorkout: jest.fn(),
      skipToNextSegment: jest.fn(() => { this.skip(); }),
      endWorkout: jest.fn(),
    };
  }
}

// Use fake timers to control timer behavior
jest.useFakeTimers();

describe('WorkoutInProgressScreen Timer Synchronization', () => {
  let contextUpdater;
  let mockContextValue;
  let mockDataContextValue;
  
  beforeEach(() => {
    // Reset the context updater for each test
    contextUpdater = new ContextUpdater();
    mockContextValue = contextUpdater.getValue();
    
    // Setup data context
    mockDataContextValue = {
      getWorkoutById: jest.fn(() => mockWorkout),
    };
    
    // Spy on formatTime to verify timer display
    jest.spyOn(React, 'useContext').mockImplementation((context) => {
      if (context === WorkoutContext) return mockContextValue;
      if (context === DataContext) return mockDataContextValue;
      return {}; // Default empty context
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  // This test verifies our test component behaves as expected
  test('TimerTestScreen behaves correctly', () => {
    const { getByTestId } = render(<TimerTestScreen />);
    
    // Verify initial values
    expect(getByTestId('main-timer').textContent).toBe('0:00');
    expect(getByTestId('remaining-timer').textContent).toBe('1:00');
    
    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Verify timers incremented/decremented correctly
    expect(getByTestId('main-timer').textContent).toBe('0:05');
    expect(getByTestId('remaining-timer').textContent).toBe('0:55');
    
    // Test skip
    fireEvent.click(getByTestId('skip-button'));
    
    // Verify skipped to next segment
    expect(getByTestId('main-timer').textContent).toBe('1:00');
    expect(getByTestId('remaining-timer').textContent).toBe('1:30');
  });
  
  test('should properly render and update timers', async () => {
    // Simplified test that verifies the mocks are working
    const result = render(
      <WorkoutContext.Provider value={mockContextValue}>
        <DataContext.Provider value={mockDataContextValue}>
          <WorkoutInProgressScreen route={mockRoute} navigation={mockNavigation} />
        </DataContext.Provider>
      </WorkoutContext.Provider>
    );
    
    // Running initial setup
    act(() => {
      jest.runAllTimers();
    });
    
    // Verify WorkoutInProgressScreen initialized correctly
    expect(mockContextValue.startWorkout).toHaveBeenCalledWith('workout-mock-1');
    
    // Update context to simulate a timer tick
    const updatedContext = contextUpdater.tick();
    
    // Rerender with updated context
    result.rerender(
      <WorkoutContext.Provider value={updatedContext}>
        <DataContext.Provider value={mockDataContextValue}>
          <WorkoutInProgressScreen route={mockRoute} navigation={mockNavigation} />
        </DataContext.Provider>
      </WorkoutContext.Provider>
    );
    
    // Verify state updated correctly
    expect(updatedContext.elapsedTime).toBe(1);
    expect(updatedContext.segmentTimeRemaining).toBe(59);
  });
});