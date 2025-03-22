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
        // If user is authenticated, navigate to the Welcome screen
        if (authState.isAuthenticated) {
          navigation.replace('Welcome', { name: authState.user?.name || 'Runner' });
        } else if (userSettings?.profile.name) {
          // For backward compatibility - if user has a profile but isn't authenticated
          navigation.replace('Welcome', { name: userSettings.profile.name });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [authState.isAuthenticated, userSettings, navigation]);
  
  // Handle Sign In with Apple
  const handleAppleSignIn = async () => {
    try {
      setAppleSignInLoading(true);
      
      // Call our Apple sign in function
      const signInResult = await signInWithApple();
      
      if (!signInResult) {
        Alert.alert(
          'Sign In Failed',
          'There was an error signing in with Apple. Please try again.'
        );
      }
      // On success, the useEffect will redirect
      
      setAppleSignInLoading(false);
    } catch (error) {
      console.error('Apple sign in error:', error);
      
      Alert.alert(
        'Apple Sign In Failed',
        'There was an error signing in with Apple. Please try again.'
      );
      
      setAppleSignInLoading(false);
    }
  };
  
  // Handle browse workouts button press
  const handleBrowseWorkouts = () => {
    // Navigate to Welcome screen first
    navigation.navigate('Welcome', { name: 'Runner' });
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
              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={BORDER_RADIUS.button}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
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
    width: '100%',
  },
  logo: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800', // Extra Bold to match mockup
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  highlight: {
    color: COLORS.accent,
  },
  subtitle: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 8, // Reduced from 16
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 8, // Reduced from 16
  },
  browseButton: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    // backgroundColor: 'transparent',
  },
  browseButtonText: {
    color: COLORS.white,
  },
  terms: {
    color: COLORS.white,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default LandingScreen;