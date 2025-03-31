import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import { WorkoutSegment } from '../../types';
import { COLORS, PACE_COLORS } from '../../styles/theme';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { 
  selectProgressIndicatorPosition, 
  selectCurrentSegmentIndex
} from '../../redux/slices/workoutSlice';

interface WorkoutVisualizationProps {
  segments: WorkoutSegment[];
  minutePerBar?: boolean; // If true, each bar represents 1 minute, otherwise 30 seconds
  showOverlay?: boolean; // Show darkened overlay for completed portions
  maxBars?: number; // Maximum bars to display
  containerHeight?: number; // Optional prop for parent to specify height
  currentSegmentIndex?: number;
  progressIndicatorPosition?: number;
  showTimeLabels?: boolean; // Control time labels visibility
  showTicks?: boolean; // Control ticks visibility
  connectingLineOffset?: number; // Add this prop
  showConnectingLine?: boolean; // New prop to control connecting line visibility
  opacity?: number; // Add opacity prop for premium preview
}

/**
 * WorkoutVisualization Component
 * 
 * Displays a visual representation of workout segments with a progress indicator.
 * The progress indicator position is managed by Redux, ensuring consistent positioning
 * across the app, especially during segment transitions and skips.
 * 
 * Key features:
 * - Visualizes workout segments with colored bars
 * - Shows a progress line indicating current position in the workout
 * - Handles segment filtering when there are too many segments to display
 * - Automatically updates as workout progresses through Redux state changes
 */
const WorkoutVisualization: React.FC<WorkoutVisualizationProps> = ({
  segments,
  minutePerBar = false,
  showOverlay = false,
  maxBars = 40,
  containerHeight,
  currentSegmentIndex = 0,
  progressIndicatorPosition = 0,
  showTimeLabels = true, // Default to showing time labels
  showTicks = true, // Default to showing ticks
  connectingLineOffset = 0, // Default to 0 (bottom)
  showConnectingLine = true, // Default to showing connecting line
  opacity = 1, // Default to full opacity
}) => {
  // Add state to track measured height
  const [measuredHeight, setMeasuredHeight] = useState(0);
  
  // Use ref for container width to prevent frequent re-renders
  const containerWidthRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Debounce timer for container width changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get progress data from Redux
  const progressIndicatorPositionFromRedux = useAppSelector(selectProgressIndicatorPosition);
  const currentSegmentIndexFromRedux = useAppSelector(selectCurrentSegmentIndex);
  
  // Get dispatch function
  const dispatch = useAppDispatch();
  
  // Memoize the segments and positions to avoid unnecessary recalculations
  const memoizedSegments = useMemo(() => {
    if (!segments || segments.length === 0 || !containerWidth) {
      return [];
    }
    
    // Calculate total duration for all segments
    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
    
    // Calculate positions and widths for each segment
    let startPosition = 0;
    
    return segments.map((segment, index) => {
      // Calculate segment width as a percentage of the total width
      const segmentWidth = (segment.duration / totalDuration) * containerWidth;
      
      // Create segment object with position information
      const segmentObject = {
        ...segment,
        left: startPosition,
        width: segmentWidth,
        index,
      };
      
      // Update start position for the next segment
      startPosition += segmentWidth;
      
      return segmentObject;
    });
  }, [segments, containerWidth]);
  
  // Calculate the position of the progress line based on the progress indicator position
  const getProgressLinePosition = useCallback(() => {
    // Get the progress indicator position (0-100%)
    const progressPosition = progressIndicatorPosition || progressIndicatorPositionFromRedux;
    
    // Calculate the pixel position based on the percentage 
    const pixelPosition = (containerWidth * progressPosition) / 100;
    
    // Ensure the position is within bounds
    if (progressPosition <= 0) return 0; 
    if (progressPosition >= 100) return containerWidth; 
    
    return pixelPosition;
  }, [containerWidth, progressIndicatorPosition, progressIndicatorPositionFromRedux]);
  
  // Handle container width changes with debounce
  const updateContainerWidth = (width: number) => {
    // Store the latest width in the ref immediately
    containerWidthRef.current = width;
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer to update the state after a delay
    debounceTimerRef.current = setTimeout(() => {
      // Only update if the width has actually changed
      if (containerWidth !== containerWidthRef.current) {
        setContainerWidth(containerWidthRef.current);
      }
    }, 300); // 300ms debounce
  };
  
  // Clean up the debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Calculate total duration
  const getTotalDuration = useCallback(() => {
    if (!segments || segments.length === 0) return 0;
    return segments.reduce((sum, segment) => sum + segment.duration, 0);
  }, [segments]);

  // Calculate the maximum incline and check if there's only one incline value
  const { maxIncline, hasSingleIncline } = useMemo(() => {
    if (!memoizedSegments || memoizedSegments.length === 0) {
      return { maxIncline: 0, hasSingleIncline: true };
    }
    
    const inclineValues = new Set(memoizedSegments.map(segment => segment.incline));
    
    // Explicitly find the max incline to avoid potential issues
    let maxInclineValue = 0;
    memoizedSegments.forEach(segment => {
      if (segment.incline > maxInclineValue) {
        maxInclineValue = segment.incline;
      }
    });
    
    return {
      maxIncline: maxInclineValue || 1, // Ensure we never have a zero max incline
      hasSingleIncline: inclineValues.size === 1
    };
  }, [memoizedSegments]);
  
  // Calculate height based on incline
  const getInclineHeight = (incline: number): number => {
    // Use provided containerHeight, measured height, or a default
    const effectiveHeight = containerHeight || measuredHeight || 100;
    
    // Ensure we have a minimum height for visibility
    const minHeight = effectiveHeight * 0.15; // At least 15% of container height
    
    if (hasSingleIncline) {
      // If all inclines are the same, use a standard height
      return effectiveHeight * 0.35; // 35% of available height
    }
    
    // Calculate height based on incline relative to max incline
    const heightPercentage = incline / maxIncline;
    
    // Scale the height to fit within the container, leaving space at the top
    const maxBarHeight = effectiveHeight * 0.85; // Maximum 85% of container height
    
    // Calculate the final height, ensuring it's at least the minimum height
    return Math.max(minHeight, heightPercentage * maxBarHeight);
  };
  
  // Determine which segments to show based on minutePerBar setting
  const displaySegments = useMemo(() => {
    let result = [...memoizedSegments];
    
    // Limit the number of bars to maxBars
    if (result.length > maxBars) {
      // Calculate how many segments to skip
      const skipFactor = Math.ceil(result.length / maxBars);
      
      // Filter segments to show only every nth segment
      result = result.filter((_, index) => index % skipFactor === 0);
    }
    
    return result;
  }, [memoizedSegments, maxBars]);
  
  // Calculate positions for each segment based on duration
  const segmentPositions = useMemo(() => {
    const positions: { left: number; width: number; segment: WorkoutSegment }[] = [];
    
    if (!displaySegments.length || containerWidth === 0) return positions;
    
    // Calculate total duration of displayed segments
    const displayedTotalDuration = displaySegments.reduce((sum, segment) => sum + segment.duration, 0);
    
    // Bar dimensions
    const barWidth = 4; // Width of each bar
    
    // Calculate time scale - how many pixels per second using full container width
    const timeScale = containerWidth / displayedTotalDuration;
    
    let cumulativeDuration = 0;
    
    displaySegments.forEach((segment, index) => {
      // Position is based on the cumulative duration up to this segment
      const left = cumulativeDuration * timeScale;
      
      positions.push({
        left,
        width: barWidth,
        segment
      });
      
      // Update cumulative duration for next segment
      cumulativeDuration += segment.duration;
    });
    
    return positions;
  }, [displaySegments, containerWidth]);

  return (
    <View 
      style={[
        styles.container, 
        containerHeight ? { height: containerHeight } : null,
        { opacity: opacity } // Apply opacity to the entire visualization
      ]}
      onLayout={(event: LayoutChangeEvent) => {
        const {height, width} = event.nativeEvent.layout;
        setMeasuredHeight(height);
        updateContainerWidth(width);
      }}
    >
      <View style={[styles.barsContainer, { paddingLeft: 8, paddingRight: 8 }]}>
        {displaySegments.map((segment, index) => (
          <View
            key={`bar-${index}`}
            style={[
              styles.bar,
              {
                height: getInclineHeight(segment.incline),
                backgroundColor: PACE_COLORS[segment.type],
                width: segmentPositions[index]?.width || 4,
                left: segmentPositions[index]?.left || 0,
                position: 'absolute',
              },
            ]}
          />
        ))}
      </View>
      
      {/* Dark overlay for completed portions */}
      {showOverlay && progressIndicatorPosition > 0 && (
        <View 
          style={[
            styles.completedOverlay, 
            { 
              width: `${progressIndicatorPosition}%`,
              // borderTopLeftRadius: 12,
              // borderBottomLeftRadius: 12,
              // // If we're at the end, make sure both corners are rounded
              borderTopRightRadius: progressIndicatorPosition >= 99 ? 12 : 0,
              borderBottomRightRadius: progressIndicatorPosition >= 99 ? 12 : 0,
            }
          ]} 
        />
      )}
      
      {/* Progress indicator line */}
      {progressIndicatorPosition > 0 && (
        <View 
          style={[
            styles.progressLine, 
            { 
              left: `${progressIndicatorPosition}%` 
            }
          ]} 
        />
      )}
      
      {/* Connecting line at the bottom of the bars */}
      {showConnectingLine && (
        <View 
          style={[
            styles.connectingLine, 
            { 
              left: 0, 
              right: 0, 
              // Calculate position dynamically based on container height
              bottom: connectingLineOffset === 0 ? 0 : Math.min(connectingLineOffset, (containerHeight || 100) * 0.1),
              zIndex: 2 
            }
          ]} 
        />
      )}
      
      {/* Minute ticks and time labels */}
      {(showTicks || showTimeLabels) && displaySegments && displaySegments.length > 0 && (() => {
        const totalMinutes = Math.floor(getTotalDuration() / 60);
        
        // Define the type for major ticks
        interface MajorTick {
          minute: number;
          percentPosition: number;
          percentile: number; // Add percentile value to track which position it corresponds to
        }
        
        // Calculate desired quarter positions
        const desiredPositions = [0, 0.25, 0.5, 0.75, 1];
        
        // Find the closest minute to each desired position
        const majorTicks: MajorTick[] = [];
        
        desiredPositions.forEach(desiredPos => {
          // Convert position to minute
          const exactMinute = desiredPos * totalMinutes;
          // Round to nearest minute
          const closestMinute = Math.round(exactMinute);
          // Calculate the actual percentage position based on the minute
          const actualPercentPosition = (closestMinute * 100) / totalMinutes;
          
          majorTicks.push({
            minute: closestMinute,
            percentPosition: actualPercentPosition,
            percentile: desiredPos // Store the original percentile
          });
        });
        
        return (
          <>
            {/* Ticks */}
            {showTicks && (
              <View style={styles.ticksContainer}>
                {Array.from({ length: totalMinutes + 1 }).map((_, index) => {
                  // Check if this is a major tick using the stored data
                  const isMajorTick = majorTicks.some(tick => 
                    tick.minute === index
                  );
                  
                  return (
                    <View 
                      key={`tick-${index}`} 
                      style={[
                        isMajorTick ? styles.majorTick : styles.tick, 
                        { left: `${(index * 100) / totalMinutes}%` }
                      ]} 
                    />
                  );
                })}
              </View>
            )}
            
            {/* Time labels - using the same major tick positions */}
            {showTimeLabels && (
              <View style={styles.timeLabelsContainer}>
                {majorTicks.map((tick, index) => {
                  // Only show labels for 0%, 50%, and 100% based on percentile
                  if (tick.percentile === 0 || tick.percentile === 0.5 || tick.percentile === 1) {
                    return (
                      <Text 
                        key={`label-${index}`}
                        style={[
                          styles.timeLabel, 
                          { 
                            position: 'absolute', 
                            left: `${tick.percentPosition}%`,
                            transform: [{ translateX: -5 }], // Center the text
                            textAlign: 'center',
                          }
                        ]}
                      >
                        {tick.minute}'
                      </Text>
                    );
                  }
                  
                  // Return null for ticks that shouldn't have labels
                  return null;
                })}
              </View>
            )}
          </>
        );
      })()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '90%',
    width: '100%',
    paddingBottom: 12,
  },
  bar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  connectingLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  timeLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 4,
  },
  timeLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
  },
  ticksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 4,
  },
  tick: {
    width: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  majorTick: {
    position: 'absolute',
    height: 8,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    bottom: 0,
    transform: [{ translateX: -0.75 }], // Center the tick
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    zIndex: 1,
  },
  progressLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2, 
    backgroundColor: COLORS.white, 
    zIndex: 10, 
  },
});

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(WorkoutVisualization, (prevProps, nextProps) => {
  // Optimize rendering by checking if props have changed
  const segmentsEqual = prevProps.segments.length === nextProps.segments.length && 
    prevProps.segments.every((segment, index) => 
      segment.type === nextProps.segments[index].type && 
      segment.duration === nextProps.segments[index].duration &&
      segment.incline === nextProps.segments[index].incline
    );
  
  return (
    prevProps.minutePerBar === nextProps.minutePerBar &&
    prevProps.showOverlay === nextProps.showOverlay &&
    prevProps.maxBars === nextProps.maxBars &&
    prevProps.containerHeight === nextProps.containerHeight &&
    prevProps.currentSegmentIndex === nextProps.currentSegmentIndex &&
    prevProps.progressIndicatorPosition === nextProps.progressIndicatorPosition &&
    prevProps.showTimeLabels === nextProps.showTimeLabels &&
    prevProps.showTicks === nextProps.showTicks &&
    prevProps.connectingLineOffset === nextProps.connectingLineOffset &&
    prevProps.showConnectingLine === nextProps.showConnectingLine &&
    prevProps.opacity === nextProps.opacity &&
    segmentsEqual
  );
});