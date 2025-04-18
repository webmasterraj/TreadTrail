import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Share,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WorkoutSession } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../styles/theme';
import { DataContext, UserContext } from '../context';
import { formatTime, formatDuration, formatDate, mphToKph, calculateTotalDistance, milesToKm } from '../utils/helpers';
import Button from '../components/common/Button';
import WorkoutTimeline from '../components/workout/WorkoutTimeline';
import WorkoutCalendar from '../components/common/WorkoutCalendar';
import { getWorkoutSessionById } from '../utils/historyUtils';
import { useSubscription } from '../context/SubscriptionContext';
import { calculateTotalCaloriesBurned } from '../utils/calorieUtils';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutComplete'>;

const WorkoutCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const { getWorkoutById } = useContext(DataContext);
  const { authState, userSettings, preferences } = useContext(UserContext);
  const { subscriptionInfo } = useSubscription();
  const isPremium = subscriptionInfo.isActive || subscriptionInfo.trialActive;
  
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null);
  
  // Get user's unit preference
  const unitPreference = userSettings?.preferences?.units || 'imperial';
  
  // Fetch session data when component mounts
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const sessionData = await getWorkoutSessionById(sessionId);
        if (sessionData) {
          setSession(sessionData);
        } else {
          setError('Session not found');
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to load workout data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSession();
  }, [sessionId]);
  
  useEffect(() => {
    if (isPremium && session && userSettings?.profile?.weight) {
      // Calculate calories burned based on workout segments
      const paceSettings = Object.entries(userSettings.paceSettings).reduce((acc, [key, value]) => {
        acc[key] = { speed: value.speed, incline: value.incline };
        return acc;
      }, {} as { [key: string]: { speed: number; incline: number } });
      const totalCalories = calculateTotalCaloriesBurned(
        session.segments,
        userSettings.profile.weight,
        paceSettings
      );
      setCaloriesBurned(totalCalories);
    }
  }, [isPremium, session, userSettings]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading workout data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Handle case where session is not found
  if (!session || error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error || 'Workout session not found'}</Text>
        <Button 
          title="Back to Workouts" 
          onPress={() => navigation.navigate('WorkoutLibrary')}
          type="secondary"
          style={{ marginTop: SPACING.large }}
        />
      </SafeAreaView>
    );
  }
  
  const { 
    workoutId, 
    workoutName, 
    date, 
    duration, 
    completed, 
    segments,
    paceSettings,
    distance: sessionDistance
  } = session;
  
  // Get original workout to compare
  const originalWorkout = getWorkoutById(workoutId);
  
  // Calculate stats
  const skippedSegments = segments.filter(segment => segment.skipped).length;
  const completionRate = originalWorkout 
    ? Math.round((segments.length - skippedSegments) / originalWorkout.segments.length * 100) 
    : 100;
    
  // Calculate distance based on session data and pace settings
  let distanceMiles = sessionDistance || 0;
  
  // If distance is not already calculated, calculate it now
  if (!distanceMiles && segments && paceSettings) {
    // Cast paceSettings to the expected type for calculateTotalDistance
    const paceSettingsMap = paceSettings as unknown as { [key: string]: { speed: number } };
    distanceMiles = calculateTotalDistance(segments, paceSettingsMap);
  } else if (!distanceMiles && segments && userSettings?.paceSettings) {
    // Try using current user pace settings if session doesn't have them
    const paceSettingsMap = userSettings.paceSettings as unknown as { [key: string]: { speed: number } };
    distanceMiles = calculateTotalDistance(segments, paceSettingsMap);
  }
  
  // Format distance based on user preference
  const distance = unitPreference === 'imperial' 
    ? distanceMiles.toFixed(1) 
    : milesToKm(distanceMiles).toFixed(1); // Convert miles to kilometers
  
  // Handle share result
  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just completed the "${workoutName}" workout on TreadTrail! ${formatDuration(duration)} of treadmill training done! 💪`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
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
        
        {isPremium && !userSettings?.profile?.weight && (
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
});

export default WorkoutCompleteScreen;