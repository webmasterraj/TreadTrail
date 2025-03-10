/**
 * Utility functions for time and duration formatting
 */

/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds Total duration in seconds
 * @param showSeconds Whether to include seconds in the output
 * @returns Formatted duration string (e.g., "1h 30m" or "45m 30s")
 */
export const formatDuration = (seconds: number, showSeconds = true): string => {
  if (seconds <= 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  if (showSeconds && (remainingSeconds > 0 || (!hours && !minutes))) {
    result += `${remainingSeconds}s`;
  }
  
  return result.trim();
};

/**
 * Formats seconds into MM:SS format
 * @param seconds Total seconds
 * @returns Formatted time string (e.g., "05:30")
 */
export const formatTimeMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formats seconds into HH:MM:SS format
 * @param seconds Total seconds
 * @returns Formatted time string (e.g., "01:30:45")
 */
export const formatTimeHHMMSS = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
