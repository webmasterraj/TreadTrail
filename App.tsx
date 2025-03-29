/**
 * TreadTrail - Treadmill Interval Training App
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { UserProvider, DataProvider } from './src/context';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { store, persistor } from './src/redux/store';
import Navigation from './src/navigation/Navigation';
import { COLORS } from './src/styles/theme';

const App: React.FC = () => {
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
