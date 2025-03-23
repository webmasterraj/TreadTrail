import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { timerTick, selectIsRunning } from '../redux/slices/workoutSlice';
import BackgroundTimer from 'react-native-background-timer';

/**
 * Custom hook to manage workout timer
 * This hook sets up an interval that dispatches timerTick actions
 * when the workout is running
 */
const useWorkoutTimer = () => {
  const dispatch = useAppDispatch();
  const isRunning = useAppSelector(selectIsRunning);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      BackgroundTimer.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Set up timer if workout is running
    if (isRunning) {
      // Define a function to handle the tick to avoid any closure issues
      const handleTick = () => {
        try {
          dispatch(timerTick({ timestamp: Date.now() }));
        } catch (error) {
          console.error('Error in timer tick:', error);
        }
      };
      
      // Start the interval with the handler function using BackgroundTimer
      timerRef.current = BackgroundTimer.setInterval(handleTick, 1000);
    }

    // Cleanup on unmount or when isRunning changes
    return () => {
      if (timerRef.current) {
        BackgroundTimer.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, dispatch]);

  // Return the timer status for component reference
  return {
    isRunning,
    active: timerRef.current !== null
  };
};

export default useWorkoutTimer;
