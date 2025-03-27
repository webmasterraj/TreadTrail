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
  
  const minutes = seconds / 60;
  
  if (minutes < 60) {
    if (format === 'basic') {
      return `${Math.round(minutes)} min`;
    } else if (format === 'decimal') {
      return `${minutes.toFixed(1)} min`;
    } else {
      return `${(minutes / 60).toFixed(1)}h`; // Convert to hours
    }
  }
  
  const hours = minutes / 60;
  
  if (format === 'basic') {
    return `${Math.round(hours)}h`;
  }
  
  if (format === 'decimal') {
    return `${hours.toFixed(1)}h`;
  }
  
  // For 'auto', 'hours', or 'days' formats
  if (hours < 24 || format === 'hours') {
    return `${hours.toFixed(1)}h`;
  }
  
  const days = hours / 24;
  
  if (days < 7 || format === 'days') {
    return `${days.toFixed(1)}d`;
  }
  
  const weeks = days / 7;
  return `${weeks.toFixed(1)}w`;
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
 * @param speed Speed in km/h
 * @param duration Duration in seconds
 * @returns Distance in miles (for compatibility with existing code)
 */
export const calculateDistance = (speed: number, duration: number): number => {
  // Convert duration from seconds to hours
  const hours = duration / 3600;
  
  // Calculate distance (distance = speed * time)
  // Since speed is now in km/h, convert to miles for compatibility
  return kmToMiles(speed * hours);
};

/**
 * Calculates total distance for a workout session based on segments and pace settings
 * @param segments Completed workout segments
 * @param paceSettings User's pace settings with speeds for each pace type (in km/h)
 * @returns Total distance in miles (for compatibility with existing code)
 */
export const calculateTotalDistance = (
  segments: Array<{ type: string; duration: number; skipped: boolean }>,
  paceSettings: { [key: string]: { speed: number } }
): number => {
  // If no segments or pace settings, return 0
  if (!segments || !paceSettings) return 0;

  // Calculate total distance
  let totalDistance = 0;
  segments.forEach(segment => {
    if (!segment.skipped && segment.duration > 0) {
      const paceType = segment.type;
      const paceSpeed = paceSettings[paceType]?.speed || 0;
      
      // Calculate distance for this segment (miles)
      // Note: paceSpeed is now in km/h, so we need to convert the result to miles
      const segmentDistance = calculateDistance(paceSpeed, segment.duration);
      totalDistance += segmentDistance;
    }
  });

  return totalDistance;
};

/**
 * Formats a number with k (thousands) or m (millions) suffix
 * @param value Number to format
 * @param maxDecimals Maximum number of decimal places to show (default: 1)
 * @returns Formatted number string (e.g. "1.2k", "3.4m")
 */
export const formatNumber = (value: number, maxDecimals: number = 1): string => {
  // Handle zero or invalid values
  if (!value || isNaN(value) || value === 0) return '0';
  
  // For values less than 1000, return as is with no decimal places
  if (value < 1000) return Math.round(value).toString();
  
  // For values 1,000 to 999,999, format as k
  if (value < 1000000) {
    const formatted = (value / 1000).toFixed(maxDecimals);
    // Remove trailing zeros and decimal point if not needed
    return formatted.replace(/\.0+$/, '') + 'k';
  }
  
  // For values 1,000,000 and above, format as m
  const formatted = (value / 1000000).toFixed(maxDecimals);
  // Remove trailing zeros and decimal point if not needed
  return formatted.replace(/\.0+$/, '') + 'm';
};

/**
 * Formats a distance value with consistent decimal places and k/m suffixes for large values
 * @param distance Distance value to format
 * @param isMetric Whether the distance is in kilometers (true) or miles (false)
 * @returns Formatted distance string with appropriate unit and formatting
 */
export const formatDistance = (distance: number, isMetric: boolean = false): string => {
  // Log the input for debugging
  console.log('formatDistance input:', distance, isMetric);
  
  // Handle undefined, null, NaN, or negative values
  if (distance === undefined || distance === null || isNaN(distance) || distance < 0) {
    console.log('Invalid distance value:', distance);
    return '0.0';
  }
  
  // For very small values, don't show as exactly zero
  if (distance === 0) {
    console.log('Zero distance value');
    return '0.0';
  }
  
  // For values less than 1000, always show 1 decimal place
  if (distance < 1000) {
    console.log('Distance < 1000:', distance.toFixed(1));
    return distance.toFixed(1);
  }
  
  // For values 1,000 to 999,999, format as k
  if (distance < 1000000) {
    const formatted = (distance / 1000).toFixed(1);
    // Remove trailing zeros if it's a whole number
    const result = formatted.replace(/\.0$/, '') + 'k';
    console.log('Distance in thousands:', result);
    return result;
  }
  
  // For values 1,000,000 and above, format as m
  const formatted = (distance / 1000000).toFixed(1);
  // Remove trailing zeros if it's a whole number
  const result = formatted.replace(/\.0$/, '') + 'm';
  console.log('Distance in millions:', result);
  return result;
};