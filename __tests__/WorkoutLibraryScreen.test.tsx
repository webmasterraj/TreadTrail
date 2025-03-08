import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { DataProvider } from '../src/context/DataContext';
import { UserProvider } from '../src/context/UserContext';
import WorkoutLibraryScreen from '../src/screens/WorkoutLibraryScreen';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(JSON.stringify([]))),
  setItem: jest.fn(() => Promise.resolve()),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};

// Create mock workout data
const mockWorkouts = [
  {
    id: 'workout-1',
    name: 'Beginner Intervals',
    description: 'A simple interval workout for beginners',
    level: 'beginner',
    duration: 600,
    focus: 'endurance',
    favorite: false,
    segments: [
      { type: 'warmup', intensity: 'recovery', duration: 120 },
      { type: 'run', intensity: 'base', duration: 180 },
      { type: 'recovery', intensity: 'recovery', duration: 60 },
      { type: 'run', intensity: 'base', duration: 180 },
      { type: 'cooldown', intensity: 'recovery', duration: 60 },
    ],
  },
  {
    id: 'workout-2',
    name: 'Hill Climb Challenge',
    description: 'Intense hill climb workout',
    level: 'advanced',
    duration: 1200,
    focus: 'strength',
    favorite: true,
    segments: [
      { type: 'warmup', intensity: 'recovery', duration: 180 },
      { type: 'run', intensity: 'run', duration: 240 },
      { type: 'sprint', intensity: 'sprint', duration: 60 },
      { type: 'recovery', intensity: 'recovery', duration: 120 },
      { type: 'run', intensity: 'run', duration: 240 },
      { type: 'sprint', intensity: 'sprint', duration: 60 },
      { type: 'recovery', intensity: 'recovery', duration: 120 },
      { type: 'cooldown', intensity: 'recovery', duration: 180 },
    ],
  },
];

// Mock the DataContext to provide workout data
jest.mock('../src/context/DataContext', () => {
  const actualContext = jest.requireActual('../src/context/DataContext');
  return {
    ...actualContext,
    DataProvider: ({ children }) => {
      return (
        <actualContext.DataContext.Provider
          value={{
            workouts: mockWorkouts,
            getWorkoutById: (id) => mockWorkouts.find(w => w.id === id),
            toggleFavorite: jest.fn(),
            sessions: [],
            addSession: jest.fn(),
            getSessionById: jest.fn(),
          }}
        >
          {children}
        </actualContext.DataContext.Provider>
      );
    },
  };
});

// Mock the UserContext to provide pace settings
jest.mock('../src/context/UserContext', () => {
  const actualContext = jest.requireActual('../src/context/UserContext');
  return {
    ...actualContext,
    UserProvider: ({ children }) => {
      return (
        <actualContext.UserContext.Provider
          value={{
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
          }}
        >
          {children}
        </actualContext.UserContext.Provider>
      );
    },
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

describe('WorkoutLibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with workout list', async () => {
    const { getByText, getAllByText } = renderWithProviders(
      <WorkoutLibraryScreen navigation={mockNavigation} />
    );
    
    // Verify title and pace settings section render
    await waitFor(() => {
      expect(getByText('Workout Library')).toBeTruthy();
      expect(getByText('My Pace Settings')).toBeTruthy();
    });
    
    // Check for pace cards
    await waitFor(() => {
      expect(getByText('Recovery')).toBeTruthy();
      expect(getByText('Base')).toBeTruthy();
      expect(getByText('Run')).toBeTruthy();
      expect(getByText('Sprint')).toBeTruthy();
    });
    
    // Verify workout cards are displayed
    await waitFor(() => {
      expect(getByText('Beginner Intervals')).toBeTruthy();
      expect(getByText('Hill Climb Challenge')).toBeTruthy();
    });
  });

  test('navigates to workout details when a workout is pressed', async () => {
    const { getByText } = renderWithProviders(
      <WorkoutLibraryScreen navigation={mockNavigation} />
    );
    
    // Find and press the first workout
    const workoutCard = getByText('Beginner Intervals');
    fireEvent.press(workoutCard);
    
    // Verify navigation was called with correct parameters
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('WorkoutDetails', { workoutId: 'workout-1' });
    });
  });

  test('toggles favorite status when favorite button is pressed', async () => {
    const { getByText, getAllByText } = renderWithProviders(
      <WorkoutLibraryScreen navigation={mockNavigation} />
    );
    
    // Find all heart icons (there should be one for each workout)
    // We need to identify the favorite toggle button in a reliable way
    // This may need adjustment based on actual implementation
    const favoriteIcons = getAllByText('♡');
    
    // Press the first favorite icon
    fireEvent.press(favoriteIcons[0]);
    
    // Verify toggle favorite function was called
    // This will depend on how you can access the mocked function
    // You might need to adjust this assertion based on your actual implementation
    await waitFor(() => {
      // Check if toggleFavorite was called with workout-1
      const dataContext = require('../src/context/DataContext');
      expect(dataContext.DataContext.toggleFavorite).toHaveBeenCalled();
    });
  });

  test('navigates to EditPace screen when edit button is pressed', async () => {
    const { getByText } = renderWithProviders(
      <WorkoutLibraryScreen navigation={mockNavigation} />
    );
    
    // Find and press the edit pace button
    const editButton = getByText('Edit');
    fireEvent.press(editButton);
    
    // Verify navigation was called correctly
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('EditPace');
    });
  });

  test('displays pace information correctly', async () => {
    const { getByText } = renderWithProviders(
      <WorkoutLibraryScreen navigation={mockNavigation} />
    );
    
    // Check for pace values
    await waitFor(() => {
      // Recovery pace
      expect(getByText('3.5 mph')).toBeTruthy();
      expect(getByText('1.0%')).toBeTruthy();
      
      // Base pace
      expect(getByText('5.0 mph')).toBeTruthy();
      expect(getByText('1.5%')).toBeTruthy();
      
      // Run pace
      expect(getByText('6.5 mph')).toBeTruthy();
      expect(getByText('2.0%')).toBeTruthy();
      
      // Sprint pace
      expect(getByText('8.0 mph')).toBeTruthy();
      expect(getByText('2.5%')).toBeTruthy();
    });
  });
});