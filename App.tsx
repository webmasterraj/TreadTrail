/**
 * TreadTrail - Treadmill Interval Training App
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { store, persistor } from './src/redux/store';
import Navigation from './src/navigation/Navigation';
import { COLORS } from './src/styles/theme';
import { 
  fetchWorkoutPrograms, 
  selectWorkoutPrograms, 
  initializePendingQueue,
  processPendingQueue
} from './src/redux/slices/workoutProgramsSlice';
import { 
  loadUserSettings, 
  syncUserSettings, 
  setAuthState 
} from './src/redux/slices/userSlice';
import NetInfo from '@react-native-community/netinfo';
import { initializeAudioSystem, preFetchWorkoutAudio } from './src/utils/audioUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_STATE_KEY } from './src/hooks/useAuth';

// Debug flags
const DEBUG_APP = false;
const DEBUG_NETWORK = DEBUG_APP;

const App: React.FC = () => {
  // Initialize data and set up network listener
  useEffect(() => {
    const initializeApp = async () => {
      if (DEBUG_APP) console.log('[APP] Initializing app...');
      
      // Initialize audio system
      try {
        await initializeAudioSystem();
      } catch (error) {
        if (DEBUG_APP) console.error('Failed to initialize audio system:', error);
      }
      
      // Initialize pending queue
      store.dispatch(initializePendingQueue());
      
      // First restore auth state from AsyncStorage
      try {
        if (DEBUG_APP) console.log('[APP] Restoring auth state...');
        const authStateJson = await AsyncStorage.getItem(AUTH_STATE_KEY);
        
        if (authStateJson) {
          if (DEBUG_APP) console.log('[APP] Found saved auth state');
          const authState = JSON.parse(authStateJson);
          
          // Set the auth state in Redux
          await store.dispatch(setAuthState(authState));
          if (DEBUG_APP) console.log('[APP] Auth state restored successfully');
        } else {
          if (DEBUG_APP) console.log('[APP] No saved auth state found');
        }
      } catch (error) {
        if (DEBUG_APP) console.error('Failed to restore auth state:', error);
      }
      
      // Now load user settings (this will use the restored auth state)
      if (DEBUG_APP) console.log('[APP] Loading user settings...');
      await store.dispatch(loadUserSettings());
      
      // Fetch workout programs
      if (DEBUG_APP) console.log('[APP] Fetching workout programs...');
      try {
        await store.dispatch(fetchWorkoutPrograms());
        
        // After workout programs are loaded, pre-fetch audio files
        const state = store.getState();
        const workoutPrograms = selectWorkoutPrograms(state);
        
        // Pre-fetch audio files regardless of user preferences
        if (workoutPrograms.length > 0) {
          if (DEBUG_APP) console.log('[APP] Pre-fetching audio files for workouts');
          preFetchWorkoutAudio(workoutPrograms);
        }
        
        // Try to process any pending workouts
        store.dispatch(processPendingQueue());
      } catch (error) {
        if (DEBUG_APP) console.error('Failed to fetch workout programs:', error);
      }
    };
    
    // Start the initialization process
    initializeApp();
    
    // Set up network listener
    const unsubscribe = NetInfo.addEventListener(state => {
      if (DEBUG_NETWORK) {
        console.log('[NETWORK] Connection type:', state.type);
        console.log('[NETWORK] Is connected?', state.isConnected);
      }
      
      if (state.isConnected) {
        // When connection is restored, try to process any pending workouts
        store.dispatch(processPendingQueue());
        
        // Also sync user settings if they've changed
        store.dispatch(syncUserSettings({}));
      }
    });
    
    // Clean up
    return () => {
      unsubscribe();
    };
  }, []);
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
          <SubscriptionProvider>
            <Navigation />
          </SubscriptionProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
