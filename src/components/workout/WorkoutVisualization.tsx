import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { WorkoutSegment, PaceType } from '../../types';
import { COLORS, PACE_COLORS } from '../../styles/theme';

interface WorkoutVisualizationProps {
  segments: WorkoutSegment[];
  progressPosition?: number; // Position in seconds - for workout in progress
  minutePerBar?: boolean; // If true, each bar represents 1 minute, otherwise 30 seconds
  showOverlay?: boolean; // Show darkened overlay for completed portions
  maxBars?: number; // Maximum bars to display
  containerHeight?: number; // Optional prop for parent to specify height
  currentSegmentIndex?: number; // Current segment index from parent
  isSkipping?: boolean; // Whether a segment skip is in progress
}

const WorkoutVisualization: React.FC<WorkoutVisualizationProps> = ({
  segments,
  progressPosition = -1,
  minutePerBar = true,
  showOverlay = false,
  maxBars = 40,
  containerHeight,
  currentSegmentIndex = -1,
  isSkipping = false
}) => {
  // Add state to track measured height
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Calculate total duration
  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
  
  // Calculate the maximum incline and check if there's only one incline value
  const { maxIncline, hasSingleIncline } = useMemo(() => {
    if (!segments || segments.length === 0) {
      return { maxIncline: 0, hasSingleIncline: true };
    }
    
    const inclineValues = new Set(segments.map(segment => segment.incline));
    
    // Explicitly find the max incline to avoid potential issues
    let maxInclineValue = 0;
    segments.forEach(segment => {
      if (segment.incline > maxInclineValue) {
        maxInclineValue = segment.incline;
      }
    });
    
    return {
      maxIncline: maxInclineValue || 1, // Ensure we never have a zero max incline
      hasSingleIncline: inclineValues.size === 1
    };
  }, [segments]);
  
  // Calculate height based on incline
  const getInclineHeight = (incline: number): number => {
    // Use provided containerHeight, measured height, or a default
    const effectiveHeight = containerHeight || measuredHeight || 100;
    
    // Container height minus padding
    const availableHeight = effectiveHeight - 16; // Account for padding
    
    // Ensure we have a minimum height for visibility
    const minHeight = availableHeight * 0.15; // At least 15% of container height
    
    if (hasSingleIncline) {
      // If all inclines are the same, use a standard height
      return availableHeight * 0.5; // 50% of available height
    }
    
    // Calculate height based on incline relative to max incline
    const heightPercentage = incline / maxIncline;
    
    // Scale the height to fit within the container, leaving space at the top
    const maxBarHeight = availableHeight * 0.85; // Maximum 85% of container height
    
    // Calculate the final height, ensuring it's at least the minimum height
    return Math.max(minHeight, heightPercentage * maxBarHeight);
  };
  
  // Determine which segments to show based on minutePerBar setting
  let displaySegments = [...segments];
  
  // Limit the number of bars to maxBars
  if (displaySegments.length > maxBars) {
    // Calculate how many segments to skip
    const skipFactor = Math.ceil(displaySegments.length / maxBars);
    
    // Filter segments to show only every nth segment
    displaySegments = displaySegments.filter((_, index) => index % skipFactor === 0);
  }
  
  // Calculate positions for each segment based on duration
  const segmentPositions = useMemo(() => {
    if (!displaySegments.length || containerWidth === 0) return [];
    
    // Calculate total duration of displayed segments
    const displayedTotalDuration = displaySegments.reduce((sum, segment) => sum + segment.duration, 0);
    
    // Bar dimensions
    const barWidth = 4; // Width of each bar
    
    // Calculate available width for time representation (accounting for padding and all bar widths)
    const totalBarWidth = barWidth * displaySegments.length;
    const availableWidth = containerWidth - 16 - totalBarWidth; // Container width minus padding and total bar width
    
    // Calculate the time scale - how many pixels per second (excluding the space taken by bars)
    const timeScale = availableWidth / displayedTotalDuration;
    
    // Calculate positions
    const positions: { left: number; width: number }[] = [];
    let cumulativeDuration = 0;
    let cumulativeBarWidth = 0;
    
    displaySegments.forEach((segment, index) => {
      // Position is based on the cumulative duration up to this segment plus the width of previous bars
      const left = 8 + (cumulativeDuration * timeScale) + cumulativeBarWidth;
      
      positions.push({
        left,
        width: barWidth
      });
      
      // Update cumulative duration for next segment
      cumulativeDuration += segment.duration;
      cumulativeBarWidth += barWidth;
    });
    
    return positions;
  }, [displaySegments, containerWidth]);

  // Calculate the progress line position
  const getProgressLinePosition = (): number => {
    if (progressPosition < 0) return 0;
    
    // If there are no segment positions calculated yet, use percentage
    if (!segmentPositions.length) {
      const progressPercentage = Math.min(100, (progressPosition / totalDuration) * 100);
      return progressPercentage;
    }
    
    // Always prioritize using the currentSegmentIndex when available
    if (currentSegmentIndex >= 0 && currentSegmentIndex < segments.length) {
      // Find the corresponding index in displaySegments
      let displayIndex = 0;
      
      // Check if we're filtering segments (when there are too many)
      if (displaySegments.length < segments.length) {
        // Find the closest display segment based on the skip factor
        const skipFactor = Math.ceil(segments.length / maxBars);
        
        // Calculate which display segment corresponds to the current segment
        for (let i = 0; i < displaySegments.length; i++) {
          // Find the original segment index this display segment represents
          const originalIndex = i * skipFactor;
          
          // If this display segment is closest to our current segment, use it
          if (originalIndex >= currentSegmentIndex || i === displaySegments.length - 1) {
            displayIndex = i;
            break;
          }
        }
      } else {
        // No filtering, direct mapping
        displayIndex = Math.min(currentSegmentIndex, displaySegments.length - 1);
      }
      
      // Ensure the display index is valid
      displayIndex = Math.min(displayIndex, segmentPositions.length - 1);
      
      // Get the position of the current segment's bar
      if (segmentPositions[displayIndex]) {
        // If we're skipping, always align exactly with the bar
        if (isSkipping) {
          const barPosition = segmentPositions[displayIndex].left;
          // Convert to percentage of container width
          return (barPosition / containerWidth) * 100;
        }
        
        // Otherwise, calculate if we're at the start of a segment
        // Find the time at the start of the current segment
        let segmentStartTime = 0;
        for (let i = 0; i < currentSegmentIndex; i++) {
          segmentStartTime += segments[i].duration;
        }
        
        // If we're within 1 second of the segment start, align with the bar
        if (Math.abs(progressPosition - segmentStartTime) < 1) {
          const barPosition = segmentPositions[displayIndex].left;
          // Convert to percentage of container width
          return (barPosition / containerWidth) * 100;
        }
      }
    }
    
    // Fallback: calculate position based on elapsed time
    const progressPercentage = Math.min(100, (progressPosition / totalDuration) * 100);
    return progressPercentage;
  };

  return (
    <View 
      style={[
        styles.container, 
        { height: containerHeight || 100 }
      ]}
      onLayout={(event) => {
        const {height, width} = event.nativeEvent.layout;
        setMeasuredHeight(height);
        setContainerWidth(width);
      }}
    >
      <View style={styles.barsContainer}>
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
      
      {/* Connecting line at the bottom of the bars */}
      <View style={styles.connectingLine} />
      
      {/* Progress line */}
      {showOverlay && progressPosition >= 0 && (
        <View
          style={[
            styles.progressLine,
            { left: `${getProgressLinePosition()}%` },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    padding: 8,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  barsContainer: {
    height: '100%',
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  bar: {
    width: 4, // Default width, will be overridden
    marginHorizontal: 0, // Remove margin as we're positioning absolutely
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    bottom: 0, // Align to bottom
  },
  connectingLine: {
    position: 'absolute',
    bottom: 0,
    left: 8, // Adjust for container padding
    right: 8, // Adjust for container padding
    height: 2, // Thinner connecting line
    backgroundColor: COLORS.darkGray,
    zIndex: 0,
  },
  progressLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2, // Thin vertical line
    backgroundColor: COLORS.white, // White color
    zIndex: 2,
  },
});

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(WorkoutVisualization, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.containerHeight === nextProps.containerHeight &&
    prevProps.progressPosition === nextProps.progressPosition &&
    prevProps.showOverlay === nextProps.showOverlay &&
    prevProps.minutePerBar === nextProps.minutePerBar &&
    prevProps.maxBars === nextProps.maxBars &&
    prevProps.currentSegmentIndex === nextProps.currentSegmentIndex &&
    prevProps.isSkipping === nextProps.isSkipping &&
    JSON.stringify(prevProps.segments) === JSON.stringify(nextProps.segments)
  );
});