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
import { formatDuration } from '../utils/timeUtils';
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

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { authState, userSettings } = useContext(UserContext);
  const dispatch = useAppDispatch();
  const workoutPrograms = useAppSelector(selectWorkoutPrograms);
  const workoutHistory = useAppSelector(selectWorkoutHistory);
  const stats = useAppSelector(selectStats);
  
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
                {formatDuration(stats.stats.totalDuration, 'hours')}
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
                {(stats.stats.totalSegmentsCompleted / 5).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>
                {userSettings?.preferences?.units === 'metric' ? 'Kms' : 'Miles'}
              </Text>
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
