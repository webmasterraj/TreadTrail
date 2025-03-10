import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOW, PACE_COLORS } from '../../styles/theme';
import { WorkoutProgram, WorkoutSegment } from '../../types';
import { formatDuration } from '../../utils/helpers';

interface WorkoutCardProps {
  workout: WorkoutProgram;
  onPress: () => void;
  onFavoriteToggle: () => void;
  showVisualization?: boolean;
  showFavoriteButton?: boolean;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ 
  workout, 
  onPress, 
  onFavoriteToggle,
  showVisualization = false,
  showFavoriteButton = true
}) => {
  const { 
    name, 
    description, 
    duration, 
    difficulty, 
    focus, 
    favorite,
    segments
  } = workout;

  // Get difficulty as star rating
  const getDifficultyStars = () => {
    switch(difficulty) {
      case 'beginner':
        return '★';
      case 'intermediate':
        return '★★';
      case 'advanced':
        return '★★★';
      default:
        return '★';
    }
  };

  // Count intervals in the workout
  const countIntervals = () => {
    if (!segments || segments.length === 0) return 0;
    
    // Count transitions between different pace types
    let intervalCount = 1; // Start with 1 for the first segment
    
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].type !== segments[i-1].type) {
        intervalCount++;
      }
    }
    
    return intervalCount;
  };

  // Render visualization bars for the workout
  const renderVisualizationBars = () => {
    if (!segments || segments.length === 0) return null;
    
    // Group consecutive segments of the same type
    const groupedSegments: {type: string, duration: number}[] = [];
    let currentType = segments[0].type;
    let currentDuration = segments[0].duration;
    
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].type === currentType) {
        currentDuration += segments[i].duration;
      } else {
        groupedSegments.push({
          type: currentType,
          duration: currentDuration
        });
        currentType = segments[i].type;
        currentDuration = segments[i].duration;
      }
    }
    
    // Add the last group
    groupedSegments.push({
      type: currentType,
      duration: currentDuration
    });
    
    // Limit to a reasonable number of bars
    const maxBars = 20;
    const displaySegments = groupedSegments.length > maxBars 
      ? groupedSegments.slice(0, maxBars) 
      : groupedSegments;
    
    return (
      <View style={styles.visualizationContainer} testID="visualization-container">
        <View style={styles.barContainer}>
          {displaySegments.map((segment, index) => {
            // Determine bar height based on intensity
            let height = 10; // Default height
            switch(segment.type) {
              case 'recovery':
                height = 10;
                break;
              case 'base':
                height = 15;
                break;
              case 'run':
                height = 20;
                break;
              case 'sprint':
                height = 24;
                break;
            }
            
            // Determine spacing between bars
            let marginRight = 4; // Default spacing for close bars
            
            // For the last bar in a grouping, add more space
            // Use different interval types based on duration patterns
            const isLastInGroup = index < displaySegments.length - 1 && 
                                 displaySegments[index+1].type !== segment.type;
            
            if (isLastInGroup) {
              if (segment.duration > 120) { // Long interval
                marginRight = 12; // extra-long-interval from mockup
              } else if (segment.duration > 60) { // Medium interval
                marginRight = 8; // medium-interval from mockup
              }
            } else if (index === displaySegments.length - 1) {
              marginRight = 0; // Last bar has no margin
            }
            
            return (
              <View 
                key={index}
                style={[
                  styles.bar,
                  { 
                    height, 
                    backgroundColor: PACE_COLORS[segment.type],
                    marginRight
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Favorite Heart Icon - Only shown if showFavoriteButton is true */}
      {showFavoriteButton && (
        <TouchableOpacity 
          style={styles.favoriteHeart} 
          onPress={onFavoriteToggle}
          testID="favorite-button"
        >
          <Text style={[styles.heartIcon, Boolean(favorite) && styles.activeHeart]}>
            {Boolean(favorite) ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Workout Name */}
      <Text style={styles.title}>{name}</Text>
      
      {/* Workout Meta Information */}
      <View style={styles.metaContainer}>
        <Text style={styles.metaItem}>{formatDuration(duration)}</Text>
        <Text style={styles.metaItem}>{getDifficultyStars()} intensity</Text>
        <Text style={styles.metaItem}>{countIntervals()} intervals</Text>
      </View>
      
      {/* Visualization Bars */}
      {showVisualization && renderVisualizationBars()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12, // Exact value from mockup
    padding: 14, // Exact value from mockup
    marginBottom: 15, // Exact gap between cards from mockup
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    position: 'relative',
  },
  title: {
    color: COLORS.accent,
    fontSize: 20, // Exact value from mockup
    fontWeight: '700', // Bold as per mockup
    marginBottom: 3, // Exact value from mockup
    letterSpacing: -0.5, // For that custom font feel in the mockup
    fontFamily: 'System', // Try to match the system font mentioned in mockup
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 15, // Exact value from mockup
    marginBottom: 8, // Exact value from mockup
  },
  metaItem: {
    color: 'rgba(255, 255, 255, 0.6)', // Exact color from mockup
    fontSize: 12, // Exact value from mockup
  },
  favoriteHeart: {
    position: 'absolute',
    top: 14, // Exact value from mockup
    right: 14, // Exact value from mockup
    zIndex: 1,
    width: 24, // Exact value from mockup
    height: 24, // Exact value from mockup
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 24, // Larger to match mockup
    color: 'rgba(255, 255, 255, 0.5)', // Exact color from mockup
  },
  activeHeart: {
    color: COLORS.accent,
  },
  visualizationContainer: {
    height: 25, // Exact value from mockup
    width: '100%',
  },
  barContainer: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'flex-end',
    width: '100%',
  },
  bar: {
    width: 6, // Exact value from mockup
    borderRadius: 3, // Exact value from mockup
    marginRight: 4, // Default spacing between bars
  },
});

export default WorkoutCard;