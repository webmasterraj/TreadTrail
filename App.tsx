/**
 * TreadTrail - Treadmill Interval Training App
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { UserProvider, DataProvider } from './src/context';
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
import NetInfo from '@react-native-community/netinfo';
import { initializeAudioSystem, preFetchWorkoutAudio } from './src/utils/audioUtils';

const App: React.FC = () => {
  // Initialize data and set up network listener
  useEffect(() => {
    // Initialize audio system
    initializeAudioSystem().catch(error => {
      console.error('Failed to initialize audio system:', error);
    });
    
    // Initialize pending queue
    store.dispatch(initializePendingQueue());
    
    // Dispatch fetch in background without awaiting
    store.dispatch(fetchWorkoutPrograms())
      .then(() => {
        // After workout programs are loaded, pre-fetch audio files
        const state = store.getState();
        const workoutPrograms = selectWorkoutPrograms(state);
        
        // Pre-fetch audio files regardless of user preferences
        if (workoutPrograms.length > 0) {
          console.log('[APP] Pre-fetching audio files for workouts');
          preFetchWorkoutAudio(workoutPrograms);
        }
        
        // Try to process any pending workouts
        store.dispatch(processPendingQueue());
      })
      .catch(error => {
        console.error('Failed to fetch workout programs:', error);
      });
    
    // Set up network listener for sync when connection is restored
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (isConnected) {
        // Sync data when connection is restored
        store.dispatch(processPendingQueue());
      }
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
          <UserProvider>
            <DataProvider>
              <SubscriptionProvider>
                <Navigation />
              </SubscriptionProvider>
            </DataProvider>
          </UserProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
