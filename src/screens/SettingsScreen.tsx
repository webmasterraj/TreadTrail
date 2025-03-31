import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Switch,
  ActivityIndicator,
  Button,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {COLORS, FONT_SIZES, SPACING, BORDER_RADIUS} from '../styles/theme';
import {useAuth, useUserSettings} from '../hooks';
import {SubscriptionContext} from '../context/SubscriptionContext';
import BottomTabBar from '../components/common/BottomTabBar';
import NetInfo from '@react-native-community/netinfo';

// Debug flag - set to false to disable debug logs
const DEBUG_SETTINGS = false;

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '42';

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const {authState, signOut, deleteAccount} = useAuth();
  const {preferences, userSettings, isLoading, syncUserSettings} = useUserSettings();
  const {subscriptionInfo} = useContext(SubscriptionContext);
  const [isError, setIsError] = useState(false);
  const [localAudioCues, setLocalAudioCues] = useState<boolean | undefined>(undefined);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Add debug logging on component mount
  useEffect(() => {
    if (DEBUG_SETTINGS) {
      console.log('[DEBUG-SETTINGS] SettingsScreen mounted');
      console.log('[DEBUG-SETTINGS] isLoading:', isLoading);
      console.log('[DEBUG-SETTINGS] userSettings:', userSettings ? 'exists' : 'null');
      console.log('[DEBUG-SETTINGS] preferences from context:', preferences ? 'exists' : 'undefined');
      console.log('[DEBUG-SETTINGS] userSettings.preferences:', userSettings?.preferences ? 'exists' : 'undefined');
      
      if (preferences) {
        console.log('[DEBUG-SETTINGS] preferences object:', JSON.stringify(preferences));
        console.log('[DEBUG-SETTINGS] enableAudioCues from preferences:', preferences.enableAudioCues);
      }
      
      if (userSettings?.preferences) {
        console.log('[DEBUG-SETTINGS] preferences from userSettings:', JSON.stringify(userSettings.preferences));
        console.log('[DEBUG-SETTINGS] enableAudioCues from userSettings.preferences:', userSettings.preferences.enableAudioCues);
      }
    }

    // Initialize local audio cues state from preferences
    if (preferences && localAudioCues === undefined) {
      setLocalAudioCues(preferences.enableAudioCues);
    }
  }, [isLoading, userSettings, preferences, localAudioCues]);

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.replace('Landing');
        },
      },
    ]);
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    // Check network connectivity first
    const netInfo = await NetInfo.fetch();
    const isConnected = !!netInfo.isConnected && !!netInfo.isInternetReachable;
    
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'You need to be online to delete your account. Please connect to the internet and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  // Add second confirmation
  const confirmDeleteAccount = () => {
    Alert.alert(
      'Confirm Deletion',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading indicator
              setIsDeletingAccount(true);
              
              const result = await deleteAccount();
              
              if (result.success) {
                // Navigate to landing screen after successful deletion
                navigation.replace('Landing');
              } else {
                // Show appropriate error message based on the error
                if (result.error?.includes('network') || result.error?.includes('internet')) {
                  Alert.alert(
                    'Connection Error',
                    'There was a problem with your internet connection. Please try again when you have a stable connection.'
                  );
                } else {
                  Alert.alert(
                    'Error',
                    result.error || 'Failed to delete your account. Please try again later or contact support if the problem persists.'
                  );
                }
              }
            } catch (error: any) {
              console.error('Account deletion error:', error);
              
              Alert.alert(
                'Error',
                'Failed to delete your account. Please try again later or contact support if the problem persists.'
              );
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  // Handle legal links
  const handleLegalLink = (type: string) => {
    let url = '';
    
    switch (type) {
      case 'terms':
        url = 'https://treadtrail.run/terms';
        break;
      case 'privacy':
        url = 'https://treadtrail.run/privacy.html';
        break;
      case 'licenses':
        // Keep the alert for licenses as it might require a different implementation
        Alert.alert('Coming Soon', 'This feature is not yet implemented.');
        return;
      default:
        return;
    }
    
    // Check if the URL can be opened
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log(`Cannot open URL: ${url}`);
        Alert.alert('Error', 'Cannot open the link. Please visit our website directly.');
      }
    }).catch(err => {
      console.error('An error occurred', err);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    });
  };

  // Handle support link
  const handleSupportPress = () => {
    Linking.openURL('mailto:hello@treadtrail.run');
  };

  // Handle navigation to workouts screen
  const handleWorkoutsPress = () => {
    navigation.navigate('WorkoutLibrary');
  };

  // Handle navigation to profile screen
  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  // Handle navigation to subscription screen
  const handleSubscriptionPress = () => {
    navigation.navigate('Subscription');
  };

  // Toggle audio cues
  const toggleAudioCues = (value: boolean) => {
    if (DEBUG_SETTINGS) {
      console.log('[DEBUG-SETTINGS] toggleAudioCues called with value:', value);
      console.log('[DEBUG-SETTINGS] userSettings at toggle time:', userSettings ? 'exists' : 'null');
      console.log('[DEBUG-SETTINGS] preferences at toggle time:', preferences ? 'exists' : 'undefined');
    }
    
    if (!userSettings || !userSettings.preferences) {
      console.error('[DEBUG-SETTINGS] Cannot toggle audio cues: userSettings or preferences is undefined');
      return;
    }
    
    // Update local state immediately for responsive UI
    setLocalAudioCues(value);
    
    // Sync with Redux in the background
    syncUserSettings({
      preferences: {
        enableAudioCues: value
      }
    });
  };

  // Render the settings screen - only show loading on initial load, not during updates
  if (isLoading && localAudioCues === undefined) {
    if (DEBUG_SETTINGS) {
      console.log('[DEBUG-SETTINGS] Rendering loading state');
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  // Safety check to ensure we have user settings and preferences before rendering
  if (!userSettings || !preferences) {
    if (DEBUG_SETTINGS) {
      console.log('[DEBUG-SETTINGS] Rendering error state');
      console.log('[DEBUG-SETTINGS] userSettings:', userSettings ? 'exists' : 'null');
      console.log('[DEBUG-SETTINGS] preferences:', preferences ? 'exists' : 'undefined');
    }
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error loading settings</Text>
        <Button 
          title="Retry" 
          onPress={() => {
            // Force a re-render by toggling the error state
            setIsError(true);
            setTimeout(() => setIsError(false), 500);
          }} 
        />
      </View>
    );
  }

  if (DEBUG_SETTINGS) {
    console.log('[DEBUG-SETTINGS] Rendering full settings screen');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {authState.isAuthenticated ? (
              <>
                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={handleSubscriptionPress}>
                  <Text style={styles.itemLabel}>Manage Subscription</Text>
                  <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={handleSignOut}>
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>                
              </>
            ) : (
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => navigation.navigate('Landing')}>
                <Text style={styles.signInText}>Sign In / Create Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingsItem}>
              <Text style={styles.itemLabel}>Audio Cues</Text>
              <Switch
                value={localAudioCues !== undefined ? localAudioCues : preferences?.enableAudioCues || false}
                onValueChange={toggleAudioCues}
                trackColor={{false: COLORS.darkGray, true: COLORS.accent}}
                thumbColor={COLORS.white}
              />
            </View>
            
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => navigation.navigate('EditPace')}>
              <Text style={styles.itemLabel}>Set Paces & Weight</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => handleLegalLink('terms')}>
              <Text style={styles.itemLabel}>Terms of Service</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => handleLegalLink('privacy')}>
              <Text style={styles.itemLabel}>Privacy Policy</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            {/* Delete Account Button */}
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={handleDeleteAccount}
              disabled={isDeletingAccount}>
              {isDeletingAccount ? (
                <View style={styles.deleteAccountContainer}>
                  <ActivityIndicator size="small" color="#FF453A" />
                  <Text style={[styles.deleteAccountText, { marginLeft: SPACING.small }]}>
                    Deleting...
                  </Text>
                </View>
              ) : (
                <Text style={styles.deleteAccountText}>Delete Account</Text>
              )}
            </TouchableOpacity>

          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.versionInfo}>
            TreadTrail v{APP_VERSION} ({BUILD_NUMBER})
          </Text>
          <Text style={styles.copyright}>
            {new Date().getFullYear()} TreadTrail. All rights reserved.
          </Text>
          <TouchableOpacity onPress={handleSupportPress}>
            <Text style={styles.supportLink}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <BottomTabBar currentScreen="Settings" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
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
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.large,
  },
  section: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: SPACING.small,
    opacity: 0.9,
  },
  card: {
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
  },
  itemLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
  },
  itemValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.small,
  },
  chevron: {
    marginLeft: SPACING.small,
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.small,
  },
  signOutText: {
    color: '#FF453A', // iOS red color for destructive actions
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
  },
  deleteAccountText: {
    color: '#FF453A', // iOS red color for destructive actions
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
  },
  deleteAccountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: SPACING.xlarge,
    marginBottom: SPACING.xxlarge,
  },
  versionInfo: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.xsmall,
    marginBottom: SPACING.xsmall,
  },
  copyright: {
    color: COLORS.lightGray,
    fontSize: FONT_SIZES.xsmall,
    marginBottom: SPACING.medium,
  },
  supportLink: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.small,
    fontWeight: '500',
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
  errorText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    marginBottom: SPACING.medium,
  },
});

export default SettingsScreen;
