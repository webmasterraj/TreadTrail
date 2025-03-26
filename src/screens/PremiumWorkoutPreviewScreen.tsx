import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  StatusBar,
  Dimensions,
  LayoutChangeEvent,
  Alert,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaceType } from '../types';
import { COLORS, FONT_SIZES, SPACING, DIFFICULTY_INDICATORS, FOCUS_INDICATORS, PACE_COLORS } from '../styles/theme';
import WorkoutVisualization from '../components/workout/WorkoutVisualization';
import { UserContext } from '../context';
import { formatDuration, formatTime } from '../utils/helpers';
import BottomTabBar from '../components/common/BottomTabBar';
import { useAppSelector } from '../redux/store';
import { selectWorkoutById } from '../redux/slices/workoutProgramsSlice';
import { useSubscription } from '../context/SubscriptionContext';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'PremiumWorkoutPreview'>;

const PremiumWorkoutPreviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const { authState } = useContext(UserContext);
  const { subscriptionInfo, validateSubscription, initializeIAP } = useSubscription();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  
  // Get the workout from Redux
  const workout = useAppSelector(selectWorkoutById(workoutId));
  
  // Handle case where workout is not found
  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Workout not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Workouts</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  // Verify this is actually a premium workout
  if (!workout.premium) {
    // If not premium, redirect to regular workout details
    navigation.replace('WorkoutDetails', { workoutId });
    return null;
  }
  
  const { 
    name, 
    description, 
    duration, 
    intensity,
    category,
    focus, 
    segments,
  } = workout;
  
  // Get category and focus info for display
  const categoryInfo = DIFFICULTY_INDICATORS[category];
  const focusInfo = FOCUS_INDICATORS[focus];
  
  // Format total duration
  const formattedDuration = formatDuration(duration);
  
  // Calculate total intervals
  const totalIntervals = segments.length;
  
  // Handle subscription button press
  const handleSubscribe = async () => {
    try {
      // Check if user is authenticated
      if (!authState || !authState.isAuthenticated) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to subscribe to premium workouts.',
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
      
      // Navigate to subscription screen
      navigation.navigate('Subscription');
    } catch (error) {
      console.error('[PremiumWorkoutPreviewScreen] Error navigating to subscription:', error);
      Alert.alert('Error', 'Failed to open subscription page. Please try again.');
    }
  };
  
  // Add state for layout measurements
  const [headerHeight, setHeaderHeight] = useState(0);
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
  
  // Initialize IAP when component mounts
  useEffect(() => {
    // Validate subscription status instead of initializing IAP
    validateSubscription();
  }, [validateSubscription]);
  
  // Check subscription status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const checkSubscription = async () => {
        try {
          setIsCheckingSubscription(true);
          await validateSubscription();
          
          // If subscription is now active, redirect to regular workout details
          if (subscriptionInfo.isActive) {
            navigation.replace('WorkoutDetails', { workoutId });
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
        } finally {
          setIsCheckingSubscription(false);
        }
      };
      
      checkSubscription();
    }, [subscriptionInfo.isActive, navigation, workoutId, validateSubscription])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View 
            style={styles.header}
            onLayout={(e: LayoutChangeEvent) => setHeaderHeight(e.nativeEvent.layout.height)}
          >
            <Text style={styles.title}>
              {name} <Text style={styles.premiumBadge}>🔒</Text>
            </Text>
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
                opacity={0.4} // Make the visualization semi-transparent
              />
              {/* Overlay for premium content */}
              <View style={styles.blurOverlay}>
                <View style={styles.overlayBackground} />
                <Text style={styles.blurText}>Subscribe to see full workout</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.premiumOverlay}>
            <View style={styles.premiumContent}>
              <Text style={styles.premiumTitle}>Premium Workout</Text>
              <Text style={styles.premiumDescription}>
                Subscribe to unlock this and all other premium workouts in the TreadTrail app.
              </Text>
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={handleSubscribe}
              >
                <Text style={styles.subscribeButtonText}>Subscribe to Unlock</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Workouts</Text>
          </TouchableOpacity>
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
    padding: 20, // Exact value from mockup
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15, // Exact value from mockup
  },
  title: {
    color: COLORS.accent,
    fontSize: 22, // Exact value from mockup
    fontWeight: 'bold',
  },
  premiumBadge: {
    fontSize: 18,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)', // Exact value from mockup
    fontSize: 14, // Exact value from mockup
    marginBottom: 20, // Exact value from mockup
    lineHeight: 19.6, // 1.4 line height as in mockup
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20, // Exact value from mockup
    padding: 12, // Exact value from mockup
    backgroundColor: COLORS.darkGray,
    borderRadius: 12, // Exact value from mockup
  },
  statItem: {
    alignItems: 'center',
    fontWeight: 'bold', // As per mockup
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12, // Exact value from mockup
    fontWeight: 'normal', // As per mockup
  },
  statValue: {
    color: COLORS.white,
    fontSize: 18, // Exact value from mockup
    fontWeight: 'bold',
  },
  previewSection: {
    marginBottom: 20, // Exact value from mockup
    paddingHorizontal: 0, // Let the visualization component fill the width
  },
  previewContainer: {
    minHeight: 100, // Minimum height as a fallback
    marginBottom: 10,
    position: 'relative', // Added for absolute positioning of blur overlay
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18, // Exact value from mockup
    fontWeight: 'bold',
    marginBottom: 12, // Exact value from mockup
    opacity: 0.9,
  },
  premiumOverlay: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  premiumContent: {
    alignItems: 'center',
  },
  premiumTitle: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  premiumDescription: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  subscribeButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    textAlign: 'center',
    marginTop: 100,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
});

export default PremiumWorkoutPreviewScreen;
