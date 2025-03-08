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
 * Formats seconds into a more readable duration (e.g. "5 min 30 sec")
 * @param seconds Number of seconds
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }
  
  return `${minutes} min ${remainingSeconds} sec`;
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