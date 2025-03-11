import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { WorkoutSegment, PaceType } from '../../types';
import { COLORS, PACE_COLORS } from '../../styles/theme';

interface WorkoutVisualizationProps {
  segments: WorkoutSegment[];
  progressPosition?: number; // Position in seconds - for workout in progress
  minutePerBar?: boolean; // If true, each bar represents 1 minute, otherwise 30 seconds
  showOverlay?: boolean; // Show darkened overlay for completed portions
  maxBars?: number; // Maximum bars to display
}

const WorkoutVisualization: React.FC<WorkoutVisualizationProps> = ({
  segments,
  progressPosition = -1,
  minutePerBar = true,
  showOverlay = false,
  maxBars = 40
}) => {
  // Calculate total duration
  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
  
  // Calculate the maximum incline and check if there's only one incline value
  const { maxIncline, hasSingleIncline } = useMemo(() => {
    if (!segments || segments.length === 0) {
      return { maxIncline: 0, hasSingleIncline: true };
    }
    
    const inclineValues = new Set(segments.map(segment => segment.incline));
    const maxIncline = Math.max(...segments.map(segment => segment.incline));
    
    return {
      maxIncline,
      hasSingleIncline: inclineValues.size === 1
    };
  }, [segments]);
  
  // Calculate height based on incline
  const getInclineHeight = (incline: number): number => {
    // Container height minus padding
    const containerHeight = 32; // 40px container - 8px padding
    
    if (hasSingleIncline) {
      // If only one incline value, use half the container height
      return containerHeight / 2;
    } else {
      // If multiple inclines, make heights proportional to max incline
      if (maxIncline === 0) return containerHeight / 4; // Avoid division by zero
      return (incline / maxIncline) * containerHeight;
    }
  };
  
  // Render visualization bars
  const renderBars = () => {
    // For progress tracking
    const progressPercent = progressPosition > 0 ? Math.min(1, progressPosition / totalDuration) : 0;
    
    // Calculate container width for proportional spacing
    const containerWidth = Dimensions.get('window').width - 32; // Accounting for padding/margins
    const barWidth = 6; // Fixed width for each bar
    
    // Create elements for visualization
    const visualizationElements: JSX.Element[] = [];
    
    // Add connecting line first (it will be at the bottom)
    visualizationElements.push(
      <View 
        key="connecting-line"
        style={[
          styles.connectingLine,
          { width: containerWidth - 12 } // Slightly shorter than container to account for bar radius
        ]} 
      />
    );
    
    // Add a bar for each segment
    segments.forEach((segment, index) => {
      const paceType = segment.type as PaceType;
      const incline = segment.incline;
      const barHeight = getInclineHeight(incline);
      
      // Calculate position based on segment duration proportion
      let positionPercent = 0;
      
      if (index === 0) {
        // First bar starts at the beginning
        positionPercent = 0;
      } else {
        // Calculate position based on proportion of total duration
        const previousSegmentsDuration = segments.slice(0, index).reduce((sum, s) => sum + s.duration, 0);
        positionPercent = (previousSegmentsDuration / totalDuration) * 100;
      }
      
      // Add the segment bar
      visualizationElements.push(
        <View 
          key={`segment-${index}`}
          style={[
            styles.segmentBar, 
            { 
              height: barHeight, 
              backgroundColor: PACE_COLORS[paceType],
              left: `${positionPercent}%`,
            }
          ]} 
        />
      );
    });
    
    return visualizationElements;
  };

  // Calculate progress for the overlay
  const progressPercent = progressPosition > 0 ? Math.min(1, progressPosition / totalDuration) * 100 : 0;
  
  return (
    <View style={styles.visualizationContainer}>
      <View style={styles.barContainer}>
        {/* Progress overlay */}
        {showOverlay && progressPosition > 0 && (
          <View 
            style={[
              styles.progressOverlay,
              { width: `${progressPercent}%` }
            ]} 
          />
        )}
        
        {/* Progress marker */}
        {progressPosition > 0 && (
          <View 
            style={[
              styles.progressMarker,
              { left: `${progressPercent}%` }
            ]} 
          />
        )}
        
        {/* Render bars */}
        {renderBars()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  visualizationContainer: {
    height: 40,
    width: '100%',
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 4,
  },
  barContainer: {
    height: '100%',
    alignItems: 'flex-end',
    position: 'relative',
    width: '100%',
  },
  segmentBar: {
    position: 'absolute',
    width: 6,
    borderRadius: 3,
    bottom: 0,
    zIndex: 2,
  },
  connectingLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: COLORS.lightGray,
    bottom: 0,
    left: 6, // Offset to center with bars
    zIndex: 1,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
  progressMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.white,
    zIndex: 2,
  },
});

export default WorkoutVisualization;