import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Share,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WorkoutSession } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../styles/theme';
import { useUserSettings } from '../hooks';
import { formatDuration, formatDate, calculateTotalDistance, kmToMiles } from '../utils/helpers';
import Button from '../components/common/Button';
import WorkoutCalendar from '../components/common/WorkoutCalendar';
import { getWorkoutSessionById } from '../utils/historyUtils';
import { useSubscription } from '../context/SubscriptionContext';
import { calculateTotalCaloriesBurned } from '../utils/calorieUtils';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../redux/store';
import { selectWorkoutById } from '../redux/slices/workoutProgramsSlice';

// Debug flags
const DEBUG_WORKOUT_COMPLETE = false;
const DEBUG_HOOKS = false;

// Debug logging helper
const logDebug = (message: string, ...args: any[]) => {
  if (DEBUG_WORKOUT_COMPLETE) {
    if (args.length > 0) {
      console.log(`[DEBUG-WORKOUT-COMPLETE] ${message}`, ...args);
    } else {
      console.log(`[DEBUG-WORKOUT-COMPLETE] ${message}`);
    }
  }
};

// Debug hook execution
const logHook = (hookName: string, ...args: any[]) => {
  if (DEBUG_HOOKS) {
    if (args.length > 0) {
      console.log(`[DEBUG-HOOKS] Executing ${hookName}`, ...args);
    } else {
      console.log(`[DEBUG-HOOKS] Executing ${hookName}`);
    }
  }
};

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutComplete'>;

const WorkoutCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  logDebug('Component rendering START');
  
  // Extract route params first
  const { sessionId } = route.params;
  logDebug('Route params extracted', { sessionId });
  
  // Define all state hooks at the top level
  logHook('useState - isLoading');
  const [isLoading, setIsLoading] = useState(true);
  
  logHook('useState - session');
  const [session, setSession] = useState<WorkoutSession | null>(null);
  
  logHook('useState - error');
  const [error, setError] = useState<string | null>(null);
  
  logHook('useState - caloriesBurned');
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null);
  
  // Use hooks for external data
  logHook('useUserSettings');
  const userSettingsResult = useUserSettings();
  const { authState, userSettings, isLoading: isSettingsLoading } = userSettingsResult;
  logDebug('useUserSettings result', { 
    hasUserSettings: !!userSettings, 
    isSettingsLoading,
    authStateAuthenticated: authState?.isAuthenticated
  });
  
  logHook('useSubscription');
  const { subscriptionInfo } = useSubscription();
  logDebug('useSubscription result', { 
    isActive: subscriptionInfo?.isActive,
    trialActive: subscriptionInfo?.trialActive
  });
  
  // Derived values
  const isPremium = subscriptionInfo?.isActive || subscriptionInfo?.trialActive || false;
  const preferences = userSettings?.preferences || { units: 'imperial', enableAudioCues: true };
  const unitPreference = preferences.units || 'imperial';
  
  // Get workout data from Redux - define the function outside of any conditional blocks
  logHook('useAppSelector for getWorkoutById');
  const workoutSelector = useAppSelector((state) => state);
  const getWorkoutById = (id: string) => selectWorkoutById(id)(workoutSelector);
  
  // Log component state
  logDebug('Component state initialized', { 
    hasUserSettings: !!userSettings,
    preferences,
    unitPreference,
    isSettingsLoading,
    isLoading,
    sessionId,
    hasSession: !!session
  });
  
  // Fetch session data when component mounts
  logHook('useEffect - fetch session');
  useEffect(() => {
    logDebug('Fetch session useEffect running', { sessionId });
    
    const fetchSession = async () => {
      logDebug('fetchSession function called');
      try {
        logDebug('Getting workout session by ID', { sessionId });
        const sessionData = await getWorkoutSessionById(sessionId);
        logDebug('Session data retrieved', { 
          hasData: !!sessionData,
          id: sessionData?.id,
          workoutId: sessionData?.workoutId
        });
        
        if (sessionData) {
          logDebug('Setting session data');
          setSession(sessionData);
          
          // If the session has calories burned, use that value directly
          if (sessionData.caloriesBurned !== undefined) {
            logDebug('Setting calories from session', { calories: sessionData.caloriesBurned });
            setCaloriesBurned(sessionData.caloriesBurned);
          }
        } else {
          logDebug('Session not found, setting error');
          setError('Session not found');
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        logDebug('Error in fetchSession', { error: err });
        setError('Failed to load workout data');
      } finally {
        logDebug('Setting isLoading to false');
        setIsLoading(false);
      }
    };
    
    logDebug('Calling fetchSession');
    fetchSession();
    
    return () => {
      logDebug('Fetch session useEffect cleanup');
    };
  }, [sessionId]);
  
  // Only calculate calories if not already provided in the session
  logHook('useEffect - calculate calories');
  useEffect(() => {
    logDebug('Calculate calories useEffect running', {
      isPremium,
      hasSession: !!session,
      hasWeight: !!userSettings?.weight,
      caloriesBurned
    });
    
    if (!userSettings || !session) {
      logDebug('Missing userSettings or session, skipping calorie calculation');
      return;
    }
    
    if (isPremium && userSettings.weight && caloriesBurned === undefined) {
      logDebug('Calculating calories burned');
      
      // Safely access pace settings
      const paceSettings = userSettings.paceSettings ? 
        Object.entries(userSettings.paceSettings).reduce((acc, [key, value]) => {
          acc[key] = { speed: value.speed, incline: value.incline };
          return acc;
        }, {} as { [key: string]: { speed: number; incline: number } }) : 
        {};
      
      logDebug('Using pace settings for calorie calculation', { paceSettings });
      
      try {
        const totalCalories = calculateTotalCaloriesBurned(
          session.segments,
          userSettings.weight,
          paceSettings
        );
        logDebug('Setting calculated calories', { totalCalories });
        setCaloriesBurned(totalCalories);
      } catch (error) {
        console.error('Error calculating calories:', error);
        logDebug('Error calculating calories', { error });
      }
    } else if (session.caloriesBurned !== undefined) {
      logDebug('Using calories from session', { calories: session.caloriesBurned });
    }
    
    return () => {
      logDebug('Calculate calories useEffect cleanup');
    };
  }, [isPremium, session, userSettings, caloriesBurned]);
  
  logDebug('Component rendering decision point', { isLoading, hasError: !!error });
  
  // Handle loading state
  if (isLoading) {
    logDebug('Rendering loading state');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading workout data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Handle error state
  if (error) {
    logDebug('Rendering error state', { error });
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Go Back" 
            onPress={() => navigation.goBack()} 
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  // Handle null session (should be caught by error state, but just in case)
  if (!session) {
    logDebug('Rendering null session state');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout session not found</Text>
          <Button 
            title="Go Back" 
            onPress={() => navigation.goBack()} 
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  logDebug('Rendering full workout complete screen', { 
    workoutId: session.workoutId,
    date: session.date
  });
  
  const { 
    workoutId, 
    workoutName, 
    date, 
    duration, 
    segments,
    paceSettings,
    distance: sessionDistance
  } = session;
  
  // Get original workout to compare
  const originalWorkout = getWorkoutById(workoutId);
  
  // Calculate stats
  const skippedSegments = segments.filter(segment => segment.skipped).length;
    
  // Calculate distance based on session data and pace settings
  let distanceKm = sessionDistance || 0;
  
  // If distance is not already calculated, calculate it now
  if (!distanceKm && segments && paceSettings) {
    // Cast paceSettings to the expected type for calculateTotalDistance
    const paceSettingsMap = paceSettings as unknown as { [key: string]: { speed: number } };
    distanceKm = calculateTotalDistance(segments, paceSettingsMap);
  } else if (!distanceKm && segments && userSettings?.paceSettings) {
    // Try using current user pace settings if session doesn't have them
    const paceSettingsMap = userSettings.paceSettings as unknown as { [key: string]: { speed: number } };
    distanceKm = calculateTotalDistance(segments, paceSettingsMap);
  }
  
  // Format distance based on user preference
  const distance = unitPreference === 'imperial' 
    ? kmToMiles(distanceKm).toFixed(1) 
    : distanceKm.toFixed(1); // No conversion needed for kilometers
  
  // Handle share result
  
  // Handle done button press
  const handleDone = () => {
    navigation.navigate('WorkoutLibrary');
  };
  
  // Navigation to Profile
  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.celebration}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.congratsText}>Great job!</Text>
          <Text style={styles.congratsSubtitle}>You've completed your workout</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.workoutName}>{workoutName}</Text>
            <Text style={styles.date}>{formatDate(date)}</Text>
          </View>
          
          <View style={styles.statsCircles}>
            <View style={styles.statCircle}>
              <View style={styles.circle}>
                <Text style={styles.circleValue}>{(duration / 60).toFixed(1)}</Text>
              </View>
              <Text style={styles.circleLabel}>Minutes</Text>
            </View>
            
            <View style={styles.statCircle}>
              <View style={styles.circle}>
                <Text style={styles.circleValue}>{distance}</Text>
              </View>
              <Text style={styles.circleLabel}>{unitPreference === 'imperial' ? 'Miles' : 'Kms'}</Text>
            </View>
            
            <View style={styles.statCircle}>
              <View style={styles.circle}>
                <Text style={styles.circleValue}>{segments.length}</Text>
              </View>
              <Text style={styles.circleLabel}>Intervals</Text>
            </View>
            
            <View style={styles.statCircle}>
              <View style={styles.circle}>
                <Text style={styles.circleValue}>{isPremium && caloriesBurned ? Math.round(caloriesBurned) : '-'}</Text>
              </View>
              <Text style={styles.circleLabel}>Calories</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.workoutsSection}>
          <Text style={styles.sectionTitle}>Your Workouts</Text>
          
          {/* Use the shared WorkoutCalendar component */}
          <WorkoutCalendar workoutHistory={[session]} />
        </View>
        
        {!authState.isAuthenticated && (
          <View style={styles.accountPromptContainer}>
            <Text style={styles.accountPromptTitle}>Save Your Progress</Text>
            <Text style={styles.accountPromptText}>
              Create an account to save your workout history and track your progress over time.
            </Text>
            <TouchableOpacity 
              style={styles.accountPromptButton}
              onPress={() => navigation.navigate('Landing')}
            >
              <Text style={styles.accountPromptButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isPremium && !userSettings?.weight && (
          <View style={styles.weightPromptContainer}>
            <View style={styles.weightPromptIcon}>
              <Ionicons name="information-circle" size={24} color={COLORS.accent} />
            </View>
            <View style={styles.weightPromptTextContainer}>
              <Text style={styles.weightPromptTitle}>Add Your Weight</Text>
              <Text style={styles.weightPromptText}>
                Set your weight in Settings to track calories burned during workouts.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.weightPromptButton}
              onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.weightPromptButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.workoutsButton}
            onPress={handleDone}
          >
            <Text style={styles.workoutsButtonText}>Workouts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={navigateToProfile}
          >
            <Text style={styles.statsButtonText}>My Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scrollContent: {
    padding: SPACING.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    marginTop: SPACING.medium,
  },
  // Celebration section styles
  celebration: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.large,
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: SPACING.small,
  },
  congratsText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  congratsSubtitle: {
    fontSize: FONT_SIZES.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  // Summary card styles
  summaryCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 15,
    padding: SPACING.medium,
    marginBottom: SPACING.large,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  workoutName: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  date: {
    fontSize: FONT_SIZES.small,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Circular stats layout
  statsCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: -5, // Negative margin to offset padding of children
  },
  statCircle: {
    flex: 1,
    alignItems: 'center',
    padding: 5,
  },
  circle: {
    width: 55,
    height: 55,
    borderRadius: 55/2,
    backgroundColor: COLORS.mediumGray,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.small,
  },
  circleValue: {
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  circleLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Workouts section
  workoutsSection: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.medium,
  },
  // Account prompt
  accountPromptContainer: {
    backgroundColor: COLORS.sprintMuted,
    borderRadius: 15,
    padding: SPACING.medium,
    marginBottom: SPACING.large,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  accountPromptTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: SPACING.small,
  },
  accountPromptText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.white,
    marginBottom: SPACING.medium,
    lineHeight: 18,
  },
  accountPromptButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: SPACING.small,
    alignItems: 'center',
  },
  accountPromptButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.small,
  },
  // Weight prompt
  weightPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.large,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  weightPromptIcon: {
    marginRight: SPACING.small,
  },
  weightPromptTextContainer: {
    flex: 1,
  },
  weightPromptTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  weightPromptText: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.small,
  },
  weightPromptButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.small,
    borderRadius: BORDER_RADIUS.small,
    marginLeft: SPACING.small,
  },
  weightPromptButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
  },
  // Action buttons
  actionButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    marginTop: 'auto',
    marginBottom: SPACING.xl,
  },
  workoutsButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  workoutsButtonText: {
    fontWeight: 'bold',
    fontSize: FONT_SIZES.medium,
    color: COLORS.black,
  },
  statsButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsButtonText: {
    fontWeight: 'bold',
    fontSize: FONT_SIZES.medium,
    color: COLORS.white,
  },
  errorText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorButton: {
    marginTop: SPACING.xl,
  },
});

export default WorkoutCompleteScreen;