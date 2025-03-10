import React, {useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {COLORS, FONT_SIZES, SPACING, BORDER_RADIUS} from '../styles/theme';
import {UserContext} from '../context';
import BottomTabBar from '../components/common/BottomTabBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '42';

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const {authState, signOut} = useContext(UserContext);

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

  // Handle legal links
  const handleLegalLink = (_url: string) => {
    // In a real app, we would open the appropriate screen or web link
    Alert.alert('Coming Soon', 'This feature is not yet implemented.');
  };

  // Handle support link
  const handleSupportPress = () => {
    Linking.openURL('mailto:support@treadtrail.com');
  };

  // Handle navigation to workouts screen
  const handleWorkoutsPress = () => {
    navigation.navigate('WorkoutLibrary');
  };

  // Handle navigation to profile screen
  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

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
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signInText}>Sign In / Create Account</Text>
              </TouchableOpacity>
            )}
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

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => handleLegalLink('licenses')}>
              <Text style={styles.itemLabel}>Licenses</Text>
              <Text style={styles.chevron}>→</Text>
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

      {/* Use the shared BottomTabBar component */}
      <BottomTabBar activeTab="Settings" />
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
    borderBottomColor: COLORS.lightGray,
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
});

export default SettingsScreen;
