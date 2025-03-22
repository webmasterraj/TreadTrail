/**
 * Utility functions for the TreadTrail app
 */

/**
 * Generates a unique ID
 * @returns A unique ID string
 */
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Formats seconds into a MM:SS display
 * @param seconds Number of seconds
 * @returns Formatted time string (e.g. "05:30")
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formats seconds into a more readable duration (e.g. "5.2h", "2.5d", "1.2w")
 * @param seconds Number of seconds
 * @param format Optional format to use (can be basic, hours, days, or auto)
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number, format: 'basic' | 'hours' | 'days' | 'auto' | 'decimal' = 'basic'): string => {
  // Handle zero time specially
  if (seconds === 0) {
    if (format === 'basic') {
      return '0 sec';
    } else if (format === 'decimal') {
      return '0 min';
    } else {
      return '0.0h';  // Show exactly 0.0h for zero duration
    }
  }
  
  if (seconds < 60) {
    if (format === 'basic') {
      return `${seconds} sec`;
    } else if (format === 'decimal') {
      return '0.1 min'; // Show small durations as 0.1 min
    } else {
      return '0.1h'; // Minimum display for non-zero but small durations
    }
  }
  
  if (format === 'decimal') {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    } else if (remainingSeconds === 30) {
      return `${minutes}.5 min`; // Half minute, show as .5
    } else {
      return `${parseFloat((minutes + remainingSeconds / 60).toFixed(1))} min`;
    }
  }
  
  if (format === 'basic') {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    
    return `${minutes} min ${remainingSeconds} sec`;
  } else {
    // Convert to hours
    const hours = seconds / 3600;
    
    if (format === 'hours' || (format === 'auto' && hours < 24)) {
      // Display as hours with one decimal place
      return `${hours.toFixed(1)}h`;
    }
    
    // Convert to days
    const days = hours / 24;
    
    if (format === 'days' || (format === 'auto' && days < 7)) {
      // Display as days with one decimal place
      return `${days.toFixed(1)}d`;
    }
    
    // Display as weeks with one decimal place
    const weeks = days / 7;
    return `${weeks.toFixed(1)}w`;
  }
};

/**
 * Formats date string to a human-readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g. "Jan 15, 2023")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats date and time string to a human-readable format
 * @param dateTimeString ISO date time string
 * @returns Formatted date and time string (e.g. "Jan 15, 2023 at 2:30 PM")
 */
export const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

/**
 * Calculates total duration of workout segments in seconds
 * @param segments Array of workout segments
 * @returns Total duration in seconds
 */
export const calculateTotalDuration = (segments: Array<{ duration: number }>): number => {
  return segments.reduce((sum, segment) => sum + segment.duration, 0);
};

/**
 * Converts mph to kph
 * @param mph Miles per hour
 * @returns Kilometers per hour
 */
export const mphToKph = (mph: number): number => {
  return mph * 1.60934;
};

/**
 * Converts kph to mph
 * @param kph Kilometers per hour
 * @returns Miles per hour
 */
export const kphToMph = (kph: number): number => {
  return kph / 1.60934;
};

/**
 * Converts miles to kilometers
 * @param miles Distance in miles
 * @returns Distance in kilometers
 */
export const milesToKm = (miles: number): number => {
  // 1 mile = 1.60934 kilometers
  return miles * 1.60934;
};

/**
 * Converts kilometers to miles
 * @param km Distance in kilometers
 * @returns Distance in miles
 */
export const kmToMiles = (km: number): number => {
  return km / 1.60934;
};

/**
 * Formats speed based on unit preference
 * @param speed Speed value
 * @param unit 'imperial' for mph, 'metric' for kph
 * @returns Formatted speed string with unit
 */
export const formatSpeed = (speed: number, unit: 'imperial' | 'metric'): string => {
  if (unit === 'metric') {
    // Convert to kph if stored as mph
    const kph = mphToKph(speed);
    return `${kph.toFixed(1)} kph`;
  }
  
  return `${speed.toFixed(1)} mph`;
};

/**
 * Formats incline percentage
 * @param incline Incline value (decimal or percentage)
 * @returns Formatted incline string with % symbol
 */
export const formatIncline = (incline: number): string => {
  return `${incline}%`;
};

/**
 * Calculates distance traveled based on speed and duration
 * @param speed Speed in mph
 * @param duration Duration in seconds
 * @returns Distance in miles
 */
export const calculateDistance = (speed: number, duration: number): number => {
  // Convert duration from seconds to hours
  const hours = duration / 3600;
  
  // Calculate distance (distance = speed * time)
  return speed * hours;
};

/**
 * Calculates total distance for a workout session based on segments and pace settings
 * @param segments Completed workout segments
 * @param paceSettings User's pace settings with speeds for each pace type
 * @returns Total distance in miles
 */
export const calculateTotalDistance = (
  segments: Array<{ type: string; duration: number; skipped: boolean }>,
  paceSettings: { [key: string]: { speed: number } }
): number => {
  return segments.reduce((totalDistance, segment) => {
    // Skip segments that were skipped during the workout
    if (segment.skipped) {
      return totalDistance;
    }
    
    // Get the pace setting for this segment type
    const paceSetting = paceSettings[segment.type];
    if (!paceSetting) {
      return totalDistance;
    }
    
    // Calculate distance for this segment and add to total
    const segmentDistance = calculateDistance(paceSetting.speed, segment.duration);
    return totalDistance + segmentDistance;
  }, 0);
};