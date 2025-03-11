import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../styles/theme';
import { UserContext } from '../context';
import Button from '../components/common/Button';
import * as AppleAuthentication from 'expo-apple-authentication';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const { userSettings, authState, signInWithApple } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [appleSignInLoading, setAppleSignInLoading] = useState(false);
  
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
  
  // Handle Sign In with Apple using Expo's Authentication
  const handleAppleSignIn = async () => {
    try {
      setAppleSignInLoading(true);
      
      if (Platform.OS === 'ios') {
        // Use Expo's Apple Authentication
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        
        // Successfully authenticated, now handle the credentials in our system
        if (credential && credential.user) {
          // Call our existing signInWithApple function with the credentials
          const signInResult = await signInWithApple(credential);
          
          if (!signInResult) {
            Alert.alert(
              'Sign In Failed',
              'There was an error processing your Apple Sign In. Please try again.'
            );
          }
          // On success, the useEffect will redirect
        }
      } else {
        // For non-iOS platforms, show a message
        Alert.alert(
          'Not Supported',
          'Apple Sign In is only available on iOS devices.'
        );
      }
      
      setAppleSignInLoading(false);
    } catch (error) {
      console.error('Apple sign in error:', error);
      
      if (error.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow
        console.log('User canceled Apple Sign In');
      } else {
        Alert.alert(
          'Apple Sign In Failed',
          'There was an error signing in with Apple. Please try again.'
        );
      }
      
      setAppleSignInLoading(false);
    }
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
    <View style={AppStyles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80' }}
        style={styles.background}
        resizeMode="cover"
      >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Gradient overlay exactly matching the mockup */}
        <LinearGradient
          colors={[
            COLORS.blackOverlayLight,
            COLORS.blackOverlayMedium,
            COLORS.blackOverlayHeavy,
            COLORS.blackOverlayVeryHeavy
          ]}
          locations={[0, 0.4, 0.7, 1]}
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
              {/* Expo Apple Authentication Button */}
              {Platform.OS === 'ios' ? (
                <View style={styles.buttonWrapper}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                    cornerRadius={25}
                    style={styles.appleSignInButton}
                    onPress={handleAppleSignIn}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.customAppleButton, styles.appleButtonTouch]} 
                  onPress={handleAppleSignIn}
                >
                  <Text style={styles.appleIcon}>🍎</Text>
                  <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Button 
              title="Browse Workouts" 
              onPress={handleBrowseWorkouts}
              type="secondary"
              size="large"
              fullWidth
              style={styles.browseButton}
              textStyle={styles.browseButtonText}
            />
            
            <Text style={styles.terms}>
              By continuing, you agree to our Terms of Service
            </Text>
          </View>
        </LinearGradient>
      </View>
    </ImageBackground>
    </View>
  );
};

// This wrapping style at the app level will ensure full screen coverage
const AppStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black, // Fallback color
  },
});

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    marginBottom: 15, // Reduced spacing for the browse button
    width: '100%', // Ensure full width
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 15,
    height: 50,
  },
  appleSignInButton: {
    width: '100%', // Full width
    height: 50, // Taller than default
  },
  browseButton: {
    height: 50, // Match the height of the Apple button
    marginBottom: 30,
    paddingVertical: 0, // Override default padding to prevent text cutoff
  },
  browseButtonText: {
    fontSize: 18, // Match the Apple button text size
  },
  terms: {
    color: COLORS.white,
    fontSize: 12, // Exact size from mockup
    textAlign: 'center',
    opacity: 0.6,
  },
  customAppleButton: {
    backgroundColor: '#FFF',
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  appleButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50, // Match the height exactly
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '100%',
  },
  appleButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
});

export default LandingScreen;