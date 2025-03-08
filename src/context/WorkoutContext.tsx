import React, { createContext, useState, useEffect, useRef, useContext, ReactNode, useCallback } from 'react';
import { WorkoutProgram, WorkoutSegment, WorkoutSession, CompletedSegment, WorkoutPause } from '../types';
import { DataContext } from './DataContext';
import { UserContext } from './UserContext';
import { generateUniqueId } from '../utils/helpers';

// Context type definition
interface WorkoutContextType {
  activeWorkout: WorkoutProgram | null;
  isWorkoutActive: boolean;
  currentSegmentIndex: number;
  elapsedTime: number;
  segmentTimeRemaining: number;
  isPaused: boolean;
  pauseStartTime: number | null;
  totalPauseDuration: number;
  completedSegments: CompletedSegment[];
  pauses: WorkoutPause[];
  startWorkout: (workoutId: string) => boolean;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  skipToNextSegment: () => void;
  endWorkout: () => void;
}

// Create the context
export const WorkoutContext = createContext<WorkoutContextType>({
  activeWorkout: null,
  isWorkoutActive: false,
  currentSegmentIndex: 0,
  elapsedTime: 0,
  segmentTimeRemaining: 0,
  isPaused: false,
  pauseStartTime: null,
  totalPauseDuration: 0,
  completedSegments: [],
  pauses: [],
  startWorkout: () => false,
  pauseWorkout: () => {},
  resumeWorkout: () => {},
  skipToNextSegment: () => {},
  endWorkout: () => {},
});

// Provider component
interface WorkoutProviderProps {
  children: ReactNode;
}

export const WorkoutProvider: React.FC<WorkoutProviderProps> = ({ children }) => {
  // State
  const [activeWorkout, setActiveWorkout] = useState<WorkoutProgram | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [segmentTimeRemaining, setSegmentTimeRemaining] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPauseDuration, setTotalPauseDuration] = useState(0);
  const [completedSegments, setCompletedSegments] = useState<CompletedSegment[]>([]);
  const [pauses, setPauses] = useState<WorkoutPause[]>([]);
  
  // Refs for timer and state tracking
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const activeWorkoutRef = useRef<WorkoutProgram | null>(null);
  const elapsedTimeRef = useRef(0);
  const currentSegmentIndexRef = useRef(0);

  // Get contexts
  const { getWorkoutById, addWorkoutSession } = useContext(DataContext);
  const { userSettings } = useContext(UserContext);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        console.log('[WorkoutContext] Cleaning up timer on unmount');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Update refs when state changes
  useEffect(() => {
    isActiveRef.current = isWorkoutActive;
    console.log('[WorkoutContext] isActiveRef updated:', isActiveRef.current);
  }, [isWorkoutActive]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    console.log('[WorkoutContext] isPausedRef updated:', isPausedRef.current);
  }, [isPaused]);

  useEffect(() => {
    activeWorkoutRef.current = activeWorkout;
    console.log('[WorkoutContext] activeWorkoutRef updated:', activeWorkout?.name || 'null');
  }, [activeWorkout]);

  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    currentSegmentIndexRef.current = currentSegmentIndex;
  }, [currentSegmentIndex]);

  // Update workout state every second
  const updateWorkoutState = useCallback(() => {
    console.log('[WorkoutContext] Checking state - active=', isActiveRef.current, 'paused=', isPausedRef.current);
    console.log('[WorkoutContext] ActiveWorkout exists:', activeWorkoutRef.current !== null);
    
    if (!isActiveRef.current || isPausedRef.current) {
      console.log('[WorkoutContext] Not updating: active=', isActiveRef.current, 'paused=', isPausedRef.current);
      return;
    }
    
    if (!activeWorkoutRef.current) {
      console.log('[WorkoutContext] Not updating: activeWorkout is null');
      return;
    }
    
    // Update elapsed time
    const newElapsedTime = elapsedTimeRef.current + 1;
    console.log('[WorkoutContext] Updating elapsed time:', newElapsedTime);
    setElapsedTime(newElapsedTime);
    elapsedTimeRef.current = newElapsedTime; // Update ref immediately
    
    // Check if current segment is complete
    const currentSegment = activeWorkoutRef.current.segments[currentSegmentIndexRef.current];
    
    // Calculate segment elapsed time
    // Sum durations of all previous segments
    let previousSegmentsDuration = 0;
    for (let i = 0; i < currentSegmentIndexRef.current; i++) {
      previousSegmentsDuration += activeWorkoutRef.current.segments[i].duration;
    }
    
    // Calculate time spent in current segment
    const segmentElapsedTime = newElapsedTime - previousSegmentsDuration;
    console.log('[WorkoutContext] Segment elapsed time:', segmentElapsedTime);
    
    const newSegmentTimeRemaining = Math.max(0, currentSegment.duration - segmentElapsedTime);
    
    console.log('[WorkoutContext] Segment time remaining:', newSegmentTimeRemaining);
    setSegmentTimeRemaining(newSegmentTimeRemaining);
    
    // If segment is complete, move to next segment
    if (newSegmentTimeRemaining === 0) {
      if (currentSegmentIndexRef.current < activeWorkoutRef.current.segments.length - 1) {
        console.log('[WorkoutContext] Moving to next segment');
        moveToNextSegment();
      } else {
        // If workout is complete, end it
        console.log('[WorkoutContext] Workout complete - last segment finished');
        endWorkout();
      }
    }
  }, [moveToNextSegment, endWorkout]);

  // Start workout
  const startWorkout = useCallback((workoutId: string): boolean => {
    console.log('[WorkoutContext] Starting workout:', workoutId);
    const workout = getWorkoutById(workoutId);
    
    if (!workout || workout.segments.length === 0) {
      console.log('[WorkoutContext] Failed to start workout - invalid workout');
      return false;
    }
    
    console.log('[WorkoutContext] Workout found:', workout.name);
    console.log('[WorkoutContext] Segments:', workout.segments.length);
    console.log('[WorkoutContext] First segment duration:', workout.segments[0].duration);
    
    // Reset all state
    setActiveWorkout(workout);
    activeWorkoutRef.current = workout; // Update ref immediately
    setCurrentSegmentIndex(0);
    currentSegmentIndexRef.current = 0; // Update ref immediately
    setElapsedTime(0);
    elapsedTimeRef.current = 0; // Update ref immediately
    setSegmentTimeRemaining(workout.segments[0].duration);
    setIsWorkoutActive(true);
    isActiveRef.current = true; // Update ref immediately
    setPaused(false);
    isPausedRef.current = false; // Update ref immediately
    setPauseStartTime(null);
    setTotalPauseDuration(0);
    setCompletedSegments([]);
    setPauses([]);
    
    console.log('[WorkoutContext] Workout started successfully');
    console.log('[WorkoutContext] isWorkoutActive set to:', true);
    console.log('[WorkoutContext] isActiveRef set to:', isActiveRef.current);
    console.log('[WorkoutContext] activeWorkoutRef set to:', activeWorkoutRef.current.name);
    
    // Clear any existing timer
    if (timerRef.current) {
      console.log('[WorkoutContext] Clearing existing timer');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Start a new timer
    console.log('[WorkoutContext] Setting up new timer');
    timerRef.current = setInterval(updateWorkoutState, 1000);
    
    return true;
  }, [getWorkoutById, updateWorkoutState]);

  // Pause workout
  const pauseWorkout = useCallback(() => {
    if (!isActiveRef.current || isPausedRef.current) return;
    
    console.log('[WorkoutContext] Pausing workout');
    setPaused(true);
    isPausedRef.current = true; // Update ref immediately
    setPauseStartTime(Date.now());
    
    // Add to pauses array
    const newPause: WorkoutPause = {
      startTime: Date.now(),
      endTime: null,
      duration: 0,
    };
    setPauses([...pauses, newPause]);
  }, [pauses]);

  // Resume workout
  const resumeWorkout = useCallback(() => {
    if (!isActiveRef.current || !isPausedRef.current) return;
    
    console.log('[WorkoutContext] Resuming workout');
    setPaused(false);
    isPausedRef.current = false; // Update ref immediately
    
    // Calculate pause duration
    if (pauseStartTime) {
      const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
      setTotalPauseDuration(totalPauseDuration + pauseDuration);
      
      // Update last pause
      const updatedPauses = [...pauses];
      const lastPause = updatedPauses[updatedPauses.length - 1];
      if (lastPause) {
        lastPause.endTime = Date.now();
        lastPause.duration = pauseDuration;
        setPauses(updatedPauses);
      }
    }
    
    setPauseStartTime(null);
  }, [isActiveRef, isPausedRef, pauseStartTime, pauses, totalPauseDuration]);

  // Move to next segment
  const moveToNextSegment = useCallback(() => {
    if (!activeWorkoutRef.current) {
      console.log('[WorkoutContext] Cannot move to next segment: activeWorkout is null');
      return;
    }
    
    // Mark current segment as completed
    const currentSegment = activeWorkoutRef.current.segments[currentSegmentIndexRef.current];
    const completedSegment: CompletedSegment = {
      type: currentSegment.type,
      duration: currentSegment.duration,
      actualDuration: currentSegment.duration,
      skipped: false,
    };
    setCompletedSegments([...completedSegments, completedSegment]);
    
    // Check if this was the last segment
    if (currentSegmentIndexRef.current >= activeWorkoutRef.current.segments.length - 1) {
      console.log('[WorkoutContext] Last segment completed, ending workout');
      endWorkout();
      return;
    }
    
    // Move to next segment
    const nextIndex = currentSegmentIndexRef.current + 1;
    console.log(`[WorkoutContext] Moving to segment ${nextIndex}`);
    
    // Update both state and ref to ensure consistency
    setCurrentSegmentIndex(nextIndex);
    currentSegmentIndexRef.current = nextIndex;
    
    // Set the time remaining for the new segment
    const nextSegment = activeWorkoutRef.current.segments[nextIndex];
    setSegmentTimeRemaining(nextSegment.duration);
    
    console.log(`[WorkoutContext] New segment duration: ${nextSegment.duration}`);
  }, [completedSegments, endWorkout]);

  // Skip to next segment
  const skipToNextSegment = useCallback(() => {
    if (!activeWorkoutRef.current || !isWorkoutActive) return;
    
    // Mark current segment as skipped
    const currentSegment = activeWorkoutRef.current.segments[currentSegmentIndexRef.current];
    const skippedSegment: CompletedSegment = {
      type: currentSegment.type,
      duration: currentSegment.duration,
      actualDuration: currentSegment.duration - segmentTimeRemaining,
      skipped: true,
    };
    setCompletedSegments([...completedSegments, skippedSegment]);
    
    // Check if this was the last segment
    if (currentSegmentIndexRef.current >= activeWorkoutRef.current.segments.length - 1) {
      endWorkout();
      return;
    }
    
    // Move to next segment
    const nextIndex = currentSegmentIndexRef.current + 1;
    const nextSegment = activeWorkoutRef.current.segments[nextIndex];
    
    setCurrentSegmentIndex(nextIndex);
    currentSegmentIndexRef.current = nextIndex; // Update ref immediately
    setSegmentTimeRemaining(nextSegment.duration);
  }, [completedSegments, isWorkoutActive, segmentTimeRemaining]);

  // End workout
  const endWorkout = useCallback(() => {
    console.log('[WorkoutContext] Ending workout');
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset state
    setIsWorkoutActive(false);
    isActiveRef.current = false; // Update ref immediately
    setPaused(false);
    isPausedRef.current = false; // Update ref immediately
    
    // If no workout is active, return
    if (!activeWorkoutRef.current) {
      console.log('[WorkoutContext] No active workout to end');
      return;
    }
    
    // Create workout session
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      workoutId: activeWorkoutRef.current.id,
      startTime: Date.now() - (elapsedTimeRef.current * 1000) - (totalPauseDuration * 1000),
      endTime: Date.now(),
      duration: elapsedTimeRef.current,
      pauseDuration: totalPauseDuration,
      completedSegments: completedSegments,
      pauses: pauses,
    };
    
    // Add to workout history
    addWorkoutSession(session);
    
    // Reset state
    setActiveWorkout(null);
    activeWorkoutRef.current = null; // Update ref immediately
    setElapsedTime(0);
    elapsedTimeRef.current = 0; // Update ref immediately
    setCurrentSegmentIndex(0);
    currentSegmentIndexRef.current = 0; // Update ref immediately
    setSegmentTimeRemaining(0);
    setPauseStartTime(null);
    setTotalPauseDuration(0);
    setCompletedSegments([]);
    setPauses([]);
  }, [addWorkoutSession, completedSegments, pauses, totalPauseDuration]);

  // Context value
  const value = {
    activeWorkout,
    isWorkoutActive,
    currentSegmentIndex,
    elapsedTime,
    segmentTimeRemaining,
    isPaused,
    pauseStartTime,
    totalPauseDuration,
    completedSegments,
    pauses,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    skipToNextSegment,
    endWorkout,
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};