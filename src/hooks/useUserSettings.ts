import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  selectUserSettings, 
  selectUserPreferences, 
  selectPaceSettings,
  selectAuthState,
  selectIsAuthenticated,
  selectIsLoading,
  selectHasPendingChanges,
  selectUserError,
  syncUserSettings,
  setAuthState,
  resetUserState
} from '../redux/slices/userSlice';
import { UserPreferences, AuthState, PaceSettings } from '../types';

/**
 * Custom hook for accessing and updating user settings
 * This replaces the UserContext with Redux-based state management
 */
export const useUserSettings = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const userSettings = useAppSelector(selectUserSettings);
  const preferences = useAppSelector(selectUserPreferences);
  const paceSettings = useAppSelector(selectPaceSettings);
  const authState = useAppSelector(selectAuthState);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const hasPendingSettingsChanges = useAppSelector(selectHasPendingChanges);
  const error = useAppSelector(selectUserError);
  
  // Update settings function
  const updateSettings = useCallback((updates: {
    weight?: number;
    paceSettings?: Partial<PaceSettings>;
    preferences?: Partial<UserPreferences>;
  }) => {
    return dispatch(syncUserSettings(updates)).unwrap();
  }, [dispatch]);
  
  // Auth state management
  const setAuth = useCallback((newAuthState: AuthState) => {
    return dispatch(setAuthState(newAuthState)).unwrap();
  }, [dispatch]);
  
  // Reset to default while preserving settings
  const resetToDefault = useCallback(() => {
    dispatch(resetUserState());
  }, [dispatch]);
  
  return {
    // State
    userSettings,
    preferences,
    paceSettings,
    authState,
    isAuthenticated,
    isLoading,
    hasPendingSettingsChanges,
    error,
    
    // Actions
    syncUserSettings: updateSettings,
    setAuthState: setAuth,
    resetToDefault,
  };
};
