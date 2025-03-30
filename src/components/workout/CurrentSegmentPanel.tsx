import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSegment, PaceType } from '../../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, PACE_COLORS } from '../../styles/theme';
import { formatTime } from '../../utils/helpers';
import { useUserSettings } from '../../hooks';

interface CurrentSegmentPanelProps {
  segment: WorkoutSegment;
  timeRemaining: number;
}

const CurrentSegmentPanel: React.FC<CurrentSegmentPanelProps> = ({ 
  segment, 
  timeRemaining 
}) => {
  const { userSettings } = useUserSettings();
  
  const { type, incline } = segment;
  
  // Get user's pace settings for current segment type
  const paceSetting = userSettings?.paceSettings[type as PaceType];
  
  // Get units from user preferences
  const units = userSettings?.preferences.units || 'imperial';
  
  // Format speed based on units
  const speedLabel = units === 'imperial' ? 'mph' : 'kph';
  const speed = paceSetting?.speed || 0;
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: PACE_COLORS[type as PaceType] }
    ]}>
      <View style={styles.header}>
        <Text style={styles.title}>{type.toUpperCase()}</Text>
        <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>SPEED</Text>
          <Text style={styles.detailValue}>
            {speed.toFixed(1)} {speedLabel}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>INCLINE</Text>
          <Text style={styles.detailValue}>{incline}%</Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${(timeRemaining / segment.duration) * 100}%`,
              backgroundColor: COLORS.white 
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  timer: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.medium,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.black,
    opacity: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.black,
    opacity: 0.2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});

export default CurrentSegmentPanel;