import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, PACE_COLORS } from '../styles/theme';
import { UserContext } from '../context';
import { formatDuration, milesToKm, kmToMiles } from '../utils/helpers';
import BottomTabBar from '../components/common/BottomTabBar';
import WorkoutCard from '../components/workout/WorkoutCard';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  fetchWorkoutPrograms, 
  fetchWorkoutHistory, 
  fetchStats,
  selectWorkoutPrograms,
  selectWorkoutHistory,
  selectStats,
  toggleWorkoutFavorite
} from '../redux/slices/workoutProgramsSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authState, userSettings } = useContext(UserContext);
  const dispatch = useAppDispatch();
  const workoutPrograms = useAppSelector(selectWorkoutPrograms);
  const workoutHistory = useAppSelector(selectWorkoutHistory);
  const stats = useAppSelector(selectStats);
  
  // Check if we need to force reload stats (coming from WorkoutComplete screen)
  const forceReload = route.params?.forceReload || false;
  
  // State for tracking the current month in the calendar
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  // Animation value for gradient border effect
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  // Initialize data when component mounts
  useEffect(() => {
    dispatch(fetchWorkoutPrograms());
    dispatch(fetchWorkoutHistory());
    dispatch(fetchStats());
    
    // Start animation for gradient effect
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false
      })
    ).start();
  }, [dispatch, animatedValue]);
  
  // Force reload stats when coming from workout completion
  useEffect(() => {
    if (forceReload) {
      // Use async function to ensure we can await these calls
      const reloadData = async () => {
        try {
          await dispatch(fetchWorkoutHistory()).unwrap();
          await dispatch(fetchStats()).unwrap();
        } catch (error) {
          console.error('Error reloading stats:', error);
        }
      };
      
      reloadData();
    }
  }, [forceReload, dispatch]);

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigation.replace('Signup');
    }
  }, [authState.isAuthenticated, navigation]);

  // Get favorite workouts
  const favoriteWorkouts = workoutPrograms.filter(workout => Boolean(workout.favorite));

  // Format duration for display (e.g., "30 min")
  const formatWorkoutDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  // Get the difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return COLORS.recovery;
      case 'intermediate':
        return COLORS.run;
      case 'advanced':
        return COLORS.sprint;
      default:
        return COLORS.white;
    }
  };

  // Navigate to workout details
  const handleWorkoutPress = (workoutId: string) => {
    navigation.navigate('WorkoutDetails', { workoutId });
  };
  
  // Toggle workout favorite status
  const handleFavoriteToggle = (workoutId: string) => {
    try {
      if (!workoutId) {
        return;
      }
      
      // Dispatch the toggle action
      dispatch(toggleWorkoutFavorite(workoutId));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Navigate to settings
  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  // Handle navigation to workouts screen
  const handleWorkoutsPress = () => {
    navigation.navigate('WorkoutLibrary');
  };
  
  // Go to the previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Go to the next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (!authState.isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={handleSettingsPress}
          style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>

        {/* Lifetime Stats */}
        <View style={styles.lifetimeStats}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Animated.View 
                style={[
                  styles.gradientBorder,
                  {
                    borderColor: animatedValue.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange: [
                        COLORS.run, 
                        COLORS.accent, 
                        COLORS.base, 
                        COLORS.run, 
                        COLORS.run
                      ]
                    })
                  }
                ]} 
              />
              <Text style={styles.statValue}>{stats.stats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>

            <View style={styles.statCard}>
              <Animated.View 
                style={[
                  styles.gradientBorder,
                  {
                    borderColor: animatedValue.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange: [
                        COLORS.accent, 
                        COLORS.base, 
                        COLORS.run, 
                        COLORS.accent, 
                        COLORS.accent
                      ]
                    })
                  }
                ]} 
              />
              <Text style={styles.statValue}>
                {formatDuration(stats.stats.totalDuration, 'auto')}
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>

            <View style={styles.statCard}>
              <Animated.View 
                style={[
                  styles.gradientBorder,
                  {
                    borderColor: animatedValue.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange: [
                        COLORS.base, 
                        COLORS.run, 
                        COLORS.accent, 
                        COLORS.base, 
                        COLORS.base
                      ]
                    })
                  }
                ]} 
              />
              <Text style={styles.statValue}>
                {userSettings?.preferences?.units === 'metric' 
                  ? milesToKm(stats.stats.totalSegmentsCompleted / 5).toFixed(1)
                  : (stats.stats.totalSegmentsCompleted / 5).toFixed(1)
                }
              </Text>
              <Text style={styles.statLabel}>
                {userSettings?.preferences?.units === 'metric' ? 'Kms' : 'Miles'}
              </Text>
            </View>
          </View>
        </View>

        {/* Calendar View */}
        <View style={styles.calendarSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Workouts</Text>
          </View>
          
          <View style={styles.calendar}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={goToPreviousMonth}>
                <Text style={styles.navButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.monthName}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={goToNextMonth}>
                <Text style={styles.navButton}>→</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekdays}>
              <Text style={styles.weekday}>S</Text>
              <Text style={styles.weekday}>M</Text>
              <Text style={styles.weekday}>T</Text>
              <Text style={styles.weekday}>W</Text>
              <Text style={styles.weekday}>T</Text>
              <Text style={styles.weekday}>F</Text>
              <Text style={styles.weekday}>S</Text>
            </View>
            
            <View style={styles.days}>
              {(() => {
                const today = new Date();
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                
                // Get days in month and first day of month
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDayOfMonth = new Date(year, month, 1).getDay();
                
                const days = [];
                
                // Add empty cells for days before the 1st of the month
                for (let i = 0; i < firstDayOfMonth; i++) {
                  days.push(
                    <View key={`empty-${i}`} style={styles.day} />
                  );
                }
                
                // Add cells for each day of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const isToday = 
                    day === today.getDate() && 
                    month === today.getMonth() && 
                    year === today.getFullYear();
                  
                  // Create date in local timezone (not UTC)
                  // Create the date without using toISOString() which converts to UTC
                  const currentDate = new Date(year, month, day);
                  
                  // Format date as YYYY-MM-DD in local timezone
                  const dateString = 
                    currentDate.getFullYear() + '-' + 
                    String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(currentDate.getDate()).padStart(2, '0');
                  
                  // Check if there's a workout on this specific date in the history
                  const hasWorkout = workoutHistory.some(session => {
                    try {
                      // Skip sessions without a date
                      if (!session || !session.date) {
                        return false;
                      }
                      
                      // Get the session date - it may need normalization
                      let sessionDate = session.date;
                      
                      // If the session date includes time part, extract just the date
                      if (sessionDate && typeof sessionDate === 'string' && sessionDate.includes('T')) {
                        sessionDate = sessionDate.split('T')[0];
                      }
                      
                      // Check if the dates match 
                      return sessionDate === dateString;
                    } catch (err) {
                      console.error('Error processing workout date:', err);
                      return false;
                    }
                  });
                  
                  days.push(
                    <View 
                      key={`day-${day}`} 
                      style={[
                        styles.day,
                        isToday && styles.currentDay
                      ]}
                    >
                      <Text style={[styles.dayNumber, isToday && styles.currentDayText]}>
                        {day}
                      </Text>
                      {hasWorkout && <View style={styles.workoutDot} />}
                    </View>
                  );
                }
                
                return days;
              })()}
            </View>
          </View>
        </View>

        {/* Favorite Workouts */}
        <View style={styles.favoritesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Workouts</Text>
          </View>

          <View style={styles.favoritesList}>
            {favoriteWorkouts.length > 0 ? (
              favoriteWorkouts.map(workout => (
                <WorkoutCard
                  key={`workout-${workout.id}-${workout.favorite ? 'fav' : 'notfav'}`}
                  workout={workout}
                  onPress={() => handleWorkoutPress(workout.id)}
                  onFavoriteToggle={() => handleFavoriteToggle(workout.id)}
                  showVisualization={true}
                  showFavoriteButton={authState.isAuthenticated}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  You haven't favorited any workouts yet.
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate('WorkoutLibrary')}>
                  <Text style={styles.browseButtonText}>Browse Workouts</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>


        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Use the shared BottomTabBar component */}
      <BottomTabBar activeTab="Profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.medium,
    paddingBottom: SPACING.small,
  },
  headerTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  settingsButton: {
    padding: SPACING.small,
    width: 40,
  },
  settingsIcon: {
    fontSize: FONT_SIZES.large,
  },
  userInfo: {
    paddingHorizontal: SPACING.large,
    marginBottom: SPACING.large,
  },
  userName: {
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xsmall,
  },
  userEmail: {
    fontSize: FONT_SIZES.small,
    color: COLORS.lightGray,
  },
  lifetimeStats: {
    marginBottom: SPACING.xxlarge,
    paddingHorizontal: SPACING.large,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.medium,
    marginBottom: SPACING.large,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
    borderRadius: 18,
    paddingTop: SPACING.large,
    paddingBottom: SPACING.large,
    paddingHorizontal: SPACING.small,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 5,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 18,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.xsmall,
    // Gradient text effect in React Native is not easily applied with standard styles,
    // but we can get close with the accent color
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  calendarSection: {
    marginBottom: SPACING.small,
    paddingHorizontal: SPACING.large,
  },
  calendar: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 15,
    padding: SPACING.medium,
    paddingBottom: SPACING.small, // Reduce bottom padding
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  monthName: {
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  navButton: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.large,
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    width: '14.28%',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 2, // Add a small bottom margin instead of extra space
  },
  day: {
    width: '14.28%',
    height: 32, // Fixed height instead of aspectRatio
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  dayNumber: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 1, // Reduce bottom margin
  },
  currentDayText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  workoutDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 1,
  },
  favoritesSection: {
    marginTop: SPACING.large,
    marginBottom: SPACING.large,
    paddingHorizontal: SPACING.large,
  },
  recentSection: {
    marginBottom: SPACING.large,
    paddingHorizontal: SPACING.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
    color: COLORS.white,
  },
  favoritesList: {
    paddingBottom: SPACING.medium,
  },
  metaItem: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.xsmall,
  },
  recentList: {
    gap: SPACING.medium,
  },
  recentItem: {
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.darkGray,
    marginBottom: SPACING.medium,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xsmall,
  },
  recentName: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    color: COLORS.white,
  },
  recentDate: {
    fontSize: FONT_SIZES.xsmall,
    color: COLORS.lightGray,
  },
  recentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyTag: {
    paddingHorizontal: SPACING.small,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.small,
    fontSize: FONT_SIZES.xsmall,
    color: COLORS.black,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.large,
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.medium,
  },
  emptyStateText: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
    marginBottom: SPACING.medium,
  },
  browseButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.small,
  },
  browseButtonText: {
    color: COLORS.black,
    fontWeight: '600',
    fontSize: FONT_SIZES.small,
  },
  bottomPadding: {
    height: 60,
  },
});

export default ProfileScreen;