import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../styles/theme';

// Import screens
import {
  LandingScreen,
  SignupScreen,
  SigninScreen,
  WelcomeScreen,
  EditPaceScreen,
  WorkoutLibraryScreen,
  WorkoutDetailsScreen,
  WorkoutInProgressScreen,
  WorkoutCompleteScreen,
  ProfileScreen,
  SettingsScreen
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.black,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: COLORS.black,
          },
        }}
      >
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Signin" 
          component={SigninScreen}
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ title: 'Welcome' }} 
        />
        <Stack.Screen 
          name="EditPace" 
          component={EditPaceScreen}
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="WorkoutLibrary" 
          component={WorkoutLibraryScreen}
          options={{ title: 'Workouts' }} 
        />
        <Stack.Screen 
          name="WorkoutDetails" 
          component={WorkoutDetailsScreen}
          options={{ title: 'Workout Details' }} 
        />
        <Stack.Screen 
          name="WorkoutInProgress" 
          component={WorkoutInProgressScreen}
          options={{ 
            title: 'Workout', 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="WorkoutComplete" 
          component={WorkoutCompleteScreen}
          options={{ 
            title: 'Workout Complete',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;