import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../styles/theme';
import Button from '../components/common/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { name } = route.params;
  
  // Handle continue button press
  const handleContinue = () => {
    navigation.navigate('EditPace');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>
          Welcome, {name}!
        </Text>
        
        <Text style={styles.subtitle}>
          Let's get your treadmill workouts to the next level
        </Text>
        
        <View style={styles.illustrationContainer}>
          {/* This would ideally be a custom illustration */}
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>🏃‍♂️</Text>
          </View>
        </View>
        
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Next steps:</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Set up your personal pace settings
            </Text>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Browse the workout library
            </Text>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Start your first interval workout
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Continue to Pace Settings" 
          onPress={handleContinue}
          type="accent"
          size="large"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    padding: SPACING.large,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: SPACING.xl,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  placeholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 70,
  },
  stepsContainer: {
    marginBottom: SPACING.xl,
  },
  stepsTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    marginBottom: SPACING.medium,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.medium,
  },
  stepNumberText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  stepText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
  },
  buttonContainer: {
    marginTop: SPACING.large,
    marginBottom: SPACING.medium,
  },
});

export default WelcomeScreen;