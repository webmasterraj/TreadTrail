import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ImageBackground,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../styles/theme';
import { UserContext } from '../context';
import Button from '../components/common/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const { userSettings, authState } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // If user is authenticated, navigate to the appropriate screen
        if (authState.isAuthenticated) {
          navigation.replace('WorkoutLibrary');
        } else if (userSettings?.profile.name) {
          // For backward compatibility - if user has a profile but isn't authenticated
          navigation.replace('WorkoutLibrary');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [authState.isAuthenticated, userSettings, navigation]);
  
  // Handle sign up button press
  const handleSignUp = () => {
    navigation.navigate('Signup');
  };
  
  // Handle sign in button press
  const handleSignIn = () => {
    navigation.navigate('Signin');
  };
  
  // Handle browse workouts button press
  const handleBrowseWorkouts = () => {
    navigation.navigate('WorkoutLibrary');
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }
  
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80' }}
      style={styles.background}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.container}>
        {/* Gradient overlay exactly matching the mockup */}
        <LinearGradient
          colors={[
            COLORS.blackOverlayLight,
            COLORS.blackOverlayMedium,
            COLORS.blackOverlayHeavy,
            COLORS.blackOverlayVeryHeavy
          ]}
          locations={[0, 0.5, 0.8, 1]}
          style={styles.overlay}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>TreadTrail</Text>
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              Treadmill Runs <Text style={styles.highlight}>Reimagined</Text>
            </Text>
            
            <Text style={styles.subtitle}>
              Curated treadmill interval programs that transform ordinary runs into addictive workouts, wherever you train.
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button 
                title="Sign Up" 
                onPress={handleSignUp}
                type="accent"
                size="large"
                fullWidth
                style={styles.button}
              />
              
              <Button 
                title="Sign In" 
                onPress={handleSignIn}
                type="secondary"
                size="large"
                fullWidth
                style={styles.button}
              />
            </View>
            
            <Button 
              title="Browse Workouts" 
              onPress={handleBrowseWorkouts}
              type="text"
              size="medium"
              fullWidth
              style={styles.browseButton}
            />
            
            <Text style={styles.terms}>
              By continuing, you agree to our Terms of Service
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  logoContainer: {
    paddingTop: 60,
  },
  logo: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800', // Extra Bold to match mockup
  },
  contentContainer: {
    // Padding at the bottom of the screen
  },
  title: {
    color: COLORS.white,
    fontSize: 36, // Exact size from mockup
    fontWeight: '800', // Extra Bold to match mockup
    marginBottom: 10, // Exact spacing from mockup
    lineHeight: 43.2, // 1.2 line height as in mockup
  },
  highlight: {
    color: COLORS.accent,
  },
  subtitle: {
    color: COLORS.white,
    fontSize: 16, // Exact size from mockup
    marginBottom: 40, // Exact spacing from mockup
    opacity: 0.9,
    lineHeight: 24, // 1.5 line height as in mockup
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15, // Exact gap from mockup
    marginBottom: 20, // Reduced spacing for the browse button
  },
  button: {
    flex: 1,
    padding: 18, // Exact padding from mockup for large button
    borderRadius: BORDER_RADIUS.button,
  },
  browseButton: {
    marginBottom: 30,
  },
  terms: {
    color: COLORS.white,
    fontSize: 12, // Exact size from mockup
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default LandingScreen;