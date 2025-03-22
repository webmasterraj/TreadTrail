import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  LayoutChangeEvent
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WorkoutSegment, PaceType } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, DIFFICULTY_INDICATORS, FOCUS_INDICATORS, PACE_COLORS } from '../styles/theme';
import WorkoutVisualization from '../components/workout/WorkoutVisualization';
import { UserContext } from '../context';
import { formatDuration, formatTime } from '../utils/helpers';
import BottomTabBar from '../components/common/BottomTabBar';
import Button from '../components/common/Button';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  fetchWorkoutPrograms,
  toggleWorkoutFavorite,
  selectWorkoutById
} from '../redux/slices/workoutProgramsSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDetails'>;

const WorkoutDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const dispatch = useAppDispatch();
  // Get user context once at component level
  const { userSettings, authState } = useContext(UserContext);
  
  // Initialize workout data if not loaded
  useEffect(() => {
    dispatch(fetchWorkoutPrograms());
  }, [dispatch]);
  
  // Get the workout from Redux
  const workout = useAppSelector(selectWorkoutById(workoutId));
  
  // Handle case where workout is not found
  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Workout not found</Text>
        <Button 
          title="Back to Workouts" 
          onPress={() => navigation.goBack()}
          type="secondary"
          style={{ marginTop: SPACING.large }}
        />
      </SafeAreaView>
    );
  }
  
  const { 
    id, 
    name, 
    description, 
    duration, 
    intensity,
    category,
    focus, 
    segments,
    premium,
  } = workout;
  
  // Get category and focus info for display
  const categoryInfo = DIFFICULTY_INDICATORS[category];
  const focusInfo = FOCUS_INDICATORS[focus];
  
  // Format total duration
  const formattedDuration = formatDuration(duration);
  
  // Calculate total intervals
  const totalIntervals = segments.length;
  
  // Handle start workout button press
  const handleStartWorkout = () => {
    // Check if user is authenticated
    // Using authState from component-level context
    if (!authState || !authState.isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to start a workout.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('Landing'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }
    
    // Check if user has set up pace settings
    if (!userSettings?.paceSettings) {
      Alert.alert(
        'Pace Settings Required',
        'Please set up your pace settings before starting a workout.',
        [
          {
            text: 'Set Up Now',
            onPress: () => navigation.navigate('EditPace'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }
    
    try {
      console.log('[WorkoutDetailsScreen] Starting workout with ID:', workoutId);
      if (!workoutId || typeof workoutId !== 'string') {
        console.error('[WorkoutDetailsScreen] Invalid workout ID:', workoutId);
        Alert.alert('Error', 'Invalid workout. Please try again.');
        return;
      }
      navigation.navigate('WorkoutInProgress', { workoutId });
    } catch (error) {
      console.error('[WorkoutDetailsScreen] Error navigating to workout:', error);
      Alert.alert('Error', 'Failed to start workout. Please try again.');
    }
  };
  
  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    try {
      if (!workoutId || !workout) {
        return;
      }
      
      // Directly dispatch action to toggle the favorite status
      dispatch(toggleWorkoutFavorite(workoutId));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  
  // Add state for layout measurements
  const [headerHeight, setHeaderHeight] = useState(0);
  const [structureHeight, setStructureHeight] = useState(0);
  const [visualizationHeight, setVisualizationHeight] = useState(100); // Default height
  
  // Calculate visualization height when other sections are measured
  useEffect(() => {
    if (headerHeight > 0) {
      const screenHeight = Dimensions.get('window').height;
      const statusBarHeight = StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 0);
      const navigationHeight = 60; // Approximate height of navigation header
      const sectionTitleHeight = 30; // Approximate height of section titles
      const verticalMargins = 40; // Total vertical margins/padding
      
      // Calculate available space for preview
      const availableHeight = screenHeight * 0.25; // Use 25% of screen height as a guideline
      
      // Set visualization height to a reasonable value based on available space
      const newHeight = Math.max(availableHeight * 0.6, 100); // At least 100px
      setVisualizationHeight(newHeight);
    }
  }, [headerHeight]);
  
  // Render intensity stars
  const renderIntensityStars = () => {
    const stars = '★'.repeat(intensity);
    return stars || '★'; // Default to one star if intensity is not set
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View 
            style={styles.header}
            onLayout={(e: LayoutChangeEvent) => setHeaderHeight(e.nativeEvent.layout.height)}
          >
            <Text style={styles.title}>{name}</Text>
          </View>
          
          <Text style={styles.description}>{description}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(() => {
                  const minutes = Math.floor(duration / 60);
                  const seconds = duration % 60;
                  
                  if (seconds === 0) {
                    return minutes; // Exact minutes, no decimal
                  } else if (seconds === 30) {
                    return `${minutes}.5`; // Half minute, show as .5
                  } else {
                    return parseFloat((minutes + seconds / 60).toFixed(1)); // Other seconds, round to 1 decimal
                  }
                })()}
              </Text>
              <Text style={styles.statLabel}>minutes</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalIntervals}</Text>
              <Text style={styles.statLabel}>intervals</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{renderIntensityStars()}</Text>
              <Text style={styles.statLabel}>intensity</Text>
            </View>
          </View>
          
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Workout Preview</Text>
            <View style={[styles.previewContainer, { height: visualizationHeight }]}>
              <WorkoutVisualization 
                segments={segments} 
                minutePerBar={true}
                containerHeight={visualizationHeight - 10} // Account for margin
                showTimeLabels={true} // Explicitly enable time labels
                connectingLineOffset={10} // Add connecting line offset
              />
            </View>
          </View>
          
          <View 
            style={styles.structureSection}
            onLayout={(e: LayoutChangeEvent) => setStructureHeight(e.nativeEvent.layout.height)}
          >
            <Text style={styles.sectionTitle}>Workout Structure</Text>
            <View style={styles.compactStructure}>
              {segments.map((segment, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.structureRow,
                    styles[`${segment.type}Row`]
                  ]}
                >
                  <View style={styles.timeCell}>
                    <Text style={styles.timeCellText}>{formatTime(segment.duration)}</Text>
                  </View>
                  <View style={styles.paceCell}>
                    <View style={[styles.paceIndicator, { backgroundColor: PACE_COLORS[segment.type as PaceType] }]} />
                    <Text style={styles.paceCellText}>{segment.type.charAt(0).toUpperCase() + segment.type.slice(1)} Pace</Text>
                  </View>
                  <View style={styles.inclineCell}>
                    <Text style={styles.inclineCellText}>{segment.incline}% Incline</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          {/* Only show the Start Workout button for logged-in users */}
          {authState && authState.isAuthenticated && (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartWorkout}
            >
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          )}
          {/* Show sign-in prompt for logged-out users */}
          {(!authState || !authState.isAuthenticated) && (
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => navigation.navigate('Landing')}
            >
              <Text style={styles.signInButtonText}>Sign In to Start Workouts</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        {authState.isAuthenticated && <BottomTabBar activeTab="Workouts" />}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20, // Exact value from mockup
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15, // Exact value from mockup
  },
  title: {
    color: COLORS.accent,
    fontSize: 22, // Exact value from mockup
    fontWeight: 'bold',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)', // Exact value from mockup
    fontSize: 14, // Exact value from mockup
    marginBottom: 20, // Exact value from mockup
    lineHeight: 19.6, // 1.4 line height as in mockup
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20, // Exact value from mockup
    padding: 12, // Exact value from mockup
    backgroundColor: COLORS.darkGray,
    borderRadius: 12, // Exact value from mockup
  },
  statItem: {
    alignItems: 'center',
    fontWeight: 'bold', // As per mockup
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12, // Exact value from mockup
    fontWeight: 'normal', // As per mockup
  },
  statValue: {
    color: COLORS.white,
    fontSize: 18, // Exact value from mockup
    fontWeight: 'bold',
  },
  previewSection: {
    marginBottom: 20, // Exact value from mockup
    paddingHorizontal: 0, // Let the visualization component fill the width
  },
  previewContainer: {
    minHeight: 100, // Minimum height as a fallback
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18, // Exact value from mockup
    fontWeight: 'bold',
    marginBottom: 12, // Exact value from mockup
    opacity: 0.9,
  },
  structureSection: {
    marginBottom: 20, // Exact value from mockup
  },
  compactStructure: {
    borderRadius: 12, // Exact value from mockup
    overflow: 'hidden',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.3,
    // shadowRadius: 3,
    elevation: 3,
  },
  structureRow: {
    flexDirection: 'row',
    padding: 8, // Left/right padding from mockup
    paddingHorizontal: 10, // Left/right padding from mockup
    alignItems: 'center',
    backgroundColor: COLORS.mediumGray,
    marginBottom: 1,
  },
  recoveryRow: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.recovery,
  },
  baseRow: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.base,
  },
  runRow: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.run,
  },
  sprintRow: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.sprint,
  },
  timeCell: {
    width: '20%', // Exact value from mockup
  },
  timeCellText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14, // Exact value from mockup
  },
  paceCell: {
    width: '50%', // Exact value from mockup
    flexDirection: 'row',
    alignItems: 'center',
  },
  paceCellText: {
    color: COLORS.white,
    fontSize: 14, // Exact value from mockup
  },
  paceIndicator: {
    width: 8, // Exact value from mockup
    height: 8, // Exact value from mockup
    borderRadius: 4,
    marginRight: 8, // Exact value from mockup
  },
  inclineCell: {
    width: '30%', // Exact value from mockup
    alignItems: 'flex-end',
  },
  inclineCellText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14, // Exact value from mockup
  },
  startButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25, // Exact value from mockup
    padding: 16, // Exact value from mockup
    alignItems: 'center',
    marginTop: 20, // Exact value from mockup
    marginBottom: 30, // Add space at bottom
  },
  startButtonText: {
    color: COLORS.black,
    fontSize: 16, // Exact value from mockup
    fontWeight: 'bold',
  },
  signInButton: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 25, // Exact value from mockup
    padding: 16, // Exact value from mockup
    alignItems: 'center',
    marginTop: 20, // Exact value from mockup
    marginBottom: 30, // Add space at bottom
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  signInButtonText: {
    color: COLORS.accent,
    fontSize: 16, // Exact value from mockup
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default WorkoutDetailsScreen;