import React from 'react';

// Mock dependencies that cause issues
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock the context providers
jest.mock('../src/context/UserContext', () => ({
  UserProvider: ({ children }) => children,
  UserContext: {
    Consumer: ({ children }) => children({
      authState: {
        isAuthenticated: false,
        user: null,
      },
      userSettings: {
        preferences: {
          countdownSound: true,
          units: 'imperial',
          darkMode: true,
        },
      },
      signIn: jest.fn(() => Promise.resolve(true)),
      signUp: jest.fn(() => Promise.resolve()),
      signOut: jest.fn(() => Promise.resolve()),
      signInWithApple: jest.fn(() => Promise.resolve(true)),
    }),
  },
}));

jest.mock('../src/context/DataContext', () => ({
  DataProvider: ({ children }) => children,
  DataContext: {
    Consumer: ({ children }) => children({
      workoutPrograms: [],
      stats: {
        totalWorkouts: 0,
        totalDistance: 0,
        totalDuration: 0,
      },
      workoutHistory: [],
    }),
  },
}));

describe('Authentication Screens', () => {
  it('verifies screens are defined', () => {
    // Import the screens after mocking dependencies
    const { SigninScreen, ProfileScreen, SettingsScreen } = require('../src/screens');
    
    // Just check that the screens are defined
    expect(SigninScreen).toBeDefined();
    expect(ProfileScreen).toBeDefined();
    expect(SettingsScreen).toBeDefined();
  });
});
