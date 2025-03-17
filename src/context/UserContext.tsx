import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, PaceSetting, UserPreferences, AuthState, User } from '../types';
import 'react-native-get-random-values'; 
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

// Default pace settings
const DEFAULT_PACE_SETTINGS = {
  recovery: { speed: 3.0, incline: 1.0 },
  base: { speed: 5.0, incline: 1.0 },
  run: { speed: 7.0, incline: 1.0 },
  sprint: { speed: 9.0, incline: 1.0 },
};

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  units: 'imperial',
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
  updateProfile: (name: string) => Promise<void>;
  updatePaceSetting: (paceType: keyof typeof DEFAULT_PACE_SETTINGS, setting: PaceSetting) => Promise<void>;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<any>;
  resetToDefault: () => Promise<void>;
  // Add the saveSettings function to allow direct saving
  saveSettings: (settings: UserSettings) => Promise<boolean>;
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
  updateProfile: async () => {},
  updatePaceSetting: async () => {},
  updatePreference: async () => {},
  resetToDefault: async () => {},
  saveSettings: async () => false,
});

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize settings and auth state when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Load auth state from storage
        const storedAuthState = await AsyncStorage.getItem(AUTH_STATE_KEY);
        let loadedAuthState = DEFAULT_AUTH_STATE;
        
        if (storedAuthState) {
          loadedAuthState = JSON.parse(storedAuthState);
          setAuthState(loadedAuthState);
        }
        
        // Try to load user-specific settings if authenticated
        let settingsToLoad = null;
        if (loadedAuthState.isAuthenticated && loadedAuthState.user?.id) {
          console.log(`[DEBUG-INIT] Checking for user-specific settings for ${loadedAuthState.user.id}`);
          const userKey = getUserSettingsKey(loadedAuthState.user.id);
          const userSpecificSettings = await AsyncStorage.getItem(userKey);
          
          if (userSpecificSettings) {
            console.log(`[DEBUG-INIT] Found user-specific settings for ${loadedAuthState.user.id}`);
            settingsToLoad = JSON.parse(userSpecificSettings);
          }
        }
        
        // If no user-specific settings, try global settings
        if (!settingsToLoad) {
          console.log('[DEBUG-INIT] No user-specific settings found, trying global settings');
          const storedSettings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
          
          if (storedSettings) {
            settingsToLoad = JSON.parse(storedSettings);
          }
        }
        
        if (settingsToLoad) {
          // If settings exist, parse and use them
          console.log('[DEBUG-INIT] Loading stored settings');
          if (settingsToLoad.paceSettings) {
            console.log('[DEBUG-INIT] Loaded pace settings:', {
              recovery: settingsToLoad.paceSettings.recovery?.speed,
              base: settingsToLoad.paceSettings.base?.speed,
              run: settingsToLoad.paceSettings.run?.speed,
              sprint: settingsToLoad.paceSettings.sprint?.speed
            });
          }
          setUserSettings(settingsToLoad);
        } else {
          // Otherwise create default settings
          console.log('[DEBUG-INIT] No settings found, creating defaults');
          const now = new Date().toISOString();
          const defaultSettings: UserSettings = {
            profile: {
              name: '',
              dateCreated: now,
              lastActive: now,
            },
            paceSettings: DEFAULT_PACE_SETTINGS,
            preferences: DEFAULT_PREFERENCES,
          };
          
          // Save default settings to storage
          await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(defaultSettings));
          setUserSettings(defaultSettings);
        }
      } catch (err) {
        setError('Failed to initialize user settings');
        console.error('Error initializing user settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Save settings to storage whenever they change
  const saveSettings = async (settings: UserSettings) => {
    try {
      console.log('[DEBUG-CONTEXT] Saving settings to AsyncStorage');
      
      // Always save to global settings
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
      
      // If user is logged in, also save user-specific settings
      if (authState.isAuthenticated && authState.user?.id) {
        const userKey = getUserSettingsKey(authState.user.id);
        console.log(`[DEBUG-CONTEXT] Saving user-specific settings for ${authState.user.id}`);
        await AsyncStorage.setItem(userKey, JSON.stringify(settings));
      }
      
      // Important: Update the React state with the new settings
      console.log('[DEBUG-CONTEXT] Updating userSettings state');
      setUserSettings({...settings});
      
      console.log('[DEBUG-CONTEXT] Save complete');
      return true;
    } catch (err) {
      setError('Failed to save user settings');
      console.error('Error saving user settings:', err);
      return false;
    }
  };

  // Save auth state to storage
  const saveAuthState = async (state: AuthState) => {
    try {
      await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state));
    } catch (err) {
      setError('Failed to save authentication state');
      console.error('Error saving authentication state:', err);
    }
  };

  // Sign up a new user
  const signUp = async (name: string, email: string, password: string) => {
    try {
      // For MVP, we'll store credentials in AsyncStorage
      // In a real app, this would involve a backend API call
      const userId = uuidv4();
      const now = new Date().toISOString();
      
      // Create a simple token (in a real app, this would be JWT from server)
      const token = uuidv4();
      
      // Create user object
      const user: User = {
        id: userId,
        name,
        email,
        authMethod: 'email',
      };
      
      // Store user credentials (this is simplified for MVP)
      await AsyncStorage.setItem(`treadtrail_user_${email}`, JSON.stringify({
        id: userId,
        email,
        password, // In a real app, this would be hashed
        name,
      }));
      
      // Update auth state
      const newAuthState: AuthState = {
        isAuthenticated: true,
        user,
        token,
      };
      
      setAuthState(newAuthState);
      await saveAuthState(newAuthState);
      
      // Update user settings with the name
      if (userSettings) {
        const updatedSettings = {
          ...userSettings,
          profile: {
            ...userSettings.profile,
            name,
            lastActive: now,
          },
        };
        
        setUserSettings(updatedSettings);
        await saveSettings(updatedSettings);
      }
    } catch (err) {
      setError('Failed to sign up');
      console.error('Error signing up:', err);
      throw err;
    }
  };

  // Sign in an existing user
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // Retrieve stored user credentials
      const storedUser = await AsyncStorage.getItem(`treadtrail_user_${email}`);
      
      if (!storedUser) {
        setError('User not found');
        return false;
      }
      
      const userData = JSON.parse(storedUser);
      
      // Check password (in a real app, this would involve proper password verification)
      if (userData.password !== password) {
        setError('Invalid password');
        return false;
      }
      
      // Create a simple token
      const token = uuidv4();
      
      // Create user object
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        authMethod: 'email',
      };
      
      // Update auth state
      const newAuthState: AuthState = {
        isAuthenticated: true,
        user,
        token,
      };
      
      setAuthState(newAuthState);
      await saveAuthState(newAuthState);
      
      // Load user-specific settings if they exist
      const userKey = getUserSettingsKey(userData.id);
      const userSpecificSettings = await AsyncStorage.getItem(userKey);
      
      if (userSpecificSettings) {
        // Use user's previously saved settings
        const parsedUserSettings = JSON.parse(userSpecificSettings);
        setUserSettings(parsedUserSettings);
      } else if (userSettings) {
        // Otherwise update current settings with user info
        const now = new Date().toISOString();
        const updatedSettings = {
          ...userSettings,
          profile: {
            ...userSettings.profile,
            name: userData.name,
            lastActive: now,
          },
        };
        
        // Save settings to both global and user-specific storage
        setUserSettings(updatedSettings);
        await saveSettings(updatedSettings);
      }
      
      return true;
    } catch (err) {
      setError('Failed to sign in');
      console.error('Error signing in:', err);
      return false;
    }
  };

  // Sign in with Apple using Expo's Apple Authentication
  const signInWithApple = async (): Promise<boolean> => {
    try {
      // Check if we're on iOS
      if (Platform.OS !== 'ios') {
        setError('Apple Sign In is only available on iOS devices');
        return false;
      }

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        setError('Apple Authentication is not available on this device');
        return false;
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Extract user information
      const appleUserId = credential.user;
      const userEmail = credential.email || `apple_${appleUserId}@treadtrail.app`;
      
      // Get name information
      let userName = 'Apple User';
      if (credential.fullName) {
        userName = credential.fullName.givenName || '';
        if (credential.fullName.familyName) {
          userName += ` ${credential.fullName.familyName}`;
        }
        
        // If no name was provided, use a default
        if (!userName.trim()) {
          userName = 'Apple User';
        }
      }
      
      // Store Apple user in AsyncStorage for future sign-ins
      const appleUserKey = `treadtrail_apple_user_${appleUserId}`;
      await AsyncStorage.setItem(appleUserKey, JSON.stringify({
        id: appleUserId,
        email: userEmail,
        name: userName,
      }));
      
      // Create user object
      const user: User = {
        id: appleUserId,
        name: userName,
        email: userEmail,
        authMethod: 'apple',
      };
      
      // Use identity token as auth token
      const token = credential.identityToken || uuidv4();
      
      // Update auth state
      const newAuthState: AuthState = {
        isAuthenticated: true,
        user,
        token,
      };
      
      setAuthState(newAuthState);
      await saveAuthState(newAuthState);
      
      // Update user settings
      if (userSettings) {
        const now = new Date().toISOString();
        const updatedSettings = {
          ...userSettings,
          profile: {
            ...userSettings.profile,
            name: userName,
            lastActive: now,
          },
        };
        
        setUserSettings(updatedSettings);
        await saveSettings(updatedSettings);
      }
      
      return true;
    } catch (error: any) {
      // Handle specific error cases
      if (error.code === 'ERR_CANCELED') {
        setError('Apple Sign In was canceled by the user');
      } else if (error.code === 'ERR_FAILED') {
        setError('Apple Sign In failed');
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        setError('Apple Sign In response was invalid');
      } else {
        setError('Failed to sign in with Apple');
      }
      console.error('Error signing in with Apple:', error);
      return false;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Save current user-specific settings before logout
      if (authState.isAuthenticated && authState.user?.id && userSettings) {
        const userId = authState.user.id;
        console.log(`[DEBUG-SIGNOUT] Preserving settings for user ${userId}`);
        const userKey = getUserSettingsKey(userId);
        await AsyncStorage.setItem(userKey, JSON.stringify(userSettings));
      }
      
      // Keep the current pace settings
      const currentPaceSettings = userSettings?.paceSettings || DEFAULT_PACE_SETTINGS;
      
      // Reset auth state
      setAuthState(DEFAULT_AUTH_STATE);
      await saveAuthState(DEFAULT_AUTH_STATE);
      
      // Create new settings object but preserve pace settings
      if (userSettings) {
        const defaultSettings = getDefaultSettings();
        const updatedSettings = {
          ...defaultSettings,
          paceSettings: currentPaceSettings, // Keep the current pace settings
        };
        
        console.log('[DEBUG-SIGNOUT] Setting user settings with preserved pace values');
        setUserSettings(updatedSettings);
        await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updatedSettings));
      }
    } catch (err) {
      setError('Failed to sign out');
      console.error('Error signing out:', err);
    }
  };

  // Update user profile
  const updateProfile = async (name: string) => {
    if (!userSettings) return;

    try {
      const now = new Date().toISOString();
      const updatedSettings = {
        ...userSettings,
        profile: {
          ...userSettings.profile,
          name,
          lastActive: now,
        },
      };
      
      setUserSettings(updatedSettings);
      await saveSettings(updatedSettings);
      
      // If user is authenticated, update the user object in auth state
      if (authState.isAuthenticated && authState.user) {
        const updatedAuthState = {
          ...authState,
          user: {
            ...authState.user,
            name,
          },
        };
        
        setAuthState(updatedAuthState);
        await saveAuthState(updatedAuthState);
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  // Update pace setting
  const updatePaceSetting = async (
    paceType: keyof typeof DEFAULT_PACE_SETTINGS,
    setting: PaceSetting
  ) => {
    if (!userSettings) return;

    try {
      const updatedSettings = {
        ...userSettings,
        paceSettings: {
          ...userSettings.paceSettings,
          [paceType]: setting,
        },
      };
      
      setUserSettings(updatedSettings);
      await saveSettings(updatedSettings);
    } catch (err) {
      setError(`Failed to update ${paceType} pace setting`);
      console.error(`Error updating ${paceType} pace setting:`, err);
    }
  };

  // Update a single preference
  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!userSettings) return;

    try {
      // Create a deep copy of the updated settings to avoid reference issues
      const updatedSettings = {
        ...userSettings,
        preferences: {
          ...userSettings.preferences,
          [key]: value,
        },
      };
      
      // Save to AsyncStorage first to ensure it persists
      await saveSettings(updatedSettings);
      
      // Then update the state
      setUserSettings(updatedSettings);
      
      return updatedSettings; // Return the updated settings for immediate use
    } catch (err) {
      setError(`Failed to update ${String(key)} preference`);
      console.error(`Error updating ${String(key)} preference:`, err);
      throw err; // Re-throw to allow caller to handle error
    }
  };

  // Reset to default settings
  const resetToDefault = async () => {
    try {
      const now = new Date().toISOString();
      const defaultSettings: UserSettings = {
        profile: {
          name: userSettings?.profile.name || '',
          dateCreated: userSettings?.profile.dateCreated || now,
          lastActive: now,
        },
        paceSettings: DEFAULT_PACE_SETTINGS,
        preferences: DEFAULT_PREFERENCES,
      };
      
      setUserSettings(defaultSettings);
      await saveSettings(defaultSettings);
    } catch (err) {
      setError('Failed to reset settings to default');
      console.error('Error resetting settings to default:', err);
    }
  };

  // Context value
  const value = {
    userSettings,
    isLoading,
    error,
    authState,
    signUp,
    signIn,
    signInWithApple,
    signOut,
    updateProfile,
    updatePaceSetting,
    updatePreference,
    resetToDefault,
    saveSettings, // Export the saveSettings function
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Helper function to get default settings
const getDefaultSettings = (): UserSettings => {
  const now = new Date().toISOString();
  return {
    profile: {
      name: '',
      dateCreated: now,
      lastActive: now,
    },
    paceSettings: DEFAULT_PACE_SETTINGS,
    preferences: DEFAULT_PREFERENCES,
  };
};