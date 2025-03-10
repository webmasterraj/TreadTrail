import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../styles/theme';
import { UserContext } from '../context';
import Button from '../components/common/Button';
import appleAuth, { AppleButton } from '@invertase/react-native-apple-authentication';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp, signInWithApple } = useContext(UserContext);
  
  // States for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);
  
  // State to track if Apple Auth is supported
  const [isAppleAuthSupported, setIsAppleAuthSupported] = useState(false);
  
  // Check if Apple Auth is supported on component mount
  useEffect(() => {
    const checkAppleAuthSupport = async () => {
      if (Platform.OS === 'ios') {
        try {
          setIsAppleAuthSupported(appleAuth.isSupported);
        } catch (error) {
          console.error('Error checking Apple Auth support:', error);
          setIsAppleAuthSupported(false);
        }
      }
    };
    
    checkAppleAuthSupport();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await signUp(name.trim(), email.trim(), password);
      navigation.navigate('Welcome', { name: name.trim() });
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Apple Sign In
  const handleAppleSignIn = async () => {
    setIsAppleSigningIn(true);
    
    try {
      const success = await signInWithApple();
      
      if (success) {
        navigation.replace('WorkoutLibrary');
      } else {
        Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
    } finally {
      setIsAppleSigningIn(false);
    }
  };
  
  // Handle back button press
  const handleBack = () => {
    navigation.goBack();
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appLogo}>TreadTrail</Text>
      </View>
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>
              Join TreadTrail to access curated workout programs tailored to your fitness level.
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your full name"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your email address"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.formInput}
                  placeholder="Choose a strong password"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.togglePassword}
                  onPress={togglePasswordVisibility}
                >
                  <Text style={styles.togglePasswordText}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.spacer} />
            
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.black} />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            {Platform.OS === 'ios' && isAppleAuthSupported && (
              <AppleButton
                buttonStyle={AppleButton.Style.BLACK}
                buttonType={AppleButton.Type.SIGN_IN}
                style={styles.appleSignInButton}
                onPress={handleAppleSignIn}
              />
            )}
            
            {isAppleSigningIn && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.accent} />
              </View>
            )}
            
            <Text style={styles.termsText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
            
            <View style={styles.alternateAction}>
              <Text style={styles.alternateText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Landing')}>
                <Text style={styles.alternateLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 24,
  },
  appLogo: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: SPACING.large,
  },
  formTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: '700',
    marginBottom: SPACING.small,
  },
  formSubtitle: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.medium,
    marginBottom: SPACING.xlarge,
  },
  formGroup: {
    marginBottom: SPACING.large,
  },
  formLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.xsmall,
    fontWeight: '600',
  },
  formInput: {
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.medium,
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    padding: SPACING.medium,
    width: '100%',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  togglePassword: {
    position: 'absolute',
    right: SPACING.medium,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  togglePasswordText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
  spacer: {
    height: SPACING.medium,
  },
  signupButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.medium,
    height: 56,
  },
  signupButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.medium,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.darkGray,
  },
  dividerText: {
    color: COLORS.lightGray,
    paddingHorizontal: SPACING.medium,
    fontSize: FONT_SIZES.small,
  },
  appleSignInButton: {
    width: '100%',
    height: 50,
    marginBottom: SPACING.medium,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  termsText: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.xsmall,
    textAlign: 'center',
    marginTop: SPACING.large,
  },
  alternateAction: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.large,
  },
  alternateText: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.small,
  },
  alternateLink: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
});

export default SignupScreen;