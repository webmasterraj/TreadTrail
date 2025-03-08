import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, PaceSetting, UserPreferences } from '../types';

// Default pace settings
const DEFAULT_PACE_SETTINGS = {
  recovery: { speed: 3.0, incline: 1.0 },
  base: { speed: 5.0, incline: 1.0 },
  run: { speed: 7.0, incline: 1.0 },
  sprint: { speed: 9.0, incline: 1.0 },
};

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  countdownSound: true,
  units: 'imperial',
  darkMode: true,
};

// Storage key
const USER_SETTINGS_KEY = '@treadtrail:user_settings';

// Context type definition
interface UserContextType {
  userSettings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (name: string) => Promise<void>;
  updatePaceSetting: (paceType: keyof typeof DEFAULT_PACE_SETTINGS, setting: PaceSetting) => Promise<void>;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

// Create the context
export const UserContext = createContext<UserContextType>({
  userSettings: null,
  isLoading: true,
  error: null,
  updateProfile: async () => {},
  updatePaceSetting: async () => {},
  updatePreference: async () => {},
  resetToDefault: async () => {},
});

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize settings when component mounts
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);
        // Try to load settings from storage
        const storedSettings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
        
        if (storedSettings) {
          // If settings exist, parse and use them
          setUserSettings(JSON.parse(storedSettings));
        } else {
          // Otherwise create default settings
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

    initializeSettings();
  }, []);

  // Save settings to storage whenever they change
  const saveSettings = async (settings: UserSettings) => {
    try {
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      setError('Failed to save user settings');
      console.error('Error saving user settings:', err);
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
      const updatedSettings = {
        ...userSettings,
        preferences: {
          ...userSettings.preferences,
          [key]: value,
        },
      };
      
      setUserSettings(updatedSettings);
      await saveSettings(updatedSettings);
    } catch (err) {
      setError(`Failed to update ${String(key)} preference`);
      console.error(`Error updating ${String(key)} preference:`, err);
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
    updateProfile,
    updatePaceSetting,
    updatePreference,
    resetToDefault,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};