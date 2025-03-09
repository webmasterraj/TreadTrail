import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { Text, View, Button } from 'react-native';

/*
 * This test is designed specifically to reproduce the timer sync issue
 * that happens when skipping segments in the WorkoutInProgressScreen.
 *
 * We want to verify:
 * 1. Both timers are in sync initially
 * 2. Both timers remain in sync after skipping
 * 3. Both timers continue to stay in sync as they update after a skip
 */

// Mocked workout segment timer component
function TimerSyncTester() {
  // Timer state
  const [mainTimer, setMainTimer] = React.useState(0);
  const [segmentRemaining, setSegmentRemaining] = React.useState(60);
  const [segmentIndex, setSegmentIndex] = React.useState(0);
  const [skipped, setSkipped] = React.useState(false);
  
  // Simulated segments with durations
  const segments = [
    { duration: 60 },
    { duration: 90 },
    { duration: 30 }
  ];
  
  // Format time for display (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Increment timer every second
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      // Increment main timer
      setMainTimer(prev => prev + 1);
      
      // Decrement segment remaining
      setSegmentRemaining(prev => {
        if (prev <= 1) {
          // Automatically move to next segment if time runs out
          handleNextSegment();
          return segments[segmentIndex + 1]?.duration || 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [segmentIndex]);
  
  // Handle skipping to next segment
  const handleNextSegment = () => {
    if (segmentIndex >= segments.length - 1) return;
    
    setSkipped(true);
    
    const currentSegment = segments[segmentIndex];
    const nextSegment = segments[segmentIndex + 1];
    
    // Update main timer (jump to end of current segment)
    setMainTimer(mainTimer + segmentRemaining);
    
    // Move to next segment
    setSegmentIndex(prev => prev + 1);
    
    // Reset remaining time to next segment duration
    setSegmentRemaining(nextSegment.duration);
    
    // Clear skipped flag after a brief delay
    setTimeout(() => setSkipped(false), 500);
  };
  
  return (
    <View>
      <Text testID="main-timer-raw">{mainTimer}</Text>
      <Text testID="main-timer">{formatTime(mainTimer)}</Text>
      
      <Text testID="remaining-timer-raw">{segmentRemaining}</Text>
      <Text testID="remaining-timer">{formatTime(segmentRemaining)}</Text>
      
      <Text testID="segment-index">{segmentIndex}</Text>
      <Text testID="skipped">{skipped ? 'true' : 'false'}</Text>
      
      <Button 
        testID="skip-button"
        title="Skip"
        onPress={handleNextSegment}
      />
    </View>
  );
}

// Advance timers by specified seconds and rerender
const advanceTime = (seconds, renderResult) => {
  // Advance timer by specified seconds
  for (let i = 0; i < seconds; i++) {
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
};

// Use fake timers for controlled testing
jest.useFakeTimers();

describe('Timer synchronization after skip', () => {
  it('initializes timers correctly', () => {
    const { getByTestId } = render(<TimerSyncTester />);
    
    // Verify initial values
    expect(getByTestId('main-timer-raw').props.children).toBe(0);
    expect(getByTestId('remaining-timer-raw').props.children).toBe(60);
    expect(getByTestId('segment-index').props.children).toBe(0);
  });
  
  it('keeps timers in sync while incrementing', () => {
    const { getByTestId } = render(<TimerSyncTester />);
    
    // Advance 5 seconds
    advanceTime(5);
    
    // Check values after 5 seconds
    expect(getByTestId('main-timer-raw').props.children).toBe(5);
    expect(getByTestId('remaining-timer-raw').props.children).toBe(55);
  });
  
  it('keeps timers in sync after skip', () => {
    const { getByTestId } = render(<TimerSyncTester />);
    
    // First advance 5 seconds
    advanceTime(5);
    
    // Verify pre-skip state
    expect(getByTestId('main-timer-raw').props.children).toBe(5);
    expect(getByTestId('remaining-timer-raw').props.children).toBe(55);
    expect(getByTestId('segment-index').props.children).toBe(0);
    
    // Skip to next segment
    act(() => {
      fireEvent.press(getByTestId('skip-button'));
    });
    
    // Verify immediate post-skip state
    expect(getByTestId('main-timer-raw').props.children).toBe(60); // 5 + 55
    expect(getByTestId('remaining-timer-raw').props.children).toBe(90); // Duration of next segment
    expect(getByTestId('segment-index').props.children).toBe(1);
    
    // Wait a few seconds after skip and verify timers remain in sync
    advanceTime(3);
    
    // Verify timers after 3 seconds post-skip
    expect(getByTestId('main-timer-raw').props.children).toBe(63); // 60 + 3
    expect(getByTestId('remaining-timer-raw').props.children).toBe(87); // 90 - 3
  });
  
  it('handles multiple skips correctly', () => {
    const { getByTestId } = render(<TimerSyncTester />);
    
    // Advance 5 seconds
    advanceTime(5);
    
    // Skip to next segment
    act(() => {
      fireEvent.press(getByTestId('skip-button'));
    });
    
    // Verify post-skip values
    expect(getByTestId('main-timer-raw').props.children).toBe(60);
    expect(getByTestId('remaining-timer-raw').props.children).toBe(90);
    expect(getByTestId('segment-index').props.children).toBe(1);
    
    // Wait 3 seconds
    advanceTime(3);
    
    // Verify timers are still in sync
    expect(getByTestId('main-timer-raw').props.children).toBe(63);
    expect(getByTestId('remaining-timer-raw').props.children).toBe(87);
    
    // Skip again to third segment
    act(() => {
      fireEvent.press(getByTestId('skip-button'));
    });
    
    // Verify values after second skip
    expect(getByTestId('main-timer-raw').props.children).toBe(150); // 63 + 87
    expect(getByTestId('remaining-timer-raw').props.children).toBe(30); // Duration of third segment
    expect(getByTestId('segment-index').props.children).toBe(2);
    
    // Wait 2 more seconds
    advanceTime(2);
    
    // Verify timers are still in sync after second skip
    expect(getByTestId('main-timer-raw').props.children).toBe(152); // 150 + 2
    expect(getByTestId('remaining-timer-raw').props.children).toBe(28); // 30 - 2
  });
});