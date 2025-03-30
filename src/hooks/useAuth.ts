import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  selectAuthState,
  selectIsAuthenticated,
  setAuthState,
  resetUserState
} from '../redux/slices/userSlice';
import { AuthState, User } from '../types';
import * as AppleAuthentication from 'expo-apple-authentication';
import supabase from '../api/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Debug flags
const DEBUG_AUTH = true;

/**
 * Custom hook for authentication
 * This replaces the auth functions from UserContext with Redux-based state management
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const authState = useAppSelector(selectAuthState);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // Sign up function
  const signUp = useCallback(async (name: string, email: string, password: string) => {
    try {
      if (DEBUG_AUTH) {
        console.log(`[DEBUG-AUTH] Signing up user: ${email}`);
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
      
      if (DEBUG_AUTH) {
        console.log('[DEBUG-AUTH] Signup successful');
      }
      
      // Session will be handled by the auth state change listener
      return true;
    } catch (err: any) {
      console.error('Error signing up:', err);
      return false;
    }
  }, []);
  
  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      if (DEBUG_AUTH) {
        console.log(`[DEBUG-AUTH] Signing in user: ${email}`);
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
      
      // Create user object
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        authMethod: 'email',
      };
      
      // Create new auth state
      const newAuthState: AuthState = {
        isAuthenticated: true,
        user,
        token: data.session?.access_token || null,
      };
      
      // Update Redux state
      await dispatch(setAuthState(newAuthState)).unwrap();
      
      if (DEBUG_AUTH) {
        console.log('[DEBUG-AUTH] Login successful');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error signing in:', err);
      return false;
    }
  }, [dispatch]);
  
  // Sign in with Apple function
  const signInWithApple = useCallback(async (): Promise<boolean> => {
    try {
      if (DEBUG_AUTH) {
        console.log('[DEBUG-AUTH] Starting Apple sign in');
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
      
      if (DEBUG_AUTH) {
        console.log('[DEBUG-AUTH] Apple authentication successful, signing in with Supabase');
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
          
          if (DEBUG_AUTH) {
            console.log(`[DEBUG-AUTH] Updated user name to: ${fullName}`);
          }
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
      
      // Update Redux state
      await dispatch(setAuthState(newAuthState)).unwrap();
      
      if (DEBUG_AUTH) {
        console.log('[DEBUG-AUTH] Apple sign in successful');
      }
      
      return true;
    } catch (err: any) {
      // Don't treat cancellation as an error
      if (err.code === 'ERR_CANCELED') {
        if (DEBUG_AUTH) {
          console.log('[DEBUG-AUTH] Apple sign in was cancelled');
        }
        return false;
      }
      
      console.error('Error signing in with Apple:', err);
      return false;
    }
  }, [dispatch]);
  
  // Sign out function
  const signOut = useCallback(async () => {
    try {
      if (DEBUG_AUTH) {
        console.log('[DEBUG-AUTH] Signing out');
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Reset user state but keep settings
      dispatch(resetUserState());
      
      if (DEBUG_AUTH) {
        console.log('[DEBUG-AUTH] Sign out successful');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error signing out:', err);
      return false;
    }
  }, [dispatch]);
  
  // Update profile function
  const updateProfile = useCallback(async (name: string, weight: number | null) => {
    try {
      if (!isAuthenticated || !authState.user) {
        return { success: false, error: 'Not authenticated' };
      }
      
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name || authState.user.name,
        }
      });
      
      if (error) {
        console.error('[DEBUG-AUTH] Error updating user profile:', error);
        return { success: false, error: error.message };
      }
      
      // Update auth state with new name
      const updatedUser: User = {
        ...authState.user,
        name: name || authState.user.name,
      };
      
      const updatedAuthState: AuthState = {
        ...authState,
        user: updatedUser,
      };
      
      // Update Redux state
      await dispatch(setAuthState(updatedAuthState)).unwrap();
      
      return { success: true };
    } catch (error: any) {
      console.error('[DEBUG-AUTH] Error in updateProfile:', error);
      return { success: false, error: 'Unknown error' };
    }
  }, [authState, isAuthenticated, dispatch]);
  
  return {
    authState,
    isAuthenticated,
    signUp,
    signIn,
    signInWithApple,
    signOut,
    updateProfile,
  };
};
