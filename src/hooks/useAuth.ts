import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  selectAuthState,
  selectIsAuthenticated,
  setAuthState,
  resetUserState,
  syncUserSettings,
  loadUserSettings
} from '../redux/slices/userSlice';
import { AuthState, User } from '../types';
import * as AppleAuthentication from 'expo-apple-authentication';
import supabase from '../api/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform, NativeModules } from 'react-native';

// Storage keys
const USER_SETTINGS_KEY_PREFIX = 'treadtrail_user_settings_';
const USER_SETTINGS_KEY = 'treadtrail_user_settings';
const WORKOUT_HISTORY_KEY = 'treadtrail_workout_history';
const FAVORITE_WORKOUTS_KEY = 'treadtrail_favorite_workouts';
const STATS_KEY = 'treadtrail_stats';
const PENDING_SYNC_KEY = 'treadtrail_pending_sync';
const AUTH_STATE_KEY = 'treadtrail_auth_state';
const SUBSCRIPTION_KEY = 'treadtrail_subscription';

// Helper to get user-specific storage key
const getUserSettingsKey = (userId: string) => `${USER_SETTINGS_KEY_PREFIX}${userId}`;

// Debug flags
const DEBUG_AUTH = false;

// Debug logging helper
const logDebug = (message: string, ...args: any[]) => {
  if (DEBUG_AUTH) console.log(`[DEBUG-AUTH] ${message}`, ...args);
};

/**
 * Custom hook for authentication
 * This replaces the auth functions from UserContext with Redux-based state management
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const authState = useAppSelector(selectAuthState);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // Sign in with Apple function
  const signInWithApple = useCallback(async (): Promise<boolean> => {
    try {
      logDebug('Starting Apple sign in');
      
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('Apple Authentication is not available on this device');
      }
      
      // Request sign in with Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      logDebug('Apple authentication successful, signing in with Supabase');
      
      // Sign in with Supabase using the Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken || '',
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Login successful but no user returned');
      }
      
      // Update user metadata if we have a name from Apple
      if (credential.fullName?.givenName) {
        const fullName = `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim();
        
        if (fullName) {
          await supabase.auth.updateUser({
            data: { name: fullName }
          });
          
          logDebug(`Updated user name to: ${fullName}`);
        }
      }
      
      // Create user object
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        authMethod: 'apple',
      };
      
      // Create new auth state
      const newAuthState: AuthState = {
        isAuthenticated: true,
        user,
        token: data.session?.access_token || null,
      };
      
      logDebug('Creating auth state and checking for local settings');
      
      // Check for existing local settings first to tell if user is new
      const userKey = getUserSettingsKey(user.id);
      const localSettingsJson = await AsyncStorage.getItem(userKey);
      let isNewUser = !localSettingsJson;
      
      if (localSettingsJson) {
        logDebug('Found existing local settings for user');
      } else {
        logDebug('No local settings found for user. Treating as new user.');
      }
      
      // Update Redux state with new auth state
      await dispatch(setAuthState(newAuthState)).unwrap();
      
      // Load user settings - this will pull from backend if no local settings exist
      await dispatch(loadUserSettings()).unwrap();
      
      // If this is a new user, we need to update the unit system based on locale
      if (isNewUser) {
        logDebug('New user, updating unit system based on locale');
        
        const localeBasedUnitSystem = getDefaultUnitSystem();
        
        logDebug(`Setting locale-based unit system: ${localeBasedUnitSystem}`);
        
        // Update preferences with locale-based unit system and push to backend
        await dispatch(syncUserSettings({
          preferences: {
            units: localeBasedUnitSystem
          }
        })).unwrap();
        
        logDebug('User settings initialized with locale-based unit system and synced with backend');
      } else {
        logDebug('Using existing local settings as source of truth');
      }
      
      logDebug('Apple sign in successful');
      
      return true;
    } catch (err: any) {
      // Don't treat cancellation as an error
      if (err.code === 'ERR_CANCELED') {
        logDebug('Apple sign in was cancelled');
        return false;
      }
      
      console.error('Error signing in with Apple:', err);
      return false;
    }
  }, [dispatch]);

  // Get default unit system based on device locale
  const getDefaultUnitSystem = (): 'imperial' | 'metric' => {
    // Countries that use imperial system (US, UK, Liberia, Myanmar)
    const imperialCountries = ['US', 'GB', 'LR', 'MM'];
    
    // Get device locale
    let countryCode;
    if (Platform.OS === 'ios') {
      countryCode = NativeModules.SettingsManager.settings.AppleLocale?.split('_')[1] || 
                    NativeModules.SettingsManager.settings.AppleLanguages[0]?.split('_')[1];
    } else if (Platform.OS === 'android') {
      countryCode = NativeModules.I18nManager.localeIdentifier?.split('_')[1];
    }
    
    logDebug(`Detected country code: ${countryCode}`);
    
    // Default to metric unless explicitly in an imperial country
    return imperialCountries.includes(countryCode) ? 'imperial' : 'metric';
  };

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      logDebug('Signing out');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Reset user state but keep settings
      dispatch(resetUserState());
      
      logDebug('Sign out successful');
      
      return true;
    } catch (err: any) {
      console.error('Error signing out:', err);
      return false;
    }
  }, [dispatch]);

  // Delete account function
  const deleteAccount = useCallback(async (): Promise<{ success: boolean, error?: string }> => {
    try {
      logDebug('Starting account deletion process');
      
      if (!isAuthenticated || !authState.user) {
        return { success: false, error: 'No authenticated user found' };
      }
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        return { success: false, error: 'No internet connection. Please try again when you are online.' };
      }
      
      // Get the current session for the authorization token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        return { success: false, error: 'No valid session found' };
      }
      
      logDebug('Calling Supabase Edge Function to delete user data');
      
      // 1. Call the Edge Function to delete the user and all associated data from the server
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: authState.user.id }
      });
      
      if (error) {
        console.error('Error calling delete-user function:', error);
        return { success: false, error: error.message || 'Failed to delete account on server' };
      }
      
      logDebug('Server deletion successful, now removing local data');
      
      // 2. Delete local data
      // User settings
      const userKey = getUserSettingsKey(authState.user.id);
      await AsyncStorage.removeItem(userKey);
      
      // Also remove the generic settings key
      await AsyncStorage.removeItem(USER_SETTINGS_KEY);
      
      // Workout data
      await AsyncStorage.removeItem(WORKOUT_HISTORY_KEY);
      await AsyncStorage.removeItem(FAVORITE_WORKOUTS_KEY);
      await AsyncStorage.removeItem(STATS_KEY);
      await AsyncStorage.removeItem(PENDING_SYNC_KEY);
      
      // Auth state
      await AsyncStorage.removeItem(AUTH_STATE_KEY);
      
      // Subscription data
      await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
      
      logDebug('Local data removed, now resetting Redux state');
      
      // Reset Redux state completely (don't preserve settings)
      dispatch(resetUserState(false));
      
      logDebug('Redux state reset, now signing out user');
      
      // 3. Sign out the user
      await signOut();
      
      logDebug('Account deletion completed successfully');
      
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting account:', err);
      return { success: false, error: err.message || 'An unknown error occurred' };
    }
  }, [authState, isAuthenticated, signOut, dispatch]);

  return {
    authState,
    isAuthenticated,
    signInWithApple,
    signOut,
    deleteAccount,
  };
};
