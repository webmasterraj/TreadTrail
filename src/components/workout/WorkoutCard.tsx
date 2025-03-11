import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOW, PACE_COLORS } from '../../styles/theme';
import { WorkoutProgram, WorkoutSegment } from '../../types';
import WorkoutVisualization from './WorkoutVisualization';
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
      
      {/* Visualization using the shared component */}
      {showVisualization && segments && segments.length > 0 && (
        <View style={styles.visualizationContainer} testID="visualization-container">
          <WorkoutVisualization 
            segments={segments}
            minutePerBar={true}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 15, 
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    position: 'relative',
  },
  title: {
    color: COLORS.accent,
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 3, 
    letterSpacing: -0.5, 
    fontFamily: 'System', 
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 15, 
    marginBottom: 8, 
  },
  metaItem: {
    color: 'rgba(255, 255, 255, 0.6)', 
    fontSize: 12, 
  },
  favoriteHeart: {
    position: 'absolute',
    top: 14, 
    right: 14, 
    zIndex: 1,
    width: 24, 
    height: 24, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 24, 
    color: 'rgba(255, 255, 255, 0.5)', 
  },
  activeHeart: {
    color: COLORS.accent,
  },
  visualizationContainer: {
    height: 40, 
    width: '100%',
    marginTop: 8, 
  }
});

export default WorkoutCard;