import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Share,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WorkoutSession } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../styles/theme';
import { DataContext, UserContext } from '../context';
import { formatTime, formatDuration, formatDate } from '../utils/helpers';
import Button from '../components/common/Button';
import WorkoutTimeline from '../components/workout/WorkoutTimeline';
import { getWorkoutSessionById } from '../utils/historyUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutComplete'>;

const WorkoutCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const { getWorkoutById } = useContext(DataContext);
  // Move UserContext access to the top of the component
  const { authState } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    segments 
  } = session;
  
  // Get original workout to compare
  const originalWorkout = getWorkoutById(workoutId);
  
  // Calculate stats
  const skippedSegments = segments.filter(segment => segment.skipped).length;
  const completionRate = originalWorkout 
    ? Math.round((segments.length - skippedSegments) / originalWorkout.segments.length * 100) 
    : 100;
  
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
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.congratsText}>Workout Complete!</Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          <Text style={styles.date}>{formatDate(date)}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{segments.length}</Text>
              <Text style={styles.statLabel}>Segments</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completionRate}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Workout Timeline</Text>
          <WorkoutTimeline segments={segments} compact={false} />
        </View>
        
        {!authState.isAuthenticated && (
          <View style={styles.accountPromptContainer}>
            <Text style={styles.accountPromptTitle}>Save Your Progress</Text>
            <Text style={styles.accountPromptText}>
              Create an account to save your workout history and track your progress over time.
            </Text>
            <TouchableOpacity 
              style={styles.accountPromptButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.accountPromptButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            title="Share Results"
            onPress={handleShare}
            type="secondary"
            style={styles.button}
            icon="share"
          />
          
          <Button
            title="Done"
            onPress={handleDone}
            type="primary"
            style={styles.button}
          />
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
  congratsText: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginVertical: SPACING.large,
  },
  summaryCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: SPACING.medium,
    marginBottom: SPACING.large,
  },
  workoutName: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.small,
  },
  date: {
    fontSize: FONT_SIZES.small,
    color: COLORS.lightGray,
    marginBottom: SPACING.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.small,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: FONT_SIZES.xsmall,
    color: COLORS.lightGray,
    marginTop: SPACING.xsmall,
  },
  timelineContainer: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.medium,
  },
  accountPromptContainer: {
    backgroundColor: COLORS.accentMuted,
    borderRadius: 12,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.large,
    marginBottom: SPACING.xlarge,
  },
  button: {
    flex: 1,
    marginHorizontal: SPACING.xsmall,
  },
  errorText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xlarge,
  },
});

export default WorkoutCompleteScreen;