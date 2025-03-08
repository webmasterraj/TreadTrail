import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { WorkoutSegment, PaceType } from '../../types';
import { COLORS, FONT_SIZES, SPACING, PACE_COLORS } from '../../styles/theme';
import { formatTime, formatDuration } from '../../utils/helpers';

interface WorkoutTimelineProps {
  segments: WorkoutSegment[];
  currentSegmentIndex?: number;
  elapsedTime?: number;
  totalDuration?: number;
  compact?: boolean;
}

const WorkoutTimeline: React.FC<WorkoutTimelineProps> = ({ 
  segments, 
  currentSegmentIndex = -1, 
  elapsedTime = 0,
  totalDuration = 0,
  compact = false,
}) => {
  // Calculate total duration if not provided
  const calculatedTotalDuration = totalDuration || segments.reduce((sum, segment) => sum + segment.duration, 0);
  
  // Function to render a single segment
  const renderSegment = (segment: WorkoutSegment, index: number) => {
    const { type, duration, incline } = segment;
    
    // Calculate segment width as proportion of total duration
    const width = `${(duration / calculatedTotalDuration) * 100}%`;
    
    // Determine segment appearance based on status
    const isPast = currentSegmentIndex > index;
    const isCurrent = currentSegmentIndex === index;
    const isFuture = currentSegmentIndex < index;
    
    // Skip rendering in compact mode if the segment is way in the future
    if (compact && isFuture && index > currentSegmentIndex + 3) {
      return null;
    }
    
    // Skip rendering in compact mode if the segment is in the past
    if (compact && isPast && index < currentSegmentIndex - 1) {
      return null;
    }
    
    return (
      <View 
        key={index} 
        style={[
          styles.segment, 
          { 
            width,
            backgroundColor: PACE_COLORS[type as PaceType],
            opacity: isPast ? 0.5 : 1,
          }
        ]}
      >
        {!compact && (
          <View style={styles.segmentContent}>
            <Text style={styles.segmentType}>{type}</Text>
            <Text style={styles.segmentDuration}>{formatTime(duration)}</Text>
            {incline > 0 && (
              <Text style={styles.segmentIncline}>{incline}%</Text>
            )}
          </View>
        )}
        
        {isCurrent && (
          <View style={styles.currentIndicator} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.timeline}>
          {segments.map(renderSegment)}
        </View>
      </ScrollView>
      
      {!compact && (
        <View style={styles.timeInfo}>
          <Text style={styles.timeInfoText}>
            {formatTime(elapsedTime)} / {formatTime(calculatedTotalDuration)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.medium,
  },
  scrollContent: {
    paddingBottom: SPACING.small,
  },
  timeline: {
    height: 60,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minWidth: 40,
  },
  segmentContent: {
    alignItems: 'center',
  },
  segmentType: {
    color: COLORS.black,
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  segmentDuration: {
    color: COLORS.black,
    fontSize: FONT_SIZES.xs,
  },
  segmentIncline: {
    color: COLORS.black,
    fontSize: FONT_SIZES.xs,
  },
  currentIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    backgroundColor: COLORS.white,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  timeInfoText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
  },
});

export default WorkoutTimeline;