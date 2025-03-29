/**
 * Unit tests for workout calculations (distance and calories)
 */

import { calculateSegmentCalories, calculateVO2, calculateMETs } from '../calorieUtils';
import { calculateSegmentDistance, calculateTotalDistance } from '../distanceUtils';
import { PaceSetting, PaceType, WorkoutSegment, PaceSettings } from '../../types';

// Import Jest testing functions
import { describe, test, expect } from '@jest/globals';

// Mock data for tests - using correct PaceSetting type with both speed and incline properties
// Use type assertion to handle the mismatch between the interface and our test data
const mockPaceSettings = {
  recovery: { speed: 4, incline: 0 },
  base: { speed: 6, incline: 0 },
  run: { speed: 8, incline: 1 },
  sprint: { speed: 10, incline: 2 }
} as PaceSettings;

// User's actual pace settings
const userPaceSettings = {
  recovery: { speed: 6.4, incline: 0 },
  base: { speed: 9.7, incline: 0 },
  run: { speed: 11.3, incline: 1 },
  sprint: { speed: 12.9, incline: 2 }
} as PaceSettings;

// User's actual workout segments
const userWorkoutSegments: WorkoutSegment[] = [
  { type: 'recovery', duration: 60, incline: 0 },  // 01:00 at Recovery
  { type: 'base', duration: 120, incline: 0 },     // 02:00 at Base
  { type: 'run', duration: 180, incline: 1 },      // 03:00 at Run
  { type: 'base', duration: 90, incline: 0 },      // 01:30 at Base
  { type: 'sprint', duration: 60, incline: 2 },    // 01:00 at Sprint
  { type: 'recovery', duration: 60, incline: 0 },  // 01:00 at Recovery
  { type: 'run', duration: 180, incline: 1 },      // 03:00 at Run
  { type: 'base', duration: 120, incline: 0 },     // 02:00 at Base
  { type: 'sprint', duration: 60, incline: 2 },    // 01:00 at Sprint
  { type: 'recovery', duration: 60, incline: 0 },  // 01:00 at Recovery
  { type: 'sprint', duration: 60, incline: 2 },    // 01:00 at Sprint
  { type: 'base', duration: 60, incline: 0 },      // 01:00 at Base
  { type: 'run', duration: 60, incline: 1 },       // 01:00 at Run
  { type: 'sprint', duration: 30, incline: 2 },    // 00:30 at Sprint
  { type: 'recovery', duration: 180, incline: 0 }  // 03:00 at Recovery
];

describe('Distance Calculation Tests', () => {
  test('should calculate segment distance correctly based on speed and time', () => {
    // Formula: distance (km) = speed (km/h) * time (hours)
    
    // Test case 1: 1 hour at 5 km/h
    expect(calculateSegmentDistance(5, 3600)).toBe(5); // 5 km
    
    // Test case 2: 30 minutes at 8 km/h
    expect(calculateSegmentDistance(8, 1800)).toBe(4); // 4 km
    
    // Test case 3: 15 minutes at 10 km/h
    expect(calculateSegmentDistance(10, 900)).toBeCloseTo(2.5); // 2.5 km
  });
  
  test('should handle different pace types from pace settings', () => {
    // Create test segments of 20 minutes each with different pace types
    const testSegments: WorkoutSegment[] = [
      { type: 'recovery', duration: 1200, incline: 0 },
      { type: 'base', duration: 1200, incline: 0 },
      { type: 'run', duration: 1200, incline: 1 },
      { type: 'sprint', duration: 1200, incline: 2 }
    ];
    
    // Test individual segments with mock pace settings
    expect(calculateTotalDistance([testSegments[0]], mockPaceSettings)).toBe(1.33); // 1.33 km for recovery
    expect(calculateTotalDistance([testSegments[1]], mockPaceSettings)).toBe(2); // 2 km for base
    expect(calculateTotalDistance([testSegments[2]], mockPaceSettings)).toBe(2.67); // 2.67 km for run
    expect(calculateTotalDistance([testSegments[3]], mockPaceSettings)).toBe(3.33); // 3.33 km for sprint
    
    // Test combined segments
    expect(calculateTotalDistance(testSegments, mockPaceSettings)).toBe(9.33); // 9.33 km total
  });
  
  test('should calculate distance correctly for user\'s actual workout', () => {
    // Calculate expected distances for each segment
    const expectedDistances = [
      6.4 * (60 / 3600),    // Recovery: 0.107 km
      9.7 * (120 / 3600),   // Base: 0.323 km
      11.3 * (180 / 3600),  // Run: 0.565 km
      9.7 * (90 / 3600),    // Base: 0.243 km
      12.9 * (60 / 3600),   // Sprint: 0.215 km
      6.4 * (60 / 3600),    // Recovery: 0.107 km
      11.3 * (180 / 3600),  // Run: 0.565 km
      9.7 * (120 / 3600),   // Base: 0.323 km
      12.9 * (60 / 3600),   // Sprint: 0.215 km
      6.4 * (60 / 3600),    // Recovery: 0.107 km
      12.9 * (60 / 3600),   // Sprint: 0.215 km
      9.7 * (60 / 3600),    // Base: 0.162 km
      11.3 * (60 / 3600),   // Run: 0.188 km
      12.9 * (30 / 3600),   // Sprint: 0.108 km
      6.4 * (180 / 3600)    // Recovery: 0.32 km
    ];
    
    // Expected total distance (sum of all segment distances)
    const expectedTotalDistance = parseFloat(expectedDistances.reduce((sum, distance) => sum + distance, 0).toFixed(2));
    
    // Test the utility function with the user's workout
    const calculatedDistance = calculateTotalDistance(userWorkoutSegments, userPaceSettings);
    
    // Verify the total distance is approximately 3.76 km
    expect(calculatedDistance).toBeCloseTo(3.76, 1);
    expect(calculatedDistance).toBe(expectedTotalDistance);
    
    // Log detailed breakdown for verification
    console.log('Expected total distance:', expectedTotalDistance, 'km');
    console.log('Calculated total distance:', calculatedDistance, 'km');
  });
});

describe('Calorie Calculation Tests', () => {
  test('should calculate VO2 correctly using ACSM equations', () => {
    // Walking equation (speed < 6 km/h)
    let vo2 = calculateVO2(5, 0); // 5 km/h, 0% incline
    expect(vo2).toBeCloseTo(11.83, 1); // Approximately 11.8 ml/kg/min
    
    // Running equation (speed >= 6 km/h)
    vo2 = calculateVO2(8, 0); // 8 km/h, 0% incline
    expect(vo2).toBeCloseTo(30.17, 1); // Approximately 30.2 ml/kg/min
    
    // With incline
    vo2 = calculateVO2(8, 2); // 8 km/h, 2% incline
    expect(vo2).toBeCloseTo(32.57, 1); // Approximately 32.6 ml/kg/min
  });
  
  test('should calculate METs correctly based on VO2', () => {
    // 1 MET = 3.5 ml/kg/min
    let mets = calculateMETs(5, 0); // 5 km/h, 0% incline
    expect(mets).toBeCloseTo(3.38, 1); // Approximately 3.4 METs
    
    mets = calculateMETs(8, 0); // 8 km/h, 0% incline
    expect(mets).toBeCloseTo(8.62, 1); // Approximately 8.6 METs
  });
  
  test('should calculate segment calories correctly', () => {
    // 70 kg person walking at 5 km/h for 30 minutes with 0% incline
    let calories = calculateSegmentCalories(5, 70, 30, 0);
    expect(calories).toBeCloseTo(118.3, 0); // Approximately 118 calories
    
    // 70 kg person running at 8 km/h for 30 minutes with 0% incline
    calories = calculateSegmentCalories(8, 70, 30, 0);
    expect(calories).toBeCloseTo(302, 0); // Approximately 302 calories
    
    // 70 kg person running at 8 km/h for 30 minutes with 2% incline
    calories = calculateSegmentCalories(8, 70, 30, 2);
    expect(calories).toBeCloseTo(326, 0); // Approximately 326 calories
  });
  
  test('should handle different workout scenarios', () => {
    // Short high-intensity workout: 85 kg person, 10 km/h, 5% incline, 10 minutes
    let calories = calculateSegmentCalories(10, 85, 10, 5);
    expect(calories).toBeGreaterThan(80); // Should burn significant calories despite short duration
    
    // Long low-intensity workout: 70 kg person, 4 km/h, 0% incline, 60 minutes
    calories = calculateSegmentCalories(4, 70, 60, 0);
    expect(calories).toBeGreaterThan(100); // Should accumulate calories over longer duration
    
    // Verify that higher weight = more calories (same workout)
    const caloriesLowerWeight = calculateSegmentCalories(8, 60, 30, 1);
    const caloriesHigherWeight = calculateSegmentCalories(8, 80, 30, 1);
    expect(caloriesHigherWeight).toBeGreaterThan(caloriesLowerWeight);
    
    // Verify that higher speed = more calories (same duration, weight, incline)
    const caloriesLowerSpeed = calculateSegmentCalories(6, 70, 30, 1);
    const caloriesHigherSpeed = calculateSegmentCalories(9, 70, 30, 1);
    expect(caloriesHigherSpeed).toBeGreaterThan(caloriesLowerSpeed);
  });
});
