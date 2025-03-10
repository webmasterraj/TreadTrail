import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../styles/theme';
import { UserContext, DataContext } from '../context';
import { formatDuration } from '../utils/timeUtils';
import BottomTabBar from '../components/common/BottomTabBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useContext(UserContext);
  const { workoutPrograms, stats, workoutHistory } = useContext(DataContext);

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigation.replace('Signup');
    }
  }, [authState.isAuthenticated, navigation]);

  // Get favorite workouts
  const favoriteWorkouts = workoutPrograms.filter(workout => workout.favorite);

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
        <Text style={styles.headerTitle}>Your Profile</Text>
        <TouchableOpacity
          onPress={handleSettingsPress}
          style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {authState.user?.name || 'Runner'}
          </Text>
          <Text style={styles.userEmail}>{authState.user?.email || ''}</Text>
        </View>

        {/* Lifetime Stats */}
        <View style={styles.lifetimeStats}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.stats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatDuration(stats.stats.totalDuration, 'hours')}
              </Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.stats.totalSegmentsCompleted}
              </Text>
              <Text style={styles.statLabel}>Segments</Text>
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
                <TouchableOpacity
                  key={workout.id}
                  style={styles.favoriteItem}
                  onPress={() => handleWorkoutPress(workout.id)}>
                  <Text style={styles.favoriteType}>
                    {workout.focus.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.favoriteName}>{workout.name}</Text>
                  <View style={styles.favoriteMeta}>
                    <Text style={styles.metaItem}>
                      {formatWorkoutDuration(workout.duration)}
                    </Text>
                    <Text style={styles.metaItem}>
                      {workout.difficulty.charAt(0).toUpperCase() +
                        workout.difficulty.slice(1)}
                    </Text>
                  </View>

                  {/* Visualization of workout segments */}
                  <View style={styles.visualizationContainer}>
                    {workout.segments.map((segment, index) => (
                      <View
                        key={index}
                        style={[
                          styles.segmentBar,
                          {
                            backgroundColor: COLORS[segment.type],
                            flex: segment.duration / workout.duration,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
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

        {/* Recent Workouts */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
          </View>

          <View style={styles.recentList}>
            {workoutHistory.length > 0 ? (
              workoutHistory.slice(0, 3).map(session => {
                const workout = workoutPrograms.find(
                  w => w.id === session.workoutId,
                );
                if (!workout) {
                  return null;
                }

                return (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.recentItem}
                    onPress={() => handleWorkoutPress(workout.id)}>
                    <View style={styles.recentHeader}>
                      <Text style={styles.recentName}>
                        {session.workoutName}
                      </Text>
                      <Text style={styles.recentDate}>
                        {new Date(session.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.recentMeta}>
                      <Text style={styles.metaItem}>
                        {formatWorkoutDuration(session.duration)}
                      </Text>
                      <Text
                        style={[
                          styles.difficultyTag,
                          {
                            backgroundColor: getDifficultyColor(
                              workout.difficulty,
                            ),
                          },
                        ]}>
                        {workout.difficulty.charAt(0).toUpperCase() +
                          workout.difficulty.slice(1)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  You haven't completed any workouts yet.
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate('WorkoutLibrary')}>
                  <Text style={styles.browseButtonText}>Start a Workout</Text>
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
    fontSize: FONT_SIZES.xlarge,
    fontWeight: '700',
    color: COLORS.white,
  },
  settingsButton: {
    padding: SPACING.small,
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
    marginBottom: SPACING.xlarge,
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
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.large,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.xsmall,
  },
  statLabel: {
    fontSize: FONT_SIZES.xsmall,
    fontWeight: '500',
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  favoritesSection: {
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
    gap: SPACING.medium,
  },
  favoriteItem: {
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.darkGray,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: SPACING.medium,
  },
  favoriteType: {
    fontSize: FONT_SIZES.xsmall,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  favoriteName: {
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  favoriteMeta: {
    flexDirection: 'row',
    gap: SPACING.medium,
    marginBottom: SPACING.small,
  },
  metaItem: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.xsmall,
  },
  visualizationContainer: {
    height: 25,
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    borderRadius: BORDER_RADIUS.small,
    overflow: 'hidden',
  },
  segmentBar: {
    height: '100%',
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
    height: 20,
  },
});

export default ProfileScreen;
