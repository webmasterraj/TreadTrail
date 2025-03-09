import React, { createContext, useState, useEffect, useRef, useContext, ReactNode, useCallback } from 'react';
import { WorkoutProgram, WorkoutSegment, WorkoutSession, CompletedSegment, WorkoutPause } from '../types';
import { DataContext } from './DataContext';
import { UserContext } from './UserContext';
import { generateUniqueId } from '../utils/helpers';

// Context type definition
interface WorkoutContextType {
  // Workout data
  activeWorkout: WorkoutProgram | null;
  isWorkoutActive: boolean;
  currentSegmentIndex: number;
  
  // Time tracking
  elapsedTime: number;                  // Total seconds elapsed in workout
  segmentTimeRemaining: number;         // Seconds remaining in current segment
  segmentTotalTime: number;             // Total seconds in current segment
  workoutTotalTime: number;             // Total seconds in entire workout
  workoutStartTime: string | null;      // Timestamp when workout started
  segmentStartTime: string | null;      // Timestamp when current segment started
  
  // Pause state
  isPaused: boolean;
  pauseStartTime: string | null;
  totalPauseDuration: number;
  
  // History tracking
  completedSegments: CompletedSegment[];
  pauses: WorkoutPause[];
  
  // Actions
  startWorkout: (workoutId: string) => boolean;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  skipToNextSegment: () => void;
  endWorkout: () => void;
}

// Create the context
export const WorkoutContext = createContext<WorkoutContextType>({
  // Workout data
  activeWorkout: null,
  isWorkoutActive: false,
  currentSegmentIndex: 0,
  
  // Time tracking
  elapsedTime: 0,
  segmentTimeRemaining: 0,
  segmentTotalTime: 0,
  workoutTotalTime: 0,
  workoutStartTime: null,
  segmentStartTime: null,
  
  // Pause state
  isPaused: false,
  pauseStartTime: null,
  totalPauseDuration: 0,
  
  // History tracking
  completedSegments: [],
  pauses: [],
  
  // Actions
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
  // Workout data state
  const [activeWorkout, setActiveWorkout] = useState<WorkoutProgram | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  
  // Time tracking state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [segmentTimeRemaining, setSegmentTimeRemaining] = useState(0);
  const [segmentTotalTime, setSegmentTotalTime] = useState(0);
  const [workoutTotalTime, setWorkoutTotalTime] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<string | null>(null); 
  const [segmentStartTime, setSegmentStartTime] = useState<string | null>(null);
  
  // Pause state
  const [isPaused, setPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<string | null>(null);
  const [totalPauseDuration, setTotalPauseDuration] = useState(0);
  
  // History tracking
  const [completedSegments, setCompletedSegments] = useState<CompletedSegment[]>([]);
  const [pauses, setPauses] = useState<WorkoutPause[]>([]);
  
  // Refs for timer and state tracking (to avoid stale closures in timers)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const activeWorkoutRef = useRef<WorkoutProgram | null>(null);
  const elapsedTimeRef = useRef(0);
  const currentSegmentIndexRef = useRef(0);
  const workoutStartTimeRef = useRef<string | null>(null);
  const segmentStartTimeRef = useRef<string | null>(null);

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
    
    // Update workout total time when active workout changes
    if (activeWorkout) {
      const totalDuration = activeWorkout.segments.reduce(
        (total, segment) => total + segment.duration, 0
      );
      setWorkoutTotalTime(totalDuration);
      console.log('[WorkoutContext] Calculated workout total time:', totalDuration);
    }
  }, [activeWorkout]);

  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    currentSegmentIndexRef.current = currentSegmentIndex;
    
    // Update segment total time when segment index changes
    if (activeWorkout && currentSegmentIndex < activeWorkout.segments.length) {
      const currentSegmentDuration = activeWorkout.segments[currentSegmentIndex].duration;
      setSegmentTotalTime(currentSegmentDuration);
      console.log('[WorkoutContext] Updated segment total time:', currentSegmentDuration);
    }
  }, [currentSegmentIndex, activeWorkout]);
  
  useEffect(() => {
    workoutStartTimeRef.current = workoutStartTime;
  }, [workoutStartTime]);
  
  useEffect(() => {
    segmentStartTimeRef.current = segmentStartTime;
  }, [segmentStartTime]);

  // End workout
  const endWorkout = useCallback(() => {
    console.log('[WorkoutContext] Ending workout');
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
      workoutName: activeWorkoutRef.current.name,
      date: new Date().toISOString().split('T')[0], // ISO date string (YYYY-MM-DD)
      startTime: new Date(Date.now() - (elapsedTimeRef.current * 1000) - (totalPauseDuration * 1000)).toISOString(),
      endTime: new Date(Date.now()).toISOString(),
      duration: elapsedTimeRef.current,
      completed: true,
      pauses: pauses,
      segments: completedSegments,
    };
    
    // Add to workout history
    console.log('[WorkoutContext] Adding session to history:', session);
    addWorkoutSession(session);
    
    // Reset state
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setActiveWorkout(null);
    activeWorkoutRef.current = null;
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    setCurrentSegmentIndex(0);
    currentSegmentIndexRef.current = 0;
    setSegmentTimeRemaining(0);
    setSegmentTotalTime(0);
    setWorkoutTotalTime(0);
    setWorkoutStartTime(null);
    workoutStartTimeRef.current = null;
    setSegmentStartTime(null);
    segmentStartTimeRef.current = null;
    setPauses([]);
    setCompletedSegments([]);
  }, [addWorkoutSession, completedSegments, elapsedTimeRef, pauses, totalPauseDuration]);

  // Move to next segment
  const moveToNextSegment = useCallback(() => {
    if (!activeWorkoutRef.current || !isWorkoutActive) return;
    
    console.log('[WorkoutContext] Moving to next segment');
    
    // Mark current segment as completed
    const currentSegment = activeWorkoutRef.current.segments[currentSegmentIndexRef.current];
    const completedSegment: CompletedSegment = {
      type: currentSegment.type,
      duration: currentSegment.duration - segmentTimeRemaining,
      plannedDuration: currentSegment.duration,
      skipped: false,
    };
    setCompletedSegments([...completedSegments, completedSegment]);
    
    // Check if this was the last segment
    if (currentSegmentIndexRef.current >= activeWorkoutRef.current.segments.length - 1) {
      console.log('[WorkoutContext] Last segment, ending workout');
      endWorkout();
      return;
    }
    
    // Move to next segment
    const nextIndex = currentSegmentIndexRef.current + 1;
    console.log('[WorkoutContext] Moving to segment', nextIndex);
    setCurrentSegmentIndex(nextIndex);
    currentSegmentIndexRef.current = nextIndex;
    
    // Set the time remaining for the new segment
    const nextSegment = activeWorkoutRef.current.segments[nextIndex];
    setSegmentTimeRemaining(nextSegment.duration);
    
    console.log(`[WorkoutContext] New segment duration: ${nextSegment.duration}`);
  }, [completedSegments, endWorkout, isWorkoutActive, segmentTimeRemaining]);

  // Update workout state every second
  const updateWorkoutState = useCallback(() => {
    if (!isActiveRef.current || isPausedRef.current || !activeWorkoutRef.current) return;
    
    // Increment elapsed time
    const newElapsedTime = elapsedTimeRef.current + 1;
    setElapsedTime(newElapsedTime);
    elapsedTimeRef.current = newElapsedTime;
    
    // Decrement segment time remaining
    const newSegmentTimeRemaining = Math.max(0, segmentTimeRemaining - 1);
    console.log(`[WorkoutContext] Decrementing segmentTimeRemaining: ${segmentTimeRemaining} -> ${newSegmentTimeRemaining}`);
    setSegmentTimeRemaining(newSegmentTimeRemaining);
    
    // Check if segment is complete
    if (newSegmentTimeRemaining <= 0) {
      console.log('[WorkoutContext] Segment complete');
      
      // Check if there are more segments
      if (currentSegmentIndexRef.current < activeWorkoutRef.current.segments.length - 1) {
        moveToNextSegment();
      } else {
        // If workout is complete, end it
        console.log('[WorkoutContext] Workout complete - last segment finished');
        endWorkout();
      }
    }
  }, [moveToNextSegment, endWorkout, segmentTimeRemaining]);

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
    
    // Get current timestamp for workout and segment start
    const now = Date.now();
    
    // Calculate workout total duration
    const totalDuration = workout.segments.reduce((total, segment) => total + segment.duration, 0);
    
    // Reset all state
    setActiveWorkout(workout);
    activeWorkoutRef.current = workout; // Update ref immediately
    
    // Reset segment state
    setCurrentSegmentIndex(0);
    currentSegmentIndexRef.current = 0; // Update ref immediately
    setSegmentTimeRemaining(workout.segments[0].duration);
    setSegmentTotalTime(workout.segments[0].duration);
    setSegmentStartTime(new Date(now).toISOString());
    segmentStartTimeRef.current = new Date(now).toISOString();
    
    // Reset workout state
    setElapsedTime(0);
    elapsedTimeRef.current = 0; // Update ref immediately
    setWorkoutTotalTime(totalDuration);
    setWorkoutStartTime(new Date(now).toISOString());
    workoutStartTimeRef.current = new Date(now).toISOString();
    
    // Reset workout activity state
    setIsWorkoutActive(true);
    isActiveRef.current = true; // Update ref immediately
    setPaused(false);
    isPausedRef.current = false; // Update ref immediately
    
    // Reset pause tracking
    setPauseStartTime(null);
    setTotalPauseDuration(0);
    
    // Reset history
    setCompletedSegments([]);
    setPauses([]);
    
    console.log('[WorkoutContext] Workout started successfully');
    console.log('[WorkoutContext] isWorkoutActive set to:', true);
    console.log('[WorkoutContext] isActiveRef set to:', isActiveRef.current);
    console.log('[WorkoutContext] activeWorkoutRef set to:', activeWorkoutRef.current.name);
    console.log('[WorkoutContext] workoutStartTime set to:', new Date(now).toISOString());
    console.log('[WorkoutContext] segmentStartTime set to:', new Date(now).toISOString());
    
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
    setPauseStartTime(new Date(Date.now()).toISOString());
    
    // Add to pauses array
    const newPause: WorkoutPause = {
      startTime: new Date(Date.now()).toISOString(),
      endTime: null as unknown as string, // Will be set when pause ends
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
      const pauseDuration = Math.floor((Date.now() - new Date(pauseStartTime).getTime()) / 1000);
      setTotalPauseDuration(totalPauseDuration + pauseDuration);
      
      // Update last pause
      const updatedPauses = [...pauses];
      const lastPause = updatedPauses[updatedPauses.length - 1];
      if (lastPause) {
        lastPause.endTime = new Date(Date.now()).toISOString();
        lastPause.duration = pauseDuration;
        setPauses(updatedPauses);
      }
    }
    
    setPauseStartTime(null);
  }, [isActiveRef, isPausedRef, pauseStartTime, pauses, totalPauseDuration]);

  // Skip to next segment
  const skipToNextSegment = useCallback(() => {
    if (!activeWorkoutRef.current || !isWorkoutActive) return;
    
    console.log('=== [WorkoutContext] SKIP SEGMENT ===');
    
    // CRITICAL FIX: Clear existing timer to prevent race conditions
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Get the timestamp now to measure all timings from this point
    const now = Date.now();
    
    // Mark current segment as skipped
    const currentSegment = activeWorkoutRef.current.segments[currentSegmentIndexRef.current];
    const skippedSegment: CompletedSegment = {
      type: currentSegment.type,
      duration: currentSegment.duration - segmentTimeRemaining,
      plannedDuration: currentSegment.duration,
      skipped: true,
    };
    setCompletedSegments([...completedSegments, skippedSegment]);
    
    // Check if this was the last segment
    if (currentSegmentIndexRef.current >= activeWorkoutRef.current.segments.length - 1) {
      console.log('[WorkoutContext] Skip - Last segment, ending workout');
      endWorkout();
      return;
    }
    
    // Move to next segment
    const nextIndex = currentSegmentIndexRef.current + 1;
    const nextSegment = activeWorkoutRef.current.segments[nextIndex];
    
    console.log('[WorkoutContext] Skip - From segment', currentSegmentIndexRef.current, 'to', nextIndex);
    console.log('[WorkoutContext] Skip - Current segment remaining:', segmentTimeRemaining);
    console.log('[WorkoutContext] Skip - Next segment duration:', nextSegment.duration);
    
    // CRITICAL FIX: Calculate the total duration of all segments up to and including the current one
    let totalDurationBeforeNextSegment = 0;
    for (let i = 0; i <= currentSegmentIndexRef.current; i++) {
      totalDurationBeforeNextSegment += activeWorkoutRef.current.segments[i].duration;
    }
    
    // Update elapsed time to the boundary between segments
    console.log('[WorkoutContext] Skip - Adjusting elapsed time from', elapsedTime, 'to', totalDurationBeforeNextSegment);
    setElapsedTime(totalDurationBeforeNextSegment);
    elapsedTimeRef.current = totalDurationBeforeNextSegment;
    
    // Update segment index - update both state and ref immediately
    console.log('[WorkoutContext] Skip - Setting current segment index to', nextIndex);
    setCurrentSegmentIndex(nextIndex);
    currentSegmentIndexRef.current = nextIndex;
    
    // Update segment timestamps
    console.log('[WorkoutContext] Skip - Setting new segment start time');
    setSegmentStartTime(new Date(now).toISOString());
    segmentStartTimeRef.current = new Date(now).toISOString();
    
    // Update segment duration and remaining time
    console.log('[WorkoutContext] Skip - Setting segment total time to', nextSegment.duration);
    setSegmentTotalTime(nextSegment.duration);
    
    const timestamp = new Date().toISOString();
    console.log(`[WorkoutContext] SKIP @ ${timestamp} - Setting segmentTimeRemaining to ${nextSegment.duration}`);
    
    // CRITICAL FIX: Set segment time remaining immediately
    setSegmentTimeRemaining(nextSegment.duration);
    
    // CRITICAL FIX: Restart timer with fresh interval
    timerRef.current = setInterval(updateWorkoutState, 1000);
    
    console.log('[WorkoutContext] Skip - Complete');
  }, [completedSegments, endWorkout, isWorkoutActive, segmentTimeRemaining, elapsedTime, updateWorkoutState]);

  // Context value
  const value = {
    // Workout data
    activeWorkout,
    isWorkoutActive,
    currentSegmentIndex,
    
    // Time tracking
    elapsedTime,
    segmentTimeRemaining,
    segmentTotalTime,
    workoutTotalTime,
    workoutStartTime,
    segmentStartTime,
    
    // Pause state
    isPaused,
    pauseStartTime,
    totalPauseDuration,
    
    // History tracking
    completedSegments,
    pauses,
    
    // Actions
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    skipToNextSegment,
    endWorkout,
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};