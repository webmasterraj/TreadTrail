import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { DataProvider } from '../src/context/DataContext';
import { UserProvider } from '../src/context/UserContext';
import WorkoutCompleteScreen from '../src/screens/WorkoutCompleteScreen';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(JSON.stringify([]))),
  setItem: jest.fn(() => Promise.resolve()),
}));

// Mock Share API
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    Share: {
      share: jest.fn().mockImplementation(() => Promise.resolve({ action: 'sharedAction' })),
    },
  };
}, { virtual: true });

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};

// Mock route with params containing workout summary
const mockRoute = {
  params: {
    summary: {
      workoutId: 'workout-1',
      startTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      endTime: new Date().toISOString(),
      elapsedTime: 1800, // 30 minutes in seconds
      totalDuration: 1800,
      completedSegments: [
        { type: 'warmup', intensity: 'recovery', duration: 300, completed: true },
        { type: 'run', intensity: 'base', duration: 600, completed: true },
        { type: 'recovery', intensity: 'recovery', duration: 300, completed: true },
        { type: 'run', intensity: 'run', duration: 300, completed: true },
        { type: 'cooldown', intensity: 'recovery', duration: 300, completed: true },
      ],
      pauseDuration: 0,
      caloriesBurned: 250,
      distance: 3.2, // miles
    }
  }
};

// Create mock workout data
const mockWorkout = {
  id: 'workout-1',
  name: 'Test Workout',
  description: 'This is a test workout description.',
  level: 'intermediate',
  duration: 1800, // 30 minutes
  focus: 'hiit',
  favorite: false,
  segments: [
    { type: 'warmup', intensity: 'recovery', duration: 300 },
    { type: 'run', intensity: 'base', duration: 600 },
    { type: 'recovery', intensity: 'recovery', duration: 300 },
    { type: 'run', intensity: 'run', duration: 300 },
    { type: 'cooldown', intensity: 'recovery', duration: 300 },
  ],
};

// Mock the DataContext to provide workout data
jest.mock('../src/context/DataContext', () => {
  const actualContext = jest.requireActual('../src/context/DataContext');
  return {
    ...actualContext,
    DataContext: {
      ...actualContext.DataContext,
      Consumer: ({ children }) => children({
        workouts: [mockWorkout],
        getWorkoutById: (id) => id === 'workout-1' ? mockWorkout : null,
        toggleFavorite: jest.fn(),
        sessions: [],
        addSession: jest.fn(),
        getSessionById: jest.fn(),
      }),
    },
    DataProvider: ({ children }) => children,
  };
});

// Mock the UserContext
jest.mock('../src/context/UserContext', () => {
  const actualContext = jest.requireActual('../src/context/UserContext');
  return {
    ...actualContext,
    UserContext: {
      ...actualContext.UserContext,
      Consumer: ({ children }) => children({
        profile: { name: 'Test User', createdAt: new Date().toISOString() },
        paceSettings: {
          recovery: { speed: 3.5, incline: 1.0 },
          base: { speed: 5.0, incline: 1.5 },
          run: { speed: 6.5, incline: 2.0 },
          sprint: { speed: 8.0, incline: 2.5 },
        },
        updatePaceSettings: jest.fn(),
        updateProfile: jest.fn(),
        preferences: { useMetric: false, soundEnabled: true, darkMode: true },
        updatePreferences: jest.fn(),
      }),
    },
    UserProvider: ({ children }) => children,
  };
});

// Setup test wrapper with all required providers
const renderWithProviders = (component) => {
  return render(
    <NavigationContainer>
      <UserProvider>
        <DataProvider>
          <WorkoutProvider>
            {component}
          </WorkoutProvider>
        </DataProvider>
      </UserProvider>
    </NavigationContainer>
  );
};

describe('WorkoutCompleteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('basic rendering', async () => {
    const { getByText } = renderWithProviders(
      <WorkoutCompleteScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Basic test to ensure the component renders without crashing
    expect(getByText('Test Workout')).toBeTruthy();
  });

  test('done button navigates to library', async () => {
    const { getByText } = renderWithProviders(
      <WorkoutCompleteScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Find and press the done button
    const doneButton = getByText('Done');
    fireEvent.press(doneButton);
    
    // Verify navigation.reset was called to go to library
    await waitFor(() => {
      expect(mockNavigation.reset).toHaveBeenCalled();
    });
  });
});