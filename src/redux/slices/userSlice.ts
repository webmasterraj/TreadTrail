import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../../api/supabaseClient';
import { 
  UserSettings, 
  UserPreferences, 
  AuthState, 
  User,
  PaceSettings
} from '../../types';

// Debug flags
const DEBUG_USER_SLICE = false;
const DEBUG_PREFIX = '[DEBUG-USER-SLICE]';

// Debug logging helper
const logDebug = (message: string, ...args: any[]) => {
  if (DEBUG_USER_SLICE) {
    if (args.length > 0) {
      console.log(`${DEBUG_PREFIX} ${message}`, ...args);
    } else {
      console.log(`${DEBUG_PREFIX} ${message}`);
    }
  }
};

// Default pace settings
const DEFAULT_PACE_SETTINGS: PaceSettings = {
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
  
  logDebug(`Detected country code: ${countryCode}`);
  
  // Default to metric unless explicitly in an imperial country
  return imperialCountries.includes(countryCode) ? 'imperial' : 'metric';
};

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  units: getDefaultUnitSystem(),
  darkMode: true,
  enableAudioCues: true, // Enable audio cues by default
};

// Storage keys
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

// Helper function to get the appropriate storage key based on user authentication state
const getUserStorageKey = (user: UserState['auth']): string => {
  return user.isAuthenticated && user.user?.id 
    ? getUserSettingsKey(user.user.id) 
    : USER_SETTINGS_KEY;
};

// Helper function to validate and fill in missing settings with defaults
const validateSettings = (settings: UserSettings): UserSettings => {
  // Create a new settings object with defaults for any missing properties
  const result = {
    ...settings,
    paceSettings: settings.paceSettings || DEFAULT_PACE_SETTINGS,
    preferences: settings.preferences || DEFAULT_PREFERENCES,
  };
  
  // Log only once for all changes
  if (!settings.paceSettings || !settings.preferences) {
    logDebug('Added missing default settings');
  }
  
  return result;
};

// Helper function to check network connectivity
const checkNetworkConnectivity = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  // Handle potential null values by defaulting to false
  const isConnected = !!netInfo.isConnected && !!netInfo.isInternetReachable;
  logDebug(`Network connectivity check: ${isConnected ? 'online' : 'offline'}`);
  return isConnected;
};

// Helper function to save settings to local storage and back them up to Supabase if online
const saveAndBackupSettings = async (
  user: UserState,
  updatedSettings: UserSettings,
  logPrefix: string = 'settings'
): Promise<{ settings: UserSettings, hasPendingChanges: boolean }> => {
  // Save to local storage first (source of truth)
  const storageKey = getUserStorageKey(user.auth);
  await AsyncStorage.setItem(storageKey, JSON.stringify(updatedSettings));
  
  logDebug(`Saved updated ${logPrefix} to local storage`);
  
  // Check network connectivity for backing up to Supabase
  const isConnected = await checkNetworkConnectivity();
  
  // If authenticated and online, back up to Supabase
  if (user.auth.isAuthenticated && user.auth.user?.id && isConnected) {
    logDebug(`Backing up ${logPrefix} to Supabase`);
    
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        id: user.auth.user.id,
        pace_settings: updatedSettings.paceSettings,
        preferences: updatedSettings.preferences,
        weight: updatedSettings.weight,
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error(`Error backing up ${logPrefix} to Supabase:`, error);
      return { settings: updatedSettings, hasPendingChanges: true };
    } else {
      logDebug(`Successfully backed up ${logPrefix} to Supabase`);
    }
  } else if (user.auth.isAuthenticated) {
    // If offline but authenticated, mark as having pending changes that need backup
    logDebug(`Offline, marking ${logPrefix} for future backup`);
    return { settings: updatedSettings, hasPendingChanges: true };
  }
  
  return { settings: updatedSettings, hasPendingChanges: false };
};

// State interface
interface UserState {
  settings: UserSettings | null;
  auth: AuthState;
  isLoading: boolean;
  hasPendingChanges: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  settings: null,
  auth: DEFAULT_AUTH_STATE,
  isLoading: true,
  hasPendingChanges: false,
  error: null,
};

// Async thunks
export const loadUserSettings = createAsyncThunk(
  'user/loadUserSettings',
  async (_, { getState }) => {
    const { user } = getState() as { user: UserState };
    let settingsToLoad: UserSettings | null = null;
    
    // Try to load user-specific settings if authenticated
    if (user.auth.isAuthenticated && user.auth.user?.id) {
      logDebug(`Loading settings for authenticated user ${user.auth.user.id}`);
      
      // Check network connectivity
      const isConnected = await checkNetworkConnectivity();
      
      // First try to get from local storage
      const userKey = getUserSettingsKey(user.auth.user.id);
      const userSpecificSettings = await AsyncStorage.getItem(userKey);
      let localSettings = null;
      
      if (userSpecificSettings) {
        logDebug(`Found user-specific settings in local storage for ${user.auth.user.id}`);
        localSettings = JSON.parse(userSpecificSettings);
        
        // If we have local settings, use them as the primary source
        settingsToLoad = localSettings;
        
        logDebug('Using local settings as primary source');
      }
      
      // If we're connected and either don't have local settings or need to back them up
      if (isConnected) {
        if (!localSettings) {
          // No local settings, try to get from Supabase as fallback
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', user.auth.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching user settings from Supabase:', error);
          }
          
          if (data) {
            logDebug('No local settings found. Using Supabase settings as fallback.');
            
            // Convert from database format to app format
            settingsToLoad = {
              profile: {
                id: user.auth.user.id,
                name: user.auth.user.name,
                email: user.auth.user.email,
              },
              paceSettings: data.pace_settings || DEFAULT_PACE_SETTINGS,
              preferences: data.preferences || DEFAULT_PREFERENCES,
              weight: data.weight,
            };
            
            // Save server settings to local storage
            await AsyncStorage.setItem(userKey, JSON.stringify(settingsToLoad));
            
            logDebug('Saved Supabase settings to local storage');
          }
        } else {
          // We have local settings and we're connected
          logDebug('Using local settings as source of truth');
          logDebug('No need to back up now - syncUserSettings will handle backups when changes are made');
          
          // We don't need to upsert here as syncUserSettings will handle backing up
          // changes to Supabase when the user actually makes changes
        }
      }
    }
    
    // If we're not authenticated or couldn't load user-specific settings, try to load generic settings
    if (!settingsToLoad) {
      logDebug('No user-specific settings found, checking generic settings');
      
      const genericSettings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
      
      if (genericSettings) {
        logDebug('Found generic settings in local storage');
        settingsToLoad = JSON.parse(genericSettings);
      } else {
        logDebug('No settings found, creating default settings');
        settingsToLoad = getDefaultSettings();
        
        // Save default settings to local storage
        await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settingsToLoad));
      }
    }
    
    // Validate settings to ensure all required fields exist
    return validateSettings(settingsToLoad!);
  }
);

export const syncUserSettings = createAsyncThunk(
  'user/syncUserSettings',
  async (updates: {
    weight?: number;
    paceSettings?: Partial<PaceSettings>;
    preferences?: Partial<UserPreferences>;
  }, { getState }) => {
    const { user } = getState() as { user: UserState };
    
    if (!user.settings) {
      throw new Error('No user settings found');
    }
    
    logDebug(`Syncing user settings with updates:`, JSON.stringify(updates));
    
    // Create a copy of the current settings
    const updatedSettings = { ...user.settings };
    
    // Update weight if provided
    if (updates.weight !== undefined) {
      updatedSettings.weight = updates.weight;
      logDebug(`Updated weight to ${updates.weight}`);
    }
    
    // Update pace settings if provided
    if (updates.paceSettings) {
      // Check if we have any pace settings with undefined or NaN values
      let hasInvalidValues = false;
      Object.entries(updates.paceSettings).forEach(([key, value]) => {
        if (value && (value.speed === undefined || isNaN(value.speed) || value.incline === undefined || isNaN(value.incline))) {
          hasInvalidValues = true;
          console.error(`Invalid pace setting for ${key}:`, value);
        }
      });
      if (!hasInvalidValues) {
        updatedSettings.paceSettings = {
          ...user.settings.paceSettings,
          ...updates.paceSettings as typeof DEFAULT_PACE_SETTINGS
        };
        
        logDebug(`Updated pace settings:`, JSON.stringify(updatedSettings.paceSettings));
      }
    }
    
    // Update preferences if provided
    if (updates.preferences) {
      updatedSettings.preferences = {
        ...user.settings.preferences,
        ...updates.preferences
      };
      
      logDebug(`Updated preferences:`, JSON.stringify(updatedSettings.preferences));
    }
    
    // Save to local storage and back up to Supabase if online
    return saveAndBackupSettings(user, updatedSettings, 'settings');
  }
);

export const setAuthState = createAsyncThunk(
  'user/setAuthState',
  async (authState: AuthState, { dispatch }) => {
    try {
      // Save auth state to AsyncStorage
      await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authState));
      
      // If authenticated, load user settings
      if (authState.isAuthenticated) {
        dispatch(loadUserSettings());
      }
      
      return authState;
    } catch (err) {
      console.error('Error setting auth state:', err);
      throw err;
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetUserState: (state, action: PayloadAction<boolean | undefined>) => {
      // Default to preserving settings if not specified
      const preserveSettings = action.payload !== false;
      
      if (preserveSettings) {
        // Keep pace settings and preferences when resetting
        const currentSettings = state.settings;
        
        // Reset state
        Object.assign(state, initialState);
        
        // Create new settings with preserved pace settings and preferences
        if (currentSettings) {
          state.settings = {
            profile: { 
              name: 'Guest',
              email: '',
              id: uuidv4() 
            },
            paceSettings: currentSettings.paceSettings,
            preferences: currentSettings.preferences,
            weight: currentSettings.weight,
          };
        }
      } else {
        // Complete reset without preserving any settings
        Object.assign(state, initialState);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // loadUserSettings
      .addCase(loadUserSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(loadUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // syncUserSettings
      .addCase(syncUserSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload.settings;
        state.hasPendingChanges = action.payload.hasPendingChanges;
      })
      .addCase(syncUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // setAuthState
      .addCase(setAuthState.fulfilled, (state, action) => {
        state.auth = action.payload;
      });
  },
});

// Export actions and reducer
export const { resetUserState } = userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectUserSettings = (state: { user: UserState }) => state.user.settings;
export const selectUserPreferences = (state: { user: UserState }) => state.user.settings?.preferences || DEFAULT_PREFERENCES;
export const selectPaceSettings = (state: { user: UserState }) => state.user.settings?.paceSettings || DEFAULT_PACE_SETTINGS;
export const selectAuthState = (state: { user: UserState }) => state.user.auth;
export const selectIsAuthenticated = (state: { user: UserState }) => state.user.auth.isAuthenticated;
export const selectIsLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectHasPendingChanges = (state: { user: UserState }) => state.user.hasPendingChanges;
export const selectUserError = (state: { user: UserState }) => state.user.error;
