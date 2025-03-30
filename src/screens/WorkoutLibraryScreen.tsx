import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WorkoutProgram, CategoryType } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../styles/theme';
import { useAuth, useUserSettings } from '../hooks';
import { useSubscription } from '../context/SubscriptionContext';
import WorkoutCard from '../components/workout/WorkoutCard';
import BottomTabBar from '../components/common/BottomTabBar';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  fetchWorkoutPrograms, 
  fetchWorkoutHistory, 
  fetchStats, 
  toggleFavoriteWorkout,
  selectWorkoutPrograms, 
  selectIsLoading,
  processPendingQueue
} from '../redux/slices/workoutProgramsSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutLibrary'>;

const WorkoutLibraryScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const workoutPrograms = useAppSelector(selectWorkoutPrograms);
  const isLoading = useAppSelector(selectIsLoading);
  const { userSettings } = useUserSettings();
  const { authState } = useAuth();
  const { isPremiumWorkout, validateSubscription, subscriptionInfo } = useSubscription();
  const cameFromWelcome = useRef(false);
  
  // Check if we came from the Welcome screen
  useEffect(() => {
    if (route.params?.fromWelcome) {
      cameFromWelcome.current = true;
    }
    
    // If user didn't come from welcome screen, redirect them
    if (!cameFromWelcome.current) {
      // For signed-out users, always show welcome screen
      if (!authState.isAuthenticated) {
        navigation.replace('Welcome', { name: 'Runner' });
      }
    }
  }, [navigation, route.params, authState.isAuthenticated]);
  
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutProgram[]>([]);
  // Create a state to force updates of pace settings - with a key to force re-render
  const [paceSettings, setPaceSettings] = useState(userSettings?.paceSettings);
  // Add a key to force re-render of pace circles
  const [updateKey, setUpdateKey] = useState(Date.now());
  // Track if we're using metric units
  const [isMetric, setIsMetric] = useState(userSettings?.preferences?.units === 'metric');
  // Track selected categories
  const [selectedCategories, setSelectedCategories] = useState<(CategoryType | 'Free' | 'Premium')[]>([]);
  
  // All available categories in the desired order
  const CATEGORIES: CategoryType[] = [
    'Easy 🐣',
    'Trad HIIT 🏃🏼',
    'Hills ⛰',
    'Endurance 💪🏽',
    'Death 💀'
  ];
  
  // Special filter categories
  const SPECIAL_FILTERS = ['Free'];

  // Define special filters based on subscription status
  const getSpecialFilters = useCallback(() => {
    // If user is subscribed, don't show any special filters
    if (subscriptionInfo.isActive) {
      return [];
    }
    // Otherwise show only Free filter
    return ['Free'];
  }, [subscriptionInfo.isActive]);

  // Initialize data on component mount
  useEffect(() => {
    console.log('[LIBRARY] Component mounted');
    
    if (workoutPrograms.length > 0) {
      // Skip fetch if programs are already loaded
    } else if (!isLoading) {
      console.log('[LIBRARY] No workout programs loaded, dispatching fetch');
      dispatch(fetchWorkoutPrograms());
    }
    
    // Only fetch workout history and stats if user is authenticated
    if (authState.isAuthenticated) {
      // Fetch workout history and stats
      dispatch(fetchWorkoutHistory({}));
      dispatch(fetchStats());
      
      // Try to process any pending workouts
      dispatch(processPendingQueue());
    }
    
    // Check if user is authenticated
    if (!authState.isAuthenticated) {
      navigation.setOptions({
        headerShown: true,
        headerBackTitle: 'Back'
      });
    } else {
      navigation.setOptions({
        headerShown: false
      });
    }
    
    return () => {
      console.log('[LIBRARY] Component unmounting');
    };
  }, [dispatch, workoutPrograms.length, isLoading, authState.isAuthenticated]);

  // Convert km/h to mph for display
  const convertToImperial = (speed: number) => {
    return (speed / 1.60934).toFixed(1);
  };
  
  // Function to get the displayed speed value based on current unit setting
  const getDisplaySpeed = (speed: number) => {
    return isMetric ? speed.toFixed(1) : convertToImperial(speed);
  };

  // Update local state when userSettings change
  useEffect(() => {
    // Update pace settings
    if (userSettings?.paceSettings) {
      setPaceSettings({...userSettings.paceSettings});
    }
    
    // Update units preference
    if (userSettings?.preferences) {
      const newIsMetric = userSettings.preferences.units === 'metric';
      setIsMetric(newIsMetric);
    }
    
    // Force re-render
    setUpdateKey(Date.now());
  }, [userSettings]);

  // Refresh pace settings when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // This will run when the screen is focused
      if (userSettings) {
        // Update pace settings
        if (userSettings.paceSettings) {
          setPaceSettings({...userSettings.paceSettings});
        }
        
        // Update units preference
        if (userSettings.preferences) {
          const newIsMetric = userSettings.preferences.units === 'metric';
          setIsMetric(newIsMetric);
        }
        
        // Force re-render
        setUpdateKey(Date.now());
      }
      
      return () => {
        // This will run when the screen is unfocused
      };
    }, [userSettings])
  );
  
  // Check subscription status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshSubscriptionStatus = async () => {
        try {
          await validateSubscription();
        } catch (error) {
          console.error('Error refreshing subscription status:', error);
        }
      };
      
      refreshSubscriptionStatus();
    }, [validateSubscription])
  );
  
  // Filter workouts based on selected categories
  const getFilteredWorkouts = useCallback(() => {
    let filtered = [...workoutPrograms];
    
    // Apply category filters if any are selected
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(workout => {
        // Check for special filters
        const isPremium = workout.premium;
        
        if (selectedCategories.includes('Free') && isPremium) {
          return false;
        }
        
        // Check for category match
        return selectedCategories.includes(workout.category as CategoryType);
      });
    }
    
    return filtered;
  }, [workoutPrograms, selectedCategories]);

  // Toggle category selection
  const toggleCategorySelection = (category: CategoryType | 'Free' | 'Premium') => {
    setSelectedCategories(prevSelected => {
      if (prevSelected.includes(category)) {
        // Remove category if already selected
        return prevSelected.filter(cat => cat !== category);
      } else {
        // Add category if not selected
        return [...prevSelected, category];
      }
    });
  };
  
  // Navigate to workout details
  const handleWorkoutPress = (workoutId: string) => {
    // Find the workout to check if it's premium
    const workout = workoutPrograms.find(w => w.id === workoutId);
    
    if (!workout) {
      console.error('[WorkoutLibraryScreen] Workout not found:', workoutId);
      return;
    }
    
    // If it's a premium workout, check subscription status
    if (workout.premium) {
      // If user is not authenticated, go to regular details screen
      if (!authState.isAuthenticated) {
        navigation.navigate('WorkoutDetails', { workoutId });
      }
      // If user has active subscription, go to regular details screen
      else if (isPremiumWorkout(workout.premium)) {
        navigation.navigate('WorkoutDetails', { workoutId });
      } else {
        // Otherwise, go to premium preview screen
        navigation.navigate('PremiumWorkoutPreview', { workoutId });
      }
    } else {
      // For non-premium workouts, go to regular details screen
      navigation.navigate('WorkoutDetails', { workoutId });
    }
  };
  
  // Handle favorite toggle
  const handleFavoriteToggle = (workoutId: string) => {
    if (workoutId) {
      dispatch(toggleFavoriteWorkout(workoutId));
    }
  };
  
  // Navigate to edit pace screen
  const handleEditPacePress = () => {
    navigation.navigate('EditPace');
  };
  
  // Navigate to see all workouts
  const handleSeeAllPress = () => {
    // This could navigate to a filtered view or expanded list in the future
    // For now, it doesn't do anything as we're showing all workouts already
  };

  // Navigate to profile screen
  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  // Navigate to settings screen
  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };
  
  // Render the main content
  const renderContent = () => {
    if (isLoading && workoutPrograms.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      );
    }
    
    const filteredWorkouts = getFilteredWorkouts();
    
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Pace Settings Section - Only shown for logged-in users */}
            {authState.isAuthenticated && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pace Settings</Text>
                  <Text style={styles.unitsIndicator}>({isMetric ? 'km/h' : 'mph'})</Text>
                </View>
                
                <View style={styles.paceSettingsCard}>
                  <View key={`pace-circles-${updateKey}`} style={styles.paceCircles}>
                    {/* Recovery Pace */}
                    <View style={styles.paceCircle}>
                      <View style={[styles.circle, { backgroundColor: COLORS.recovery }]}>
                        <Text style={styles.circleText}>
                          {getDisplaySpeed(paceSettings?.recovery?.speed || 7.2)}
                        </Text>
                      </View>
                      <Text style={styles.circleLabel}>Recovery</Text>
                    </View>
                    
                    {/* Base Pace */}
                    <View style={styles.paceCircle}>
                      <View style={[styles.circle, { backgroundColor: COLORS.base }]}>
                        <Text style={styles.circleText}>
                          {getDisplaySpeed(paceSettings?.base?.speed || 8.8)}
                        </Text>
                      </View>
                      <Text style={styles.circleLabel}>Base</Text>
                    </View>
                    
                    {/* Run Pace */}
                    <View style={styles.paceCircle}>
                      <View style={[styles.circle, { backgroundColor: COLORS.run }]}>
                        <Text style={styles.circleText}>
                          {getDisplaySpeed(paceSettings?.run?.speed || 11.3)}
                        </Text>
                      </View>
                      <Text style={styles.circleLabel}>Run</Text>
                    </View>
                    
                    {/* Sprint Pace */}
                    <View style={styles.paceCircle}>
                      <View style={[styles.circle, { backgroundColor: COLORS.sprint }]}>
                        <Text style={styles.circleText}>
                          {getDisplaySpeed(paceSettings?.sprint?.speed || 14.5)}
                        </Text>
                      </View>
                      <Text style={styles.circleLabel}>Sprint</Text>
                    </View>
                    
                    {/* Edit Button */}
                    <View style={styles.paceCircle}>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={handleEditPacePress}
                      >
                        <Text style={styles.editButtonText}>✎</Text>
                      </TouchableOpacity>
                      <Text style={styles.circleLabel}>Edit</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            
            {/* Workout Library Section */}
            <View style={styles.librarySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Workout Library</Text>
                {/* <TouchableOpacity onPress={handleSeeAllPress}>
                  <Text style={styles.seeAllText}>See All →</Text>
                </TouchableOpacity> */}
              </View>
              
              {/* Category Filters */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFiltersContainer}
                scrollEnabled={true}
                bounces={false}
                directionalLockEnabled={true} // Lock scrolling to horizontal only
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical={false}
                nestedScrollEnabled={false}
              >
                {/* Special filters first */}
                {getSpecialFilters().map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.categoryPill,
                      selectedCategories.includes(filter as any) && styles.categoryPillSelected,
                      filter === 'Free' ? styles.freePill : {},
                      filter === 'Premium' ? styles.premiumPill : {}
                    ]}
                    onPress={() => toggleCategorySelection(filter as any)}
                  >
                    <Text 
                      style={[
                        styles.categoryPillText,
                        selectedCategories.includes(filter as any) && styles.categoryPillTextSelected
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {/* Regular category filters */}
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryPill,
                      selectedCategories.includes(category) && styles.categoryPillSelected
                    ]}
                    onPress={() => toggleCategorySelection(category)}
                  >
                    <Text 
                      style={[
                        styles.categoryPillText,
                        selectedCategories.includes(category) && styles.categoryPillTextSelected
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Workout list with loading indicator */}
              {isLoading && filteredWorkouts.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.loadingText}>Loading workouts...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredWorkouts}
                  keyExtractor={(item) => item.id}
                  extraData={[workoutPrograms, selectedCategories]} // Force re-render when Redux state or filters change
                  contentContainerStyle={styles.listContent}
                  ListHeaderComponent={isLoading ? (
                    <View style={styles.inlineLoadingContainer}>
                      <ActivityIndicator size="small" color={COLORS.accent} />
                      <Text style={styles.inlineLoadingText}>Loading more workouts...</Text>
                    </View>
                  ) : null}
                  renderItem={({ item }) => {
                    // Look up the latest data from Redux for this item
                    const reduxWorkout = workoutPrograms.find(w => w.id === item.id) || item;
                    
                    return (
                      <WorkoutCard
                        key={`workout-${item.id}`} // Use a stable key that doesn't change on favorite toggle
                        workout={reduxWorkout} // Use the latest data from Redux
                        onPress={() => handleWorkoutPress(reduxWorkout.id)}
                        onFavoriteToggle={() => handleFavoriteToggle(reduxWorkout.id)}
                        showVisualization={true}
                        showFavoriteButton={authState.isAuthenticated}
                        isSubscribed={subscriptionInfo.isActive && !subscriptionInfo.trialActive}
                        isTrialActive={subscriptionInfo.trialActive}
                      />
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        {selectedCategories.length > 0 
                          ? 'No workouts found for the selected categories.' 
                          : 'No workouts found.'}
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
          
          {/* Use the shared BottomTabBar component only for authenticated users */}
          {authState.isAuthenticated && <BottomTabBar activeTab="Workouts" />}
        </SafeAreaView>
      </View>
    );
  };

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 0, // Room for tab bar
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700', // Bold as per mockup
  },
  seeAllText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  unitsIndicator: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  paceSettingsCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
  },
  paceCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  paceCircle: {
    alignItems: 'center',
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700', // Bold as per mockup
  },
  circleLabel: {
    color: COLORS.white,
    fontSize: 11,
    opacity: 0.7,
  },
  editButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButtonText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.large,
  },
  librarySection: {
    flex: 1,
    marginTop: 10, // Reduced from 20 to 10
  },
  listContent: {
    paddingBottom: 80, // Leave room for tab bar
  },
  emptyContainer: {
    padding: SPACING.large,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    textAlign: 'center',
  },
  // Category filter styles
  categoryFiltersContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    height: 45, // Fixed height instead of minHeight to prevent vertical scrolling
    alignItems: 'center', // Center items vertically
    // overflow: 'hidden', // Hide any content that overflows
  },
  categoryPill: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 16,
    paddingHorizontal: 12, // Reduced from 15 to 12
    paddingVertical: 6, // Reduced from 8 to 6
    marginRight: 8, // Reduced from 10 to 8
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 60, 0.8)',
    height: 32, // Fixed height to ensure consistency
    justifyContent: 'center', // Center text vertically
  },
  categoryPillSelected: {
    backgroundColor: 'rgba(0, 150, 255, 0.2)',
    borderColor: COLORS.accent,
  },
  categoryPillText: {
    color: COLORS.white,
    fontSize: 13, // Reduced from 14 to 13
  },
  categoryPillTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  freePill: {
    // borderColor: COLORS.accent,
  },
  premiumPill: {
    borderColor: COLORS.gold,
  },
  inlineLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  inlineLoadingText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.body,
  },
});
export default WorkoutLibraryScreen;