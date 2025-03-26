import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { COLORS } from '../../styles/theme';
import { WorkoutProgram } from '../../types';
import WorkoutVisualization from './WorkoutVisualization';
import { formatDuration } from '../../utils/helpers';
import TrialBanner from '../subscription/TrialBanner';

interface WorkoutCardProps {
  workout: WorkoutProgram;
  onPress: () => void;
  onFavoriteToggle: () => void;
  showVisualization?: boolean;
  showFavoriteButton?: boolean;
  showTicks?: boolean;
  showTimeLabels?: boolean;
  showConnectingLine?: boolean;
  isSubscribed?: boolean;
  isTrialActive?: boolean;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ 
  workout, 
  onPress, 
  onFavoriteToggle,
  showVisualization = false,
  showFavoriteButton = true,
  showTicks = true,
  showTimeLabels = true,
  showConnectingLine = true,
  isSubscribed = false,
  isTrialActive = false
}) => {
  const { 
    id, 
    name, 
    description, 
    duration, 
    intensity, 
    focus, 
    favorite,
    segments,
    premium
  } = workout;

  // Add state for card dimensions and visualization height
  const [cardWidth, setCardWidth] = useState(0);
  const [visualizationHeight, setVisualizationHeight] = useState(60); // Default height

  // Get intensity stars
  const getIntensityStars = () => {
    const stars = '★'.repeat(intensity);
    return stars || '★'; // Default to one star if intensity is not set
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

  // Calculate visualization height based on card width for proper aspect ratio
  useEffect(() => {
    if (cardWidth > 0) {
      // Use an aspect ratio approach - wider cards get proportionally taller visualizations
      const aspectRatio = 4; // Width to height ratio
      const calculatedHeight = cardWidth / aspectRatio;
      setVisualizationHeight(Math.max(calculatedHeight, 60)); // At least 60px
    }
  }, [cardWidth]);

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        premium && !isSubscribed && styles.premiumContainer
      ]} 
      onPress={onPress}
      onLayout={(e: LayoutChangeEvent) => setCardWidth(e.nativeEvent.layout.width)}
      activeOpacity={0.7}
    >
      {/* Premium Badge - Show for premium workouts when not subscribed */}
      {premium && !isSubscribed && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>PREMIUM</Text>
        </View>
      )}
      
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
      
      <View style={styles.contentContainer}>
        {/* Workout Name */}
        <Text style={styles.title}>{name}</Text>
        
        {/* Workout Meta Information */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaItem}>{formatDuration(duration, 'decimal')}</Text>
          <Text style={styles.metaItem}>★ {intensity}</Text>
          <Text style={styles.metaItem}>{segments.length} intervals</Text>
        </View>
        
        {/* Trial Banner - Show compact version for premium workouts during trial */}
        {premium && isTrialActive && (
          <TrialBanner compact={true} />
        )}
        
        {/* Visualization using the shared component */}
        {showVisualization && segments && segments.length > 0 && (
          <View style={[styles.visualizationContainer, { height: visualizationHeight }]}>
            <WorkoutVisualization 
              segments={segments} 
              minutePerBar={true}
              containerHeight={visualizationHeight - 12} // Account for margins
              showTimeLabels={showTimeLabels} 
              showTicks={showTicks} 
              showConnectingLine={showConnectingLine}
              connectingLineOffset={20} // Match the offset used in other screens
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    position: 'relative',
    minHeight: 120, 
  },
  premiumContainer: {
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 11,
    borderBottomRightRadius: 11,
    zIndex: 1,
  },
  premiumText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    color: COLORS.accent,
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 2, 
    letterSpacing: -0.5, 
    fontFamily: 'System', 
  },
  contentContainer: {
    flex: 1,
    marginTop: 10, // Fixed margin for all cards
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12, 
    marginBottom: 6, 
  },
  metaItem: {
    color: 'rgba(255, 255, 255, 0.6)', 
    fontSize: 11, 
  },
  favoriteHeart: {
    position: 'absolute',
    top: 14, 
    right: 14, 
    zIndex: 1,
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
    height: 50, 
    width: '100%',
    marginTop: 6, 
    marginBottom: 0, 
  }
});

export default WorkoutCard;