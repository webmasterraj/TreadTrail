/**
 * TreadTrail - Treadmill Interval Training App
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider, DataProvider, WorkoutProvider } from './src/context';
import Navigation from './src/navigation/Navigation';
import { COLORS } from './src/styles/theme';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <UserProvider>
        <DataProvider>
          <WorkoutProvider>
            <Navigation />
          </WorkoutProvider>
        </DataProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
};

export default App;
