import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, PaceSetting, UserPreferences, AuthState, User } from '../types';
import 'react-native-get-random-values'; 
import { v4 as uuidv4 } from 'uuid';
import { Platform, NativeModules } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { SubscriptionContext } from './SubscriptionContext';
import supabase from '../api/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Debug flag - set to true to enable debug logs
const DEBUG_USER_CONTEXT = true;

// Default pace settings
const DEFAULT_PACE_SETTINGS = {
  recovery: { speed: 3.0, incline: 1.0 },
  base: { speed: 5.0, incline: 1.0 },
  run: { speed: 7.0, incline: 1.0 },
  sprint: { speed: 9.0, incline: 1.0 },
};

// Function to determine if the user's locale uses imperial units
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
  
  console.log('Detected country code:', countryCode);
  
  // Default to metric unless explicitly in an imperial country
  return imperialCountries.includes(countryCode) ? 'imperial' : 'metric';
};

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  units: getDefaultUnitSystem(),
  darkMode: true,
  enableAudioCues: true, // Enable audio cues by default
};

// Storage keys - avoid using @ symbol which might cause issues with Expo's storage
const USER_SETTINGS_KEY = 'treadtrail_user_settings';
const AUTH_STATE_KEY = 'treadtrail_auth_state';
const USER_SETTINGS_KEY_PREFIX = 'treadtrail_user_settings_';

// Helper to get user-specific storage key
const getUserSettingsKey = (userId: string) => `${USER_SETTINGS_KEY_PREFIX}${userId}`;

// Default auth state
const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

// Context type definition
interface UserContextType {
  userSettings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  authState: AuthState;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, weight: number | null) => Promise<{ success: boolean; error?: string }>;
  updatePaceSetting: (paceType: keyof typeof DEFAULT_PACE_SETTINGS, setting: PaceSetting) => Promise<void>;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<UserPreferences>;
  resetToDefault: () => Promise<void>;
  saveSettings: (settings: UserSettings) => Promise<boolean>;
  preferences: UserPreferences;
  updateWeight: (weight: number) => Promise<void>;
}

// Create the context
export const UserContext = createContext<UserContextType>({
  userSettings: null,
  isLoading: true,
  error: null,
  authState: DEFAULT_AUTH_STATE,
  signUp: async () => {},
  signIn: async () => false,
  signInWithApple: async () => false,
  signOut: async () => {},
  updateProfile: async () => ({ success: false }),
  updatePaceSetting: async () => {},
  updatePreference: async () => DEFAULT_PREFERENCES,
  resetToDefault: async () => {},
  saveSettings: async () => false,
  preferences: DEFAULT_PREFERENCES,
  updateWeight: async () => {},
});

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>('');

  // Get subscription context for trial functionality
  const { startFreeTrial } = useContext(SubscriptionContext);

  // Initialize settings and auth state when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] Starting initialization');
        }
        
        setIsLoading(true);
        
        // Check for existing Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[DEBUG-USER-CONTEXT] Error getting session:', sessionError);
          throw sessionError;
        }
        
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] Supabase session check:', session ? 'Found session' : 'No session');
        }
        
        // If we have a Supabase session, use it
        if (session) {
          await handleSuccessfulAuth(session);
        } else {
          // Otherwise, try to load from AsyncStorage as a fallback
          const storedAuthState = await AsyncStorage.getItem(AUTH_STATE_KEY);
          let loadedAuthState = DEFAULT_AUTH_STATE;
          
          if (storedAuthState) {
            loadedAuthState = JSON.parse(storedAuthState);
            setAuthState(loadedAuthState);
            
            if (DEBUG_USER_CONTEXT) {
              console.log('[DEBUG-USER-CONTEXT] Loaded auth state from storage, isAuthenticated:', loadedAuthState.isAuthenticated);
            }
          } else if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] No stored auth state found');
          }
        }
        
        // Load user settings based on auth state
        await loadUserSettings();
        
      } catch (err) {
        console.error('Error initializing user context:', err);
        setError('Failed to initialize user settings');
      } finally {
        setIsLoading(false);
      }
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (DEBUG_USER_CONTEXT) {
          console.log(`[DEBUG-USER-CONTEXT] Auth state changed: ${event}`, session ? 'Has session' : 'No session');
        }
        
        if (event === 'SIGNED_IN' && session) {
          await handleSuccessfulAuth(session);
        } else if (event === 'SIGNED_OUT') {
          // Keep pace settings and preferences when signing out
          const currentSettings = userSettings;
          
          // Reset auth state
          setAuthState(DEFAULT_AUTH_STATE);
          await AsyncStorage.removeItem(AUTH_STATE_KEY);
          
          // Create new settings with preserved pace settings and preferences
          if (currentSettings) {
            const newSettings: UserSettings = {
              profile: { 
                name: 'Guest',
                email: '',
                id: uuidv4() 
              },
              paceSettings: currentSettings.paceSettings,
              preferences: currentSettings.preferences,
              weight: currentSettings.weight,
            };
            
            setUserSettings(newSettings);
            await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(newSettings));
            
            if (DEBUG_USER_CONTEXT) {
              console.log('[DEBUG-USER-CONTEXT] Preserved pace settings and preferences after sign out');
            }
          }
        }
      }
    );

    initialize();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to handle successful authentication
  const handleSuccessfulAuth = async (session: Session) => {
    if (!session.user) {
      console.error('[DEBUG-USER-CONTEXT] Session has no user');
      return;
    }
    
    const user: User = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      authMethod: session.user.app_metadata?.provider === 'apple' ? 'apple' : 'email',
    };
    
    const newAuthState: AuthState = {
      isAuthenticated: true,
      user,
      token: session.access_token,
    };
    
    // Update auth state
    setAuthState(newAuthState);
    await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(newAuthState));
    
    if (DEBUG_USER_CONTEXT) {
      console.log('[DEBUG-USER-CONTEXT] Updated auth state with Supabase session');
    }
    
    // Fetch user data from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('[DEBUG-USER-CONTEXT] Error fetching user data:', userError);
    }
    
    // If user doesn't exist in our database yet, create them
    if (!userData) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.name,
        });
      
      if (insertError) {
        console.error('[DEBUG-USER-CONTEXT] Error creating user record:', insertError);
      } else if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Created new user record in database');
      }
    }
    
    // Fetch user settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('[DEBUG-USER-CONTEXT] Error fetching user settings:', settingsError);
    }
    
    // Load or create user settings
    await loadUserSettings();
  };

  // Load user settings based on current auth state
  const loadUserSettings = async () => {
    try {
      let settingsToLoad = null;
      
      // Try to load user-specific settings if authenticated
      if (authState.isAuthenticated && authState.user?.id) {
        if (DEBUG_USER_CONTEXT) {
          console.log(`[DEBUG-USER-CONTEXT] Loading settings for authenticated user ${authState.user.id}`);
        }
        
        // First try to get from Supabase
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('id', authState.user.id)
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('[DEBUG-USER-CONTEXT] Error fetching user settings from Supabase:', settingsError);
        }
        
        if (settingsData) {
          if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] Found user settings in Supabase');
          }
          
          // Convert from database format to app format
          settingsToLoad = {
            profile: {
              id: authState.user.id,
              name: authState.user.name,
              email: authState.user.email,
            },
            paceSettings: settingsData.pace_settings || DEFAULT_PACE_SETTINGS,
            preferences: settingsData.preferences || DEFAULT_PREFERENCES,
            weight: settingsData.weight || 0, // Default to 0 instead of null
          };
        } else {
          // If not in Supabase, try local storage as fallback
          const userKey = getUserSettingsKey(authState.user.id);
          const userSpecificSettings = await AsyncStorage.getItem(userKey);
          
          if (userSpecificSettings) {
            if (DEBUG_USER_CONTEXT) {
              console.log(`[DEBUG-USER-CONTEXT] Found user-specific settings in local storage for ${authState.user.id}`);
            }
            
            settingsToLoad = JSON.parse(userSpecificSettings);
            
            // Sync to Supabase
            const { error: insertError } = await supabase
              .from('user_settings')
              .insert({
                id: authState.user.id,
                weight: settingsToLoad.weight,
                pace_settings: settingsToLoad.paceSettings,
                preferences: settingsToLoad.preferences,
              });
            
            if (insertError) {
              console.error('[DEBUG-USER-CONTEXT] Error syncing local settings to Supabase:', insertError);
            } else if (DEBUG_USER_CONTEXT) {
              console.log('[DEBUG-USER-CONTEXT] Synced local settings to Supabase');
            }
          } else if (DEBUG_USER_CONTEXT) {
            console.log(`[DEBUG-USER-CONTEXT] No user-specific settings found for ${authState.user.id}`);
          }
        }
      }
      
      // If no user-specific settings, try global settings
      if (!settingsToLoad) {
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] No user-specific settings found, trying global settings');
        }
        
        const storedSettings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
        
        if (storedSettings) {
          settingsToLoad = JSON.parse(storedSettings);
          
          if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] Found global settings');
          }
        } else if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] No global settings found');
        }
      }
      
      // If still no settings, create default
      if (!settingsToLoad) {
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] No settings found, creating defaults');
        }
        
        settingsToLoad = getDefaultSettings();
        
        // Save default settings
        await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settingsToLoad));
        
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] Saved default settings');
        }
      }
      
      // Ensure preferences are always defined
      if (!settingsToLoad.preferences) {
        settingsToLoad.preferences = DEFAULT_PREFERENCES;
        
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] Added missing preferences to settings');
        }
      }
      
      // Set the loaded settings
      setUserSettings(settingsToLoad);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] User settings loaded successfully');
      }
      
    } catch (err) {
      console.error('Error loading user settings:', err);
      setError('Failed to load user settings');
    }
  };

  // Helper function to save settings to both AsyncStorage and Supabase
  const saveSettingsToStorage = async (settings: UserSettings): Promise<boolean> => {
    try {
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Saving settings');
      }
      
      // Always save to global storage as fallback
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
      
      // If authenticated, save to user-specific storage and Supabase
      if (authState.isAuthenticated && authState.user?.id) {
        const userKey = getUserSettingsKey(authState.user.id);
        await AsyncStorage.setItem(userKey, JSON.stringify(settings));
        
        // Get the weight value
        const weightValue = settings.weight || 0;
        
        // Save to Supabase
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            id: authState.user.id,
            weight: weightValue,
            pace_settings: settings.paceSettings,
            preferences: settings.preferences,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        
        if (error) {
          console.error('[DEBUG-USER-CONTEXT] Error saving settings to Supabase:', error);
          return false;
        }
        
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] Saved settings to Supabase');
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
      return false;
    }
  };

  // Update user settings in Supabase
  const updateUserSettingsInSupabase = async (settings: UserSettings) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        console.error('[DEBUG-USER-CONTEXT] Cannot update settings: No authenticated user');
        return { success: false, error: 'Not authenticated' };
      }
      
      // Check if user settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_settings')
          .update({
            pace_settings: settings.paceSettings,
            preferences: settings.preferences,
            weight: settings.weight || 0, // Use 0 as default if weight is null
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (error) {
          console.error('[DEBUG-USER-CONTEXT] Error updating settings:', error);
          return { success: false, error: error.message };
        }
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            pace_settings: settings.paceSettings,
            preferences: settings.preferences,
            weight: settings.weight || 0, // Use 0 as default if weight is null
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('[DEBUG-USER-CONTEXT] Error inserting settings:', error);
          return { success: false, error: error.message };
        }
      }
      
      // Update user profile
      const { error: profileError } = await supabase.auth.updateUser({
        data: {
          name: settings.profile.name || 'User', // Use 'User' as default if name is null
          weight: settings.weight || 0 // Use 0 as default if weight is null
        }
      });
      
      if (profileError) {
        console.error('[DEBUG-USER-CONTEXT] Error updating user profile:', profileError);
        return { success: false, error: profileError.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('[DEBUG-USER-CONTEXT] Error in updateUserSettingsInSupabase:', error);
      return { success: false, error: 'Unknown error' };
    }
  };

  // Update user profile
  const updateUserProfile = async (name: string, weight: number | null) => {
    try {
      // Update local settings first
      if (userSettings) {
        const updatedSettings = {
          ...userSettings,
          profile: {
            ...userSettings.profile,
            name: name || userSettings.profile.name,
          },
          weight: weight !== null ? weight : userSettings.weight,
        };
        
        setUserSettings(updatedSettings);
        await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updatedSettings));
        
        // If authenticated, update in Supabase as well
        if (authState.isAuthenticated && authState.user) {
          await updateUserSettingsInSupabase(updatedSettings);
        }
        
        return { success: true };
      }
      
      return { success: false, error: 'No user settings found' };
    } catch (error) {
      console.error('[DEBUG-USER-CONTEXT] Error updating user profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  // Sign up function
  const signUp = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      if (DEBUG_USER_CONTEXT) {
        console.log(`[DEBUG-USER-CONTEXT] Signing up user: ${email}`);
      }
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Signup successful but no user returned');
      }
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Signup successful');
      }
      
      // Session will be handled by the auth state change listener
      
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError('');
      
      if (DEBUG_USER_CONTEXT) {
        console.log(`[DEBUG-USER-CONTEXT] Signing in user: ${email}`);
      }
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Login successful but no user returned');
      }
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Login successful');
      }
      
      // Session will be handled by the auth state change listener
      
      return true;
    } catch (err: any) {
      console.error('Error signing in:', err);
      setError(err.message || 'Failed to sign in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Apple function
  const signInWithApple = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError('');
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Starting Apple sign in');
      }
      
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
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Apple authentication successful, signing in with Supabase');
      }
      
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
          
          if (DEBUG_USER_CONTEXT) {
            console.log(`[DEBUG-USER-CONTEXT] Updated user name to: ${fullName}`);
          }
        }
      }
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Apple sign in successful');
      }
      
      // Session will be handled by the auth state change listener
      
      return true;
    } catch (err: any) {
      // Don't treat cancellation as an error
      if (err.code === 'ERR_CANCELED') {
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] Apple sign in was cancelled');
        }
        return false;
      }
      
      console.error('Error signing in with Apple:', err);
      setError(err.message || 'Failed to sign in with Apple');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Signing out');
      }
      
      // Keep pace settings and preferences when signing out
      const currentSettings = userSettings;
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Auth state change listener will handle the rest
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Sign out successful');
      }
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Update pace setting function
  const updatePaceSetting = async (paceType: keyof typeof DEFAULT_PACE_SETTINGS, setting: PaceSetting) => {
    try {
      if (!userSettings) {
        throw new Error('No user settings found');
      }
      
      if (DEBUG_USER_CONTEXT) {
        console.log(`[DEBUG-USER-CONTEXT] Updating pace setting for ${paceType}:`, setting);
      }
      
      const updatedSettings = {
        ...userSettings,
        paceSettings: {
          ...userSettings.paceSettings,
          [paceType]: setting
        }
      };
      
      setUserSettings(updatedSettings);
      await saveSettingsToStorage(updatedSettings);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Pace setting updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating pace setting:', err);
      setError(err.message || 'Failed to update pace setting');
    }
  };

  // Update preference function
  const updatePreference = async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    try {
      if (!userSettings) {
        throw new Error('No user settings found');
      }
      
      if (DEBUG_USER_CONTEXT) {
        console.log(`[DEBUG-USER-CONTEXT] Updating preference ${String(key)}:`, value);
      }
      
      const updatedPreferences = {
        ...userSettings.preferences,
        [key]: value
      };
      
      const updatedSettings = {
        ...userSettings,
        preferences: updatedPreferences
      };
      
      setUserSettings(updatedSettings);
      await saveSettingsToStorage(updatedSettings);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Preference updated successfully');
      }
      
      return updatedPreferences;
    } catch (err: any) {
      console.error('Error updating preference:', err);
      setError(err.message || 'Failed to update preference');
      return userSettings?.preferences || DEFAULT_PREFERENCES;
    }
  };

  // Update weight function
  const updateWeight = async (weight: number) => {
    try {
      if (!userSettings) {
        throw new Error('No user settings found');
      }
      
      if (DEBUG_USER_CONTEXT) {
        console.log(`[DEBUG-USER-CONTEXT] Updating weight to: ${weight}`);
      }
      
      const updatedSettings = {
        ...userSettings,
        weight
      };
      
      setUserSettings(updatedSettings);
      await saveSettingsToStorage(updatedSettings);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Weight updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating weight:', err);
      setError(err.message || 'Failed to update weight');
    }
  };

  // Reset to default function
  const resetToDefault = async () => {
    try {
      setIsLoading(true);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Resetting to default settings');
      }
      
      // Create default settings
      const defaultSettings: UserSettings = {
        profile: {
          name: 'Guest',
          dateCreated: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        },
        paceSettings: DEFAULT_PACE_SETTINGS,
        preferences: DEFAULT_PREFERENCES,
        weight: 0, // Default to 0 instead of null
      };
      
      // If authenticated, keep user info
      if (authState.isAuthenticated && authState.user) {
        defaultSettings.profile = {
          ...defaultSettings.profile,
          id: authState.user.id,
          name: authState.user.name,
          email: authState.user.email
        };
      }
      
      setUserSettings(defaultSettings);
      await saveSettingsToStorage(defaultSettings);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Reset to default settings successful');
      }
    } catch (err: any) {
      console.error('Error resetting to default:', err);
      setError('Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct save settings function
  const saveSettings = async (settings: UserSettings): Promise<boolean> => {
    try {
      setUserSettings(settings);
      return await saveSettingsToStorage(settings);
    } catch (err: any) {
      console.error('Error saving settings directly:', err);
      setError('Failed to save settings');
      return false;
    }
  };

  // Helper function to get default settings
  const getDefaultSettings = (): UserSettings => {
    return {
      profile: {
        id: uuidv4(),
        name: 'Guest',
        email: '',
      },
      paceSettings: DEFAULT_PACE_SETTINGS,
      preferences: DEFAULT_PREFERENCES,
      weight: 0, // Default to 0 instead of null
    };
  };

  return (
    <UserContext.Provider
      value={{
        userSettings,
        isLoading,
        error,
        authState,
        signUp,
        signIn,
        signInWithApple,
        signOut,
        updateProfile: updateUserProfile,
        updatePaceSetting,
        updatePreference,
        resetToDefault,
        saveSettings,
        preferences: userSettings?.preferences || DEFAULT_PREFERENCES,
        updateWeight,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};