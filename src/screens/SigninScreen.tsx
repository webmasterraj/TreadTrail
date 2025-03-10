import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {COLORS, FONT_SIZES, SPACING, BORDER_RADIUS} from '../styles/theme';
import {UserContext} from '../context';
import Button from '../components/common/Button';
import appleAuth, { AppleButton } from '@invertase/react-native-apple-authentication';

type Props = NativeStackScreenProps<RootStackParamList, 'Signin'>;

// Icon components to avoid linting warnings about components defined in render
const LoadingIndicator = () => <ActivityIndicator size="small" color={COLORS.black} />;
const AppleLoadingIndicator = () => <ActivityIndicator size="small" color={COLORS.white} />;
const AppleIcon = () => <Text style={styles.appleIcon}>🍎</Text>;

const SigninScreen: React.FC<Props> = ({navigation}) => {
  const {signIn, signInWithApple, authState} = useContext(UserContext);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appleSignInLoading, setAppleSignInLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      navigation.replace('WorkoutLibrary');
    }
  }, [authState.isAuthenticated, navigation]);

  // Handle sign in with email
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      
      // Call signIn and capture the return value (true/false)
      const signInResult = await signIn(email, password);
      
      // If sign in failed, manually handle the failure
      if (!signInResult) {
        Alert.alert(
          'Sign In Failed',
          'Invalid email or password. Please try again.'
        );
        setIsLoading(false);
      }
      // If successful, navigation will happen in the useEffect when authState updates
    } catch (error) {
      Alert.alert(
        'Sign In Failed',
        'Invalid email or password. Please try again.',
      );
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  // Handle sign in with Apple
  const handleAppleSignIn = async () => {
    try {
      setAppleSignInLoading(true);
      await signInWithApple();
      // Navigation will happen in the useEffect when authState updates
    } catch (error) {
      Alert.alert(
        'Apple Sign In Failed',
        'There was an error signing in with Apple. Please try again.',
      );
      console.error('Apple sign in error:', error);
      setAppleSignInLoading(false);
    }
  };

  // Navigate to sign up screen
  const handleSignUpPress = () => {
    navigation.navigate('Signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign In</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.lightGray}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.lightGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />

            <Button
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleSignIn}
              type="accent"
              size="large"
              fullWidth
              style={styles.signInButton}
              disabled={isLoading || !email || !password}
              icon={isLoading ? LoadingIndicator : undefined}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {Platform.OS === 'ios' && appleAuth.isSupported && (
              <AppleButton
                buttonStyle={AppleButton.Style.BLACK}
                buttonType={AppleButton.Type.SIGN_IN}
                style={styles.appleSignInButton}
                onPress={handleAppleSignIn}
              />
            )}

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUpPress}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
  },
  backButton: {
    width: 40,
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 24,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  formContainer: {
    paddingHorizontal: SPACING.large,
    marginTop: SPACING.large,
  },
  label: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.xsmall,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.small,
    padding: SPACING.medium,
    color: COLORS.white,
    marginBottom: SPACING.medium,
    fontSize: FONT_SIZES.medium,
  },
  signInButton: {
    marginTop: SPACING.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.large,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    color: COLORS.lightGray,
    paddingHorizontal: SPACING.medium,
    fontSize: FONT_SIZES.small,
  },
  appleSignInButton: {
    width: '100%',
    height: 45,
    marginBottom: SPACING.medium,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xlarge,
  },
  signUpText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
  },
  signUpLink: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
});

export default SigninScreen;
