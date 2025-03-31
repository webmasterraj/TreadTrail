/**
 * Utilities for calculating distance during workouts
 */
import { PaceSettings, PaceType, WorkoutSegment } from '../types';

/**
 * Calculate distance for a single segment based on pace and duration
 * 
 * @param paceSpeed - Speed in km/h
 * @param durationSeconds - Duration in seconds
 * @returns Distance in kilometers
 */
export const calculateSegmentDistance = (
  paceSpeed: number,
  durationSeconds: number
): number => {
  // Convert duration from seconds to hours
  const durationHours = durationSeconds / 3600;
  // Calculate distance: speed (km/h) * time (hours)
  return paceSpeed * durationHours;
};

/**
 * Calculate total distance for a workout with multiple segments
 * 
 * @param segments - Array of workout segments
 * @param paceSettings - User's pace settings with speed values
 * @returns Total distance in kilometers (rounded to 2 decimal places)
 */
export const calculateTotalDistance = (
  segments: WorkoutSegment[],
  paceSettings: PaceSettings
): number => {
  let totalDistance = 0;
  
  // Calculate distance for each segment
  for (const segment of segments) {
    const paceType = segment.type as PaceType;
    const pace = paceSettings[paceType];
    
    if (pace && pace.speed) {
      const segmentDistance = calculateSegmentDistance(pace.speed, segment.duration);
      totalDistance += segmentDistance;
    }
  }
  
  // Round to 2 decimal places
  return parseFloat(totalDistance.toFixed(2));
};

/**
 * Calculate distance for a workout in progress
 * 
 * @param completedSegments - Array of completed workout segments
 * @param currentSegment - Current segment in progress
 * @param currentSegmentElapsedTime - Elapsed time in current segment (seconds)
 * @param paceSettings - User's pace settings with speed values
 * @returns Total distance in kilometers (rounded to 2 decimal places)
 */
export const calculateWorkoutInProgressDistance = (
  completedSegments: WorkoutSegment[],
  currentSegment: WorkoutSegment | null,
  currentSegmentElapsedTime: number,
  paceSettings: PaceSettings
): number => {
  let totalDistance = 0;
  
  // Calculate distance for completed segments
  if (completedSegments.length > 0) {
    totalDistance += calculateTotalDistance(completedSegments, paceSettings);
  }
  
  // Add distance for current segment based on elapsed time
  if (currentSegment) {
    const paceType = currentSegment.type as PaceType;
    const pace = paceSettings[paceType];
    
    if (pace && pace.speed) {
      const currentSegmentDistance = calculateSegmentDistance(
        pace.speed, 
        currentSegmentElapsedTime
      );
      totalDistance += currentSegmentDistance;
    }
  }
  
  // Round to 2 decimal places
  return parseFloat(totalDistance.toFixed(2));
};
