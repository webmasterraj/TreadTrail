import React, { useContext, useState } from 'react';
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
  StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../styles/theme';
import { UserContext } from '../context';
import Button from '../components/common/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { updateProfile } = useContext(UserContext);
  
  // States for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      await updateProfile(name.trim());
      navigation.navigate('Welcome', { name: name.trim() });
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              <Text style={styles.signupButtonText}>Create Account</Text>
            </TouchableOpacity>
            
            <Text style={styles.termsText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
            
            <View style={styles.alternateAction}>
              <Text style={styles.alternateText}>Already have an account? </Text>
              <TouchableOpacity>
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
    padding: 0,
  },
  formContainer: {
    padding: 30,
    paddingBottom: 40,
    flex: 1,
  },
  formTitle: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 40,
  },
  formSubtitle: {
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    opacity: 0.7,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    width: '100%',
    padding: 16,
    borderRadius: 12, // --input-radius from mockup
    backgroundColor: COLORS.mediumGray,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.white,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  togglePassword: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }], // Approximating the centering
  },
  togglePasswordText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  spacer: {
    flexGrow: 1,
  },
  signupButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.button,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  signupButtonText: {
    color: COLORS.black,
    fontWeight: '600',
    fontSize: 16,
  },
  termsText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 20,
    lineHeight: 18,
  },
  alternateAction: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  alternateText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  alternateLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignupScreen;