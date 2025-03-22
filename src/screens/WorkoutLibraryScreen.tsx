import React, { useContext, useState, useEffect, useCallback } from 'react';
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
import { UserContext } from '../context';
import WorkoutCard from '../components/workout/WorkoutCard';
import BottomTabBar from '../components/common/BottomTabBar';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  fetchWorkoutPrograms, 
  fetchWorkoutHistory, 
  fetchStats, 
  toggleWorkoutFavorite,
  selectWorkoutPrograms, 
  selectIsLoading 
} from '../redux/slices/workoutProgramsSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutLibrary'>;

const WorkoutLibraryScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const workoutPrograms = useAppSelector(selectWorkoutPrograms);
  const isLoading = useAppSelector(selectIsLoading);
  const { userSettings } = useContext(UserContext);
  
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutProgram[]>([]);
  // Create a state to force updates of pace settings - with a key to force re-render
  const [paceSettings, setPaceSettings] = useState(userSettings?.paceSettings);
  // Add a key to force re-render of pace circles
  const [updateKey, setUpdateKey] = useState(Date.now());
  // Track if we're using metric units
  const [isMetric, setIsMetric] = useState(userSettings?.preferences?.units === 'metric');
  // Track selected categories
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([]);
  
  // All available categories in the desired order
  const CATEGORIES: CategoryType[] = [
    'Easy 🐣',
    'Trad HIIT 🏃🏼',
    'Hills ⛰',
    'Endurance 💪🏽',
    'Death 💀'
  ];
  
  // Initialize data on component mount
  useEffect(() => {
    dispatch(fetchWorkoutPrograms());
    dispatch(fetchWorkoutHistory());
    dispatch(fetchStats());
  }, [dispatch]);
  
  
  // Convert mph to km/h for display
  const convertToMetric = (speed: number) => {
    return (speed * 1.60934).toFixed(1);
  };
  
  // Function to get the displayed speed value based on current unit setting
  const getDisplaySpeed = (speed: number) => {
    return isMetric ? convertToMetric(speed) : speed.toFixed(1);
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
  
  // Toggle category selection
  const toggleCategorySelection = (category: CategoryType) => {
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
  
  // Apply filters whenever workouts or selected categories change
  useEffect(() => {
    if (!workoutPrograms || workoutPrograms.length === 0) return;
    
    // Make sure we're creating a new array reference
    let filtered = workoutPrograms.map(workout => ({
      ...workout,
      // Ensure favorite is always a boolean
      favorite: Boolean(workout.favorite)
    }));
    
    // Apply category filter if any categories are selected
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(workout => 
        selectedCategories.includes(workout.category)
      );
    }
    
    setFilteredWorkouts(filtered);
  }, [workoutPrograms, selectedCategories]);
  
  // Navigate to workout details
  const handleWorkoutPress = (workoutId: string) => {
    navigation.navigate('WorkoutDetails', { workoutId });
  };
  
  // Get auth state at component level
  const { authState } = useContext(UserContext);
  
  // Toggle favorite status using Redux
  const handleFavoriteToggle = (workoutId: string) => {
    if (!authState.isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add workouts to your favorites.',
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
    
    try {
      if (!workoutId) {
        return;
      }
      
      // Directly dispatch the toggle action
      dispatch(toggleWorkoutFavorite(workoutId));
    } catch (error) {
      console.error('Error toggling favorite:', error);
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
  
  // Show loading indicator while data is loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
                        {getDisplaySpeed(paceSettings?.recovery?.speed || 4.5)}
                      </Text>
                    </View>
                    <Text style={styles.circleLabel}>Recovery</Text>
                  </View>
                  
                  {/* Base Pace */}
                  <View style={styles.paceCircle}>
                    <View style={[styles.circle, { backgroundColor: COLORS.base }]}>
                      <Text style={styles.circleText}>
                        {getDisplaySpeed(paceSettings?.base?.speed || 5.5)}
                      </Text>
                    </View>
                    <Text style={styles.circleLabel}>Base</Text>
                  </View>
                  
                  {/* Run Pace */}
                  <View style={styles.paceCircle}>
                    <View style={[styles.circle, { backgroundColor: COLORS.run }]}>
                      <Text style={styles.circleText}>
                        {getDisplaySpeed(paceSettings?.run?.speed || 7.0)}
                      </Text>
                    </View>
                    <Text style={styles.circleLabel}>Run</Text>
                  </View>
                  
                  {/* Sprint Pace */}
                  <View style={styles.paceCircle}>
                    <View style={[styles.circle, { backgroundColor: COLORS.sprint }]}>
                      <Text style={styles.circleText}>
                        {getDisplaySpeed(paceSettings?.sprint?.speed || 9.0)}
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
            
            {/* Workout list */}
            <FlatList
              data={filteredWorkouts}
              keyExtractor={(item) => item.id}
              extraData={[workoutPrograms, selectedCategories]} // Force re-render when Redux state or filters change
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                // Look up the latest data from Redux for this item
                const reduxWorkout = workoutPrograms.find(w => w.id === item.id) || item;
                
                return (
                  <WorkoutCard
                    key={`workout-${item.id}`} // Use a stable key that doesn't change on favorite toggle
                    workout={reduxWorkout} // Use the latest data from Redux
                    onPress={() => handleWorkoutPress(reduxWorkout.id)}
                    onFavoriteToggle={() => dispatch(toggleWorkoutFavorite(reduxWorkout.id))}
                    showVisualization={true}
                    showFavoriteButton={authState.isAuthenticated}
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
          </View>
        </View>
        
        {/* Use the shared BottomTabBar component */}
        <BottomTabBar activeTab="Workouts" />
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
    paddingBottom: 12,
    flexDirection: 'row',
    height: 45, // Fixed height instead of minHeight to prevent vertical scrolling
    alignItems: 'center', // Center items vertically
    // overflow: 'hidden', // Hide any content that overflows
  },
  categoryPill: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
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
    color: COLORS.lightGray,
    fontSize: 13, // Reduced from 14 to 13
  },
  categoryPillTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default WorkoutLibraryScreen;