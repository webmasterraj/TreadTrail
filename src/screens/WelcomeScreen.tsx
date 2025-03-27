import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WorkoutSegment } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, PACE_COLORS } from '../styles/theme';
import Button from '../components/common/Button';
import WorkoutVisualization from '../components/workout/WorkoutVisualization';
import { UserContext } from '../context';
import { SubscriptionContext } from '../context/SubscriptionContext';
import { kgToLbs, lbsToKg } from '../utils/calorieUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { name } = route.params;
  const { authState, preferences, updateWeight } = useContext(UserContext);
  const { subscriptionInfo, startFreeTrial } = useContext(SubscriptionContext);
  
  // Get user's unit preference
  const unitPreference = preferences?.units || 'imperial';
  
  // Handle continue button press
  const handleContinue = () => {
    // Navigate directly to EditPace screen without showing weight modal
    navigation.navigate('EditPace');
  };

  // Handle explore workouts button press
  const handleExploreWorkouts = () => {
    // Use push instead of navigate to ensure the back button appears
    navigation.push('WorkoutLibrary', { fromWelcome: true });
  };
  
  // Set navigation options for signed-out users
  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigation.setOptions({
        headerLeft: () => null,
        headerBackTitle: 'Home',
        headerBackVisible: true,
      });
    }
  }, [navigation, authState.isAuthenticated]);
  
  // Sample workout segments for visualization
  const sampleWorkoutSegments: WorkoutSegment[] = [
    { type: 'base', duration: 120, incline: 1 },
    { type: 'base', duration: 120, incline: 1 },
    { type: 'run', duration: 60, incline: 2 },
    { type: 'run', duration: 60, incline: 2 },
    { type: 'run', duration: 90, incline: 2 },
    { type: 'recovery', duration: 120, incline: 1 },
    { type: 'sprint', duration: 30, incline: 3 },
    { type: 'sprint', duration: 60, incline: 3 },
    { type: 'recovery', duration: 120, incline: 1 },
    { type: 'run', duration: 60, incline: 2 },
    { type: 'run', duration: 60, incline: 2 },
    { type: 'base', duration: 90, incline: 1 },
    { type: 'base', duration: 90, incline: 1 }
  ];
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>
            Welcome to TreadTrail!
          </Text>
          
          <Text style={styles.subtitle}>
            Ready to crush the belt? This is how it works.
          </Text>
        </View>
        
        {/* Pace explanation section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Understanding Paces</Text>
          <Text style={styles.sectionText}>
            TreadTrail workouts use four different paces that you'll customize to your fitness level:
          </Text>
          
          <View style={styles.paceCardsContainer}>
            <View style={styles.paceCard}>
              <View style={[styles.paceIndicator, { backgroundColor: PACE_COLORS.recovery }]}>
                <Text style={[styles.paceIndicatorText, { color: COLORS.black }]}>R</Text>
              </View>
              <View style={styles.paceTextContainer}>
                <Text style={styles.paceName}>Recovery</Text>
                <Text style={styles.paceDescription}>Easy walking pace to catch your breath</Text>
              </View>
            </View>
            
            <View style={styles.paceCard}>
              <View style={[styles.paceIndicator, { backgroundColor: PACE_COLORS.base }]}>
                <Text style={[styles.paceIndicatorText, { color: COLORS.black }]}>B</Text>
              </View>
              <View style={styles.paceTextContainer}>
                <Text style={styles.paceName}>Base</Text>
                <Text style={styles.paceDescription}>Comfortable jogging pace you can maintain</Text>
              </View>
            </View>
            
            <View style={styles.paceCard}>
              <View style={[styles.paceIndicator, { backgroundColor: PACE_COLORS.run }]}>
                <Text style={[styles.paceIndicatorText, { color: COLORS.black }]}>R</Text>
              </View>
              <View style={styles.paceTextContainer}>
                <Text style={styles.paceName}>Run</Text>
                <Text style={styles.paceDescription}>Challenging pace that pushes your limits</Text>
              </View>
            </View>
            
            <View style={styles.paceCard}>
              <View style={[styles.paceIndicator, { backgroundColor: PACE_COLORS.sprint }]}>
                <Text style={[styles.paceIndicatorText, { color: COLORS.black }]}>S</Text>
              </View>
              <View style={styles.paceTextContainer}>
                <Text style={styles.paceName}>Sprint</Text>
                <Text style={styles.paceDescription}>All-out effort for short bursts</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.noticeContainer}>
            <Text style={styles.noticeText}>
              You'll set your personal speeds for each pace in the next step. You can always adjust them later in settings.
            </Text>
          </View>
        </View>
        
        {/* Workout visualization section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading the Workout</Text>
          <Text style={styles.sectionText}>
            Each workout is visualized as a series of bars. Here's how to read them:
          </Text>
          
          <View style={styles.visualizationContainer}>
            <View style={styles.workoutVisualizationWrapper}>
              <WorkoutVisualization 
                segments={sampleWorkoutSegments} 
                containerHeight={150}
                minutePerBar={true}
              />
            </View>
            
            <View style={styles.annotationsContainer}>
              <View style={styles.annotationItem}>
                <View style={[styles.annotationIndicator, { backgroundColor: PACE_COLORS.run }]} />
                <Text style={styles.annotationText}>Color = Pace</Text>
              </View>
              
              <View style={styles.annotationItem}>
                <View style={styles.heightAnnotation}>
                  <View style={styles.heightLine} />
                  <View style={styles.heightArrow} />
                </View>
                <Text style={styles.annotationText}>Height = Incline</Text>
              </View>
              
              <View style={styles.annotationItem}>
                <View style={styles.spaceAnnotation}>
                  <View style={styles.spaceLine} />
                  <View style={styles.spaceArrow} />
                </View>
                <Text style={styles.annotationText}>Space = Duration</Text>
              </View>
            </View>
            
            <View style={styles.legendContainer}>
              {Object.entries(PACE_COLORS).map(([type, color]) => (
                <View key={type} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Explore Workouts" 
          onPress={handleExploreWorkouts}
          type="secondary"
          size="large"
          fullWidth
          style={styles.exploreButton}
        />
        {/* Only show Customize Paces button for authenticated users */}
        {authState.isAuthenticated && (
          <Button 
            title="Set Your Paces" 
            onPress={handleContinue}
            type="accent"
            size="large"
            fullWidth
          />
        )}
      </View>
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
  scrollViewContent: {
    padding: SPACING.large,
    paddingBottom: SPACING.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  welcomeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    textAlign: 'center',
    opacity: 0.8,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.medium,
  },
  sectionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    opacity: 0.9,
    marginBottom: SPACING.medium,
    lineHeight: 22,
  },
  paceCardsContainer: {
    marginBottom: SPACING.medium,
  },
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mediumGray,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
    marginBottom: SPACING.small,
  },
  paceIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.medium,
  },
  paceIndicatorText: {
    fontWeight: 'bold',
    fontSize: FONT_SIZES.medium,
  },
  paceTextContainer: {
    flex: 1,
  },
  paceName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  paceDescription: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    opacity: 0.7,
  },
  noticeContainer: {
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
  },
  noticeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    opacity: 0.9,
    lineHeight: 20,
  },
  visualizationContainer: {
    backgroundColor: COLORS.mediumGray,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
    marginTop: SPACING.small,
  },
  workoutVisualizationWrapper: {
    height: 150,
    marginBottom: SPACING.medium,
  },
  annotationsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.medium,
    paddingHorizontal: SPACING.small,
    marginTop: SPACING.small,
  },
  annotationItem: {
    alignItems: 'center',
    flex: 1,
  },
  annotationIndicator: {
    width: 20,
    height: 20,
    borderRadius: 3,
    marginBottom: 5,
  },
  heightAnnotation: {
    height: 20,
    width: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  heightLine: {
    height: 20,
    width: 2,
    backgroundColor: COLORS.white,
  },
  heightArrow: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.white,
    // transform: [{ rotate: '180deg' }],
  },
  spaceAnnotation: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  spaceLine: {
    height: 2,
    width: 20,
    backgroundColor: COLORS.white,
  },
  spaceArrow: {
    position: 'absolute',
    right: -5,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: COLORS.white,
  },
  annotationText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.small,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.medium,
    marginBottom: SPACING.small,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
  },
  buttonContainer: {
    padding: SPACING.large,
    paddingTop: SPACING.medium,
    backgroundColor: COLORS.black,
  },
  exploreButton: {
    marginBottom: SPACING.medium,
  },
  customizeButton: {
    marginBottom: SPACING.small,
  },
});

export default WelcomeScreen;