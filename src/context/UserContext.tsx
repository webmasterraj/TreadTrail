import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, PaceSetting, UserPreferences, AuthState, User } from '../types';
import 'react-native-get-random-values'; 
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { SubscriptionContext } from './SubscriptionContext';

// Debug flag - set to false to disable debug logs
const DEBUG_USER_CONTEXT = false;

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
  // Add preferences directly to the context
  preferences: UserPreferences;
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
  preferences: DEFAULT_PREFERENCES,
});

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Load auth state from storage
        const storedAuthState = await AsyncStorage.getItem(AUTH_STATE_KEY);
        let loadedAuthState = DEFAULT_AUTH_STATE;
        
        if (storedAuthState) {
          loadedAuthState = JSON.parse(storedAuthState);
          setAuthState(loadedAuthState);
          
          if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] Loaded auth state, isAuthenticated:', loadedAuthState.isAuthenticated);
          }
        } else if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] No stored auth state found');
        }
        
        // Try to load user-specific settings if authenticated
        let settingsToLoad = null;
        if (loadedAuthState.isAuthenticated && loadedAuthState.user?.id) {
          if (DEBUG_USER_CONTEXT) {
            console.log(`[DEBUG-USER-CONTEXT] Checking for user-specific settings for ${loadedAuthState.user.id}`);
          }
          
          const userKey = getUserSettingsKey(loadedAuthState.user.id);
          const userSpecificSettings = await AsyncStorage.getItem(userKey);
          
          if (userSpecificSettings) {
            if (DEBUG_USER_CONTEXT) {
              console.log(`[DEBUG-USER-CONTEXT] Found user-specific settings for ${loadedAuthState.user.id}`);
            }
            
            settingsToLoad = JSON.parse(userSpecificSettings);
            
            if (DEBUG_USER_CONTEXT) {
              console.log('[DEBUG-USER-CONTEXT] User settings structure:', {
                hasProfile: !!settingsToLoad.profile,
                hasPaceSettings: !!settingsToLoad.paceSettings,
                hasPreferences: !!settingsToLoad.preferences,
              });
              
              if (settingsToLoad.preferences) {
                console.log('[DEBUG-USER-CONTEXT] User preferences:', settingsToLoad.preferences);
              }
            }
          } else if (DEBUG_USER_CONTEXT) {
            console.log(`[DEBUG-USER-CONTEXT] No user-specific settings found for ${loadedAuthState.user.id}`);
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
              console.log('[DEBUG-USER-CONTEXT] Global settings structure:', {
                hasProfile: !!settingsToLoad.profile,
                hasPaceSettings: !!settingsToLoad.paceSettings,
                hasPreferences: !!settingsToLoad.preferences,
              });
              
              if (settingsToLoad.preferences) {
                console.log('[DEBUG-USER-CONTEXT] Global preferences:', settingsToLoad.preferences);
              }
            }
          } else if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] No global settings found');
          }
        }
        
        if (settingsToLoad) {
          // If settings exist, parse and use them
          if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] Loading stored settings');
          }
          
          if (settingsToLoad.paceSettings) {
            if (DEBUG_USER_CONTEXT) {
              console.log('[DEBUG-USER-CONTEXT] Loaded pace settings:', {
                recovery: settingsToLoad.paceSettings.recovery?.speed,
                base: settingsToLoad.paceSettings.base?.speed,
                run: settingsToLoad.paceSettings.run?.speed,
                sprint: settingsToLoad.paceSettings.sprint?.speed
              });
            }
          } else if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] No pace settings found in loaded settings');
          }
          
          setUserSettings(settingsToLoad);
          
          if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] User settings set to state');
          }
        } else {
          // Otherwise create default settings
          if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] No settings found, creating defaults');
          }
          
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
          
          if (DEBUG_USER_CONTEXT) {
            console.log('[DEBUG-USER-CONTEXT] Default settings created and saved');
          }
        }
      } catch (err) {
        setError('Failed to initialize user settings');
        console.error('[DEBUG-USER-CONTEXT] Error initializing user settings:', err);
      } finally {
        setIsLoading(false);
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] Initialization complete, isLoading set to false');
        }
      }
    };

    initialize();
  }, []);

  // Save settings to storage whenever they change
  const saveSettings = async (settings: UserSettings) => {
    try {
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] saveSettings called');
        console.log('[DEBUG-USER-CONTEXT] Settings to save:', {
          hasProfile: !!settings.profile,
          hasPaceSettings: !!settings.paceSettings,
          hasPreferences: !!settings.preferences,
        });
        
        if (settings.preferences) {
          console.log('[DEBUG-USER-CONTEXT] Preferences to save:', settings.preferences);
        } else {
          console.log('[DEBUG-USER-CONTEXT] WARNING: Trying to save settings without preferences!');
        }
      }
      
      // Always save to global settings
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Saved to global settings');
      }
      
      // If user is logged in, also save user-specific settings
      if (authState.isAuthenticated && authState.user?.id) {
        const userKey = getUserSettingsKey(authState.user.id);
        if (DEBUG_USER_CONTEXT) {
          console.log(`[DEBUG-USER-CONTEXT] Saving user-specific settings for ${authState.user.id}`);
        }
        await AsyncStorage.setItem(userKey, JSON.stringify(settings));
        
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-USER-CONTEXT] Saved to user-specific settings');
        }
      }
      
      // Important: Update the React state with the new settings
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Updating userSettings state');
      }
      setUserSettings({...settings});
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Save complete');
      }
      return true;
    } catch (err) {
      setError('Failed to save user settings');
      console.error('[DEBUG-USER-CONTEXT] Error saving user settings:', err);
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
      
      // Start free trial for new users
      await startFreeTrial();
      
      if (DEBUG_USER_CONTEXT) {
        console.log(`[DEBUG-USER-CONTEXT] New user signed up: ${name} (${email})`);
        console.log(`[DEBUG-USER-CONTEXT] Started free trial for new user`);
      }
    } catch (err) {
      console.error('Error signing up:', err);
      setError('Failed to sign up. Please try again.');
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
        if (DEBUG_USER_CONTEXT) {
          console.log(`[DEBUG-SIGNIN] Found user-specific settings for ${userData.id}`);
        }
        // Use user's previously saved settings
        const parsedUserSettings = JSON.parse(userSpecificSettings);
        setUserSettings(parsedUserSettings);
      } else if (userSettings) {
        // Otherwise update current settings with user info
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-SIGNIN] No user-specific settings found, updating current settings with user info');
        }
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
      
      // Check if user should get a free trial (only if they haven't used it before)
      try {
        await startFreeTrial();
        if (DEBUG_USER_CONTEXT) {
          console.log(`[DEBUG-USER-CONTEXT] Checked free trial eligibility for returning user`);
        }
      } catch (err) {
        console.error('Error checking trial eligibility:', err);
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
      
      // Load user-specific settings if they exist
      const userKey = getUserSettingsKey(appleUserId);
      const userSpecificSettings = await AsyncStorage.getItem(userKey);
      
      if (userSpecificSettings) {
        if (DEBUG_USER_CONTEXT) {
          console.log(`[DEBUG-APPLE-SIGNIN] Found user-specific settings for ${appleUserId}`);
        }
        // Use user's previously saved settings
        const parsedUserSettings = JSON.parse(userSpecificSettings);
        setUserSettings(parsedUserSettings);
      }
      
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
        
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-APPLE-SIGNIN] Updating user settings with profile info');
        }
        
        setUserSettings(updatedSettings);
        await saveSettings(updatedSettings);
      }
      
      // Check if user should get a free trial (only if they haven't used it before)
      try {
        await startFreeTrial();
        if (DEBUG_USER_CONTEXT) {
          console.log(`[DEBUG-USER-CONTEXT] Checked free trial eligibility for Apple sign-in user`);
        }
      } catch (err) {
        console.error('Error checking trial eligibility:', err);
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
      
      // Keep the current pace settings and preferences
      const currentPaceSettings = userSettings?.paceSettings || DEFAULT_PACE_SETTINGS;
      const currentPreferences = userSettings?.preferences || DEFAULT_PREFERENCES;
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-SIGNOUT] Preserving user preferences:', currentPreferences);
        console.log('[DEBUG-SIGNOUT] Preserving pace settings:', currentPaceSettings);
      }
      
      // Reset auth state
      setAuthState(DEFAULT_AUTH_STATE);
      await saveAuthState(DEFAULT_AUTH_STATE);
      
      // Create new settings object but preserve pace settings and preferences
      if (userSettings) {
        const defaultSettings = getDefaultSettings();
        const updatedSettings = {
          ...defaultSettings,
          paceSettings: currentPaceSettings, // Keep the current pace settings
          preferences: currentPreferences, // Keep the current preferences
        };
        
        if (DEBUG_USER_CONTEXT) {
          console.log('[DEBUG-SIGNOUT] Setting user settings with preserved values');
          console.log('[DEBUG-SIGNOUT] Updated settings:', {
            hasPaceSettings: !!updatedSettings.paceSettings,
            hasPreferences: !!updatedSettings.preferences,
          });
        }
        
        setUserSettings(updatedSettings);
        await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updatedSettings));
      }
    } catch (err) {
      setError('Failed to sign out');
      console.error('[DEBUG-SIGNOUT] Error signing out:', err);
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
    if (DEBUG_USER_CONTEXT) {
      console.log(`[DEBUG-USER-CONTEXT] updatePreference called for ${String(key)} with value:`, value);
      console.log('[DEBUG-USER-CONTEXT] Current userSettings:', userSettings ? 'exists' : 'null');
      if (userSettings) {
        console.log('[DEBUG-USER-CONTEXT] Current preferences:', userSettings.preferences ? 'exists' : 'undefined');
      }
    }
    
    if (!userSettings) {
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Cannot update preference: userSettings is null');
      }
      return;
    }

    try {
      // Create a deep copy of the updated settings to avoid reference issues
      const updatedSettings = {
        ...userSettings,
        preferences: {
          ...userSettings.preferences,
          [key]: value,
        },
      };
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Created updated settings with new preference value');
        console.log('[DEBUG-USER-CONTEXT] Updated preferences:', updatedSettings.preferences);
      }
      
      // Save to AsyncStorage first to ensure it persists
      await saveSettings(updatedSettings);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Saved updated settings to AsyncStorage');
      }
      
      // Then update the state
      setUserSettings(updatedSettings);
      
      if (DEBUG_USER_CONTEXT) {
        console.log('[DEBUG-USER-CONTEXT] Updated userSettings state');
      }
      
      return updatedSettings; // Return the updated settings for immediate use
    } catch (err) {
      setError(`Failed to update ${String(key)} preference`);
      console.error(`[DEBUG-USER-CONTEXT] Error updating ${String(key)} preference:`, err);
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
    // Add preferences directly to the context value to ensure it's always defined
    preferences: userSettings?.preferences || DEFAULT_PREFERENCES,
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