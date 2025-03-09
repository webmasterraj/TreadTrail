import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { timerTick, selectIsRunning } from '../redux/slices/workoutSlice';

/**
 * Custom hook to manage workout timer
 * This hook sets up an interval that dispatches timerTick actions
 * when the workout is running
 */
export const useWorkoutTimer = () => {
  const dispatch = useAppDispatch();
  const isRunning = useAppSelector(selectIsRunning);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Set up timer if workout is running
    if (isRunning) {
      timerRef.current = setInterval(() => {
        dispatch(timerTick({ timestamp: Date.now() }));
      }, 1000); // Update every second
    }

    // Cleanup on unmount or when isRunning changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, dispatch]);

  return null; // This hook doesn't return anything
};

export default useWorkoutTimer;
