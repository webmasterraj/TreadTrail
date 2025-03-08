import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WorkoutProgram, PaceType } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOW, PACE_COLORS } from '../styles/theme';
import { DataContext, UserContext } from '../context';
import WorkoutCard from '../components/workout/WorkoutCard';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutLibrary'>;

const WorkoutLibraryScreen: React.FC<Props> = ({ navigation }) => {
  const { workoutPrograms, isLoading, toggleFavorite } = useContext(DataContext);
  const { userSettings } = useContext(UserContext);
  
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutProgram[]>([]);
  
  // Apply filters whenever workouts change
  useEffect(() => {
    if (!workoutPrograms) return;
    setFilteredWorkouts([...workoutPrograms]);
  }, [workoutPrograms]);
  
  // Navigate to workout details
  const handleWorkoutPress = (workoutId: string) => {
    navigation.navigate('WorkoutDetails', { workoutId });
  };
  
  // Toggle favorite status
  const handleFavoriteToggle = (workoutId: string) => {
    toggleFavorite(workoutId);
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
          {/* Pace Settings Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pace Settings</Text>
          </View>
          
          <View style={styles.paceSettingsCard}>
            <View style={styles.paceCircles}>
              {/* Recovery Pace */}
              <View style={styles.paceCircle}>
                <View style={[styles.circle, { backgroundColor: COLORS.recovery }]}>
                  <Text style={styles.circleText}>
                    {userSettings?.paceSettings?.recovery?.speed || 4.5}
                  </Text>
                </View>
                <Text style={styles.circleLabel}>Recovery</Text>
              </View>
              
              {/* Base Pace */}
              <View style={styles.paceCircle}>
                <View style={[styles.circle, { backgroundColor: COLORS.base }]}>
                  <Text style={styles.circleText}>
                    {userSettings?.paceSettings?.base?.speed || 5.5}
                  </Text>
                </View>
                <Text style={styles.circleLabel}>Base</Text>
              </View>
              
              {/* Run Pace */}
              <View style={styles.paceCircle}>
                <View style={[styles.circle, { backgroundColor: COLORS.run }]}>
                  <Text style={styles.circleText}>
                    {userSettings?.paceSettings?.run?.speed || 7.0}
                  </Text>
                </View>
                <Text style={styles.circleLabel}>Run</Text>
              </View>
              
              {/* Sprint Pace */}
              <View style={styles.paceCircle}>
                <View style={[styles.circle, { backgroundColor: COLORS.sprint }]}>
                  <Text style={styles.circleText}>
                    {userSettings?.paceSettings?.sprint?.speed || 9.0}
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
          
          {/* Workout Library Section */}
          <View style={styles.librarySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Workout Library</Text>
              <TouchableOpacity onPress={handleSeeAllPress}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            
            {/* Workout list */}
            <FlatList
              data={filteredWorkouts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <WorkoutCard
                  workout={item}
                  onPress={() => handleWorkoutPress(item.id)}
                  onFavoriteToggle={() => handleFavoriteToggle(item.id)}
                  showVisualization={true}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No workouts found.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
        
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <View style={styles.tabIcon}>
              {/* Hamburger menu icon for Workouts */}
              <Text style={[styles.tabIconText, styles.activeTabText]}>☰</Text>
            </View>
            <Text style={[styles.tabLabel, styles.activeTabText]}>Workouts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tab}>
            <View style={styles.tabIcon}>
              {/* Square icon for Profile */}
              <Text style={styles.tabIconText}>□</Text>
            </View>
            <Text style={styles.tabLabel}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tab}>
            <View style={styles.tabIcon}>
              {/* Gear icon for Settings */}
              <Text style={styles.tabIconText}>⚙</Text>
            </View>
            <Text style={styles.tabLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
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
  paceSettingsCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
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
    marginTop: 20,
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
  // Tab Bar Styles
  tabBar: {
    height: 60,
    backgroundColor: COLORS.black,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  activeTab: {
    // No different background, just different text color
  },
  tabIcon: {
    marginBottom: 4,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 20,
  },
  tabLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.accent,
  },
});

export default WorkoutLibraryScreen;