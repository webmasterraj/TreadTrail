import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  LayoutChangeEvent
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaceType } from '../types';
import { COLORS, FONT_SIZES, SPACING, DIFFICULTY_INDICATORS, FOCUS_INDICATORS, PACE_COLORS } from '../styles/theme';
import { useAuth, useUserSettings } from '../hooks';
import { useSubscription } from '../context/SubscriptionContext';
import { formatDuration, formatTime } from '../utils/helpers';
import WorkoutVisualization from '../components/workout/WorkoutVisualization';
import Button from '../components/common/Button';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  selectWorkoutById, 
  toggleFavoriteWorkout,
} from '../redux/slices/workoutProgramsSlice';
import PremiumCard from '../components/subscription/PremiumCard';
import BottomTabBar from '../components/common/BottomTabBar';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDetails'>;

const WorkoutDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const dispatch = useAppDispatch();
  // Get user context using hooks
  const { userSettings } = useUserSettings();
  const { authState } = useAuth();
  const { isPremiumWorkout, subscriptionInfo } = useSubscription();
  
  // Log workout ID only once when component mounts or workoutId changes
  useEffect(() => {
    console.log(`[WorkoutDetailsScreen] Starting workout with ID: ${workoutId}`);
  }, [workoutId]);
  
  // Get the workout from the Redux store - Fix the selector usage
  const workout = useAppSelector(selectWorkoutById(workoutId));
  
  // Add detailed logging of the workout data
  useEffect(() => {
    if (workout) {
      console.log(`[WorkoutDetailsScreen] Loaded workout: ${workout.name} with ${workout.segments.length} segments`);
    } else {
      console.log(`[WorkoutDetailsScreen] No workout found with ID: ${workoutId}`);
    }
  }, [workout, workoutId]);
  
  // Calculate days remaining in trial
  const getDaysRemaining = () => {
    if (!subscriptionInfo.trialActive || !subscriptionInfo.trialEndDate) {
      return 0;
    }
    
    const now = new Date();
    const trialEnd = new Date(subscriptionInfo.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays); // Ensure we don't return negative days
  };
  
  // Initialize workout data if not loaded
  useEffect(() => {
    // No need to fetch workout programs here, using cached data from Redux store
  }, [dispatch]);
  
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
    
    // Check if this is a premium workout and user doesn't have premium access
    if (workout.premium && !isPremiumWorkout(workout.premium)) {
      // Navigate to subscription screen
      navigation.navigate('Subscription');
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
      console.log('[WorkoutDetailsScreen] User initiated workout start with ID:', workoutId);
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
    if (workoutId) {
      dispatch(toggleFavoriteWorkout(workoutId));
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
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={handleFavoriteToggle}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={[styles.favoriteIcon, workout.favorite && styles.favoriteIconActive]}>
                {workout.favorite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
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
          
          {/* Premium Subscription Card for Trial Users */}
          {workout.premium && subscriptionInfo.trialActive && authState && authState.isAuthenticated && (
            <PremiumCard
              description={`You have access to this workout during your free trial. Subscribe to keep access when your trial ends in ${getDaysRemaining()} days.`}
              showButton={false}
              onCardPress={() => navigation.navigate('Subscription')}
            />
          )}
          
          { authState && authState.isAuthenticated && (
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
          )}
          
          {/* Only show the Start Workout button for logged-in users */}
          {authState && authState.isAuthenticated && (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartWorkout}
            >
              <Text style={styles.startButtonText}>Load Workout</Text>
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
    paddingHorizontal: SPACING.medium,
    paddingBottom: 100, // Extra padding at bottom for bottom tab bar
  },
  header: {
    marginTop: SPACING.large,
    marginBottom: SPACING.medium,
  },
  title: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  description: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.medium,
    lineHeight: 24,
    marginBottom: SPACING.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.large,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.small,
  },
  previewSection: {
    marginBottom: SPACING.large,
  },
  previewContainer: {
    width: '100%',
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 16,
  },
  structureSection: {
    marginBottom: SPACING.large,
  },
  compactStructure: {
    borderRadius: 12, 
    overflow: 'hidden',
    elevation: 3,
  },
  structureRow: {
    flexDirection: 'row',
    padding: 8, 
    paddingHorizontal: 10, 
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
    width: '20%', 
  },
  timeCellText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14, 
  },
  paceCell: {
    width: '50%', 
    flexDirection: 'row',
    alignItems: 'center',
  },
  paceCellText: {
    color: COLORS.white,
    fontSize: 14, 
  },
  paceIndicator: {
    width: 8, 
    height: 8, 
    borderRadius: 4,
    marginRight: 8, 
  },
  inclineCell: {
    width: '30%', 
    alignItems: 'flex-end',
  },
  inclineCellText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14, 
  },
  startButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 25, 
    alignItems: 'center',
    marginTop: 20, 
    marginBottom: 30, 
  },
  startButtonText: {
    color: COLORS.black,
    fontSize: 16, 
    fontWeight: 'bold',
  },
  signInButton: {
    backgroundColor: COLORS.darkGray,
    paddingVertical: 16,
    borderRadius: 25, 
    alignItems: 'center',
    marginTop: 20, 
    marginBottom: 30, 
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  signInButtonText: {
    color: COLORS.accent,
    fontSize: 16, 
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    textAlign: 'center',
    marginTop: SPACING.large,
  },
  favoriteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingRight: 24,
  },
  favoriteIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  favoriteIconActive: {
    color: COLORS.accent,
  },
});

export default WorkoutDetailsScreen;