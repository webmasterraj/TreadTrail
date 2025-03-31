/**
 * Utilities for calculating calories burned during workouts
 * Based on the ACSM metabolic equation for accurate energy expenditure estimation
 * https://summitmd.com/pdf/pdf/090626_aps09_970.pdf
 */

/**
 * Convert speed from kilometers per hour to meters per minute
 * @param speedKmh - Speed in kilometers per hour
 * @returns Speed in meters per minute
 */
export const kphToMetersPerMinute = (speedKmh: number): number => {
  // 1 km/h = 16.6667 meters per minute
  return (speedKmh * 1000) / 60;
};

/**
 * Calculate VO₂ (oxygen consumption) using the ACSM equation
 * @param speedKmh - Speed in kilometers per hour
 * @param inclinePercent - Treadmill incline as percentage
 * @returns VO₂ in ml/kg/min
 */
export const calculateVO2 = (speedKmh: number, inclinePercent: number): number => {
  // Convert speed to meters per minute for the formula
  const speedMetersPerMin = kphToMetersPerMinute(speedKmh);
  
  // ACSM equation for walking (speed < 6 km/h or 3.7 mph)
  if (speedKmh < 6) {
    return 3.5 + (0.1 * speedMetersPerMin) + (1.8 * speedMetersPerMin * inclinePercent / 100);
  } 
  // ACSM equation for running (speed >= 6 km/h or 5 mph)
  // Between 3.7-5 mph (6-8 km/h), there's a transition zone 
  // where either equation might be used depending on whether the person 
  // is walking or running. We will assume running over 6kph
  else {
    return 3.5 + (0.2 * speedMetersPerMin) + (0.9 * speedMetersPerMin * inclinePercent / 100);
  }
};

/**
 * Calculate METs (Metabolic Equivalent of Task) based on VO₂
 * @param speedKmh - Speed in kilometers per hour
 * @param inclinePercent - Treadmill incline as percentage
 * @returns METs value
 */
export const calculateMETs = (speedKmh: number, inclinePercent: number): number => {
  // 1 MET = 3.5 ml/kg/min of oxygen consumption
  const vo2 = calculateVO2(speedKmh, inclinePercent);
  return vo2 / 3.5;
};

/**
 * Calculate calories burned for a workout segment
 * @param speedKmh - Speed in kilometers per hour
 * @param weightKg - User weight in kilograms
 * @param durationMinutes - Duration of activity in minutes
 * @param inclinePercent - Treadmill incline as percentage (default 0)
 * @returns Calories burned during the segment
 */
export const calculateSegmentCalories = (
  speedKmh: number, 
  weightKg: number, 
  durationMinutes: number,
  inclinePercent: number = 0
): number => {
  // Convert duration from minutes to hours
  const durationHours = durationMinutes / 60;
  // Calculate METs using ACSM equation
  const mets = calculateMETs(speedKmh, inclinePercent);
  // Calculate calories: METs × weight (kg) × duration (hours)
  return mets * weightKg * durationHours;
};

/**
 * Calculate total calories burned for a workout with multiple segments
 * @param segments - Array of completed workout segments
 * @param paceSettings - User's pace settings with speed values
 * @param weightKg - User weight in kilograms
 * @returns Total calories burned during the workout
 */
export const calculateTotalCalories = (
  segments: Array<{type: string; duration: number; skipped: boolean}>,
  paceSettings: {[key: string]: {speed: number; incline: number}},
  weightKg: number
): number => {
  if (!weightKg) return 0;
  
  let totalCalories = 0;
  
  // Calculate calories for each segment separately and sum them
  segments.forEach(segment => {
    // Skip segments that were skipped during the workout
    if (segment.skipped) return;
    
    // Get pace settings for this segment type
    const paceSetting = paceSettings[segment.type];
    if (!paceSetting) return;
    
    // Convert segment duration from seconds to minutes
    const durationMinutes = segment.duration / 60;
    
    // Calculate calories for this segment and add to total
    const segmentCalories = calculateSegmentCalories(
      paceSetting.speed,
      weightKg,
      durationMinutes,
      paceSetting.incline
    );
    
    totalCalories += segmentCalories;
  });
  
  // Round to nearest whole number
  return Math.round(totalCalories);
};

/**
 * Calculate total calories burned for a workout with multiple segments
 * This is an alias for calculateTotalCalories to maintain compatibility
 * @param segments - Array of completed workout segments
 * @param weightKg - User weight in kilograms
 * @param paceSettings - User's pace settings with speed values
 * @returns Total calories burned during the workout
 */
export const calculateTotalCaloriesBurned = (
  segments: Array<{type: string; duration: number; skipped: boolean}>,
  weightKg: number,
  paceSettings: {[key: string]: {speed: number; incline: number}}
): number => {
  return calculateTotalCalories(segments, paceSettings, weightKg);
};

/**
 * Convert weight from pounds to kilograms
 * @param weightLbs - Weight in pounds
 * @returns Weight in kilograms
 */
export const lbsToKg = (weightLbs: number): number => {
  return weightLbs / 2.20462;
};

/**
 * Convert weight from kilograms to pounds
 * @param weightKg - Weight in kilograms
 * @returns Weight in pounds
 */
export const kgToLbs = (weightKg: number): number => {
  return weightKg * 2.20462;
};
