import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataProvider, DataContext } from '../src/context/DataContext';
import { UserProvider, UserContext } from '../src/context/UserContext';
import WorkoutCard from '../src/components/workout/WorkoutCard';
import WorkoutLibraryScreen from '../src/screens/WorkoutLibraryScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};

// Mock workout data
const mockWorkout = {
  id: 'workout-1',
  name: 'Test Workout',
  description: 'A test workout description',
  difficulty: 'intermediate',
  duration: 1800,
  focus: 'hiit',
  favorite: false,
  lastUsed: null,
  segments: [
    { type: 'recovery', duration: 300, incline: 1 },
    { type: 'base', duration: 600, incline: 1 },
    { type: 'run', duration: 300, incline: 1 },
    { type: 'recovery', duration: 600, incline: 1 },
  ],
};

describe('Favorites Toggle Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup AsyncStorage mock implementation
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@treadtrail:workout_programs') {
        return Promise.resolve(JSON.stringify([mockWorkout]));
      }
      if (key === '@treadtrail:auth_state') {
        return Promise.resolve(JSON.stringify({
          isAuthenticated: true,
          user: { id: 'user-1', name: 'Test User', email: 'test@example.com', authMethod: 'email' },
          token: 'test-token'
        }));
      }
      if (key === '@treadtrail:user_settings') {
        return Promise.resolve(JSON.stringify({
          profile: { name: 'Test User', dateCreated: new Date().toISOString(), lastActive: new Date().toISOString() },
          paceSettings: {
            recovery: { speed: 3.5, incline: 1.0 },
            base: { speed: 5.0, incline: 1.5 },
            run: { speed: 6.5, incline: 2.0 },
            sprint: { speed: 8.0, incline: 2.5 },
          },
          preferences: { units: 'imperial', darkMode: true }
        }));
      }
      return Promise.resolve(null);
    });
    
    // Track AsyncStorage setItem calls for assertions
    AsyncStorage.setItem.mockImplementation((key, value) => {
      console.log(`MockAsyncStorage.setItem called with key: ${key}`);
      console.log(`Value: ${value}`);
      return Promise.resolve();
    });
  });

  test('WorkoutCard component favorite toggle works correctly', async () => {
    // Test the WorkoutCard component directly
    const mockOnFavoriteToggle = jest.fn();
    
    const { getByTestId } = render(
      <WorkoutCard 
        workout={mockWorkout} 
        onPress={() => {}} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );

    // Find and press the favorite button
    const favoriteButton = getByTestId('favorite-button');
    fireEvent.press(favoriteButton);
    
    // Assert that the toggle callback was called
    expect(mockOnFavoriteToggle).toHaveBeenCalledTimes(1);
  });

  test('Toggling favorite updates the workout in DataContext', async () => {
    // Create a mock for toggleFavorite function
    const mockToggleFavorite = jest.fn(() => Promise.resolve());

    // Create a test component to directly test context interactions
    const TestComponent = () => {
      const { workoutPrograms } = React.useContext(DataContext);
      const { authState } = React.useContext(UserContext);
      
      return (
        <div>
          <div data-testid="auth-status">{authState.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
          <div data-testid="workout-favorite">{
            workoutPrograms[0]?.favorite ? 'favorited' : 'not-favorited'
          }</div>
          <button 
            data-testid="toggle-button" 
            onClick={() => mockToggleFavorite(workoutPrograms[0]?.id)}
          >
            Toggle
          </button>
        </div>
      );
    };

    // Render the test component wrapped in providers
    const { getByTestId } = render(
      <UserProvider>
        <DataContext.Provider 
          value={{
            workoutPrograms: [mockWorkout],
            workoutHistory: [],
            stats: { lastUpdated: new Date().toISOString(), stats: {}, achievements: [] },
            isLoading: false,
            error: null,
            getWorkoutById: () => mockWorkout,
            getSessionById: () => undefined,
            toggleFavorite: mockToggleFavorite,
            addWorkoutSession: () => Promise.resolve(),
            updateStats: () => Promise.resolve(),
          }}
        >
          <TestComponent />
        </DataContext.Provider>
      </UserProvider>
    );

    // Verify initial state
    expect(getByTestId('workout-favorite').textContent).toBe('not-favorited');
    
    // Trigger favorite toggle
    fireEvent.click(getByTestId('toggle-button'));
    
    // Verify toggle function was called with the correct ID
    expect(mockToggleFavorite).toHaveBeenCalledWith('workout-1');
  });

  test('DataContext toggleFavorite function properly toggles and persists', async () => {
    // This test will directly test the DataContext implementation
    let savedData = null;
    AsyncStorage.setItem.mockImplementation((key, value) => {
      if (key === '@treadtrail:workout_programs') {
        savedData = JSON.parse(value);
      }
      return Promise.resolve();
    });

    const wrapper = ({ children }) => (
      <DataProvider>
        {children}
      </DataProvider>
    );

    // Render a simple consumer that accesses the toggleFavorite function
    const { result } = renderHook(() => React.useContext(DataContext), { wrapper });
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Get initial state
    const initialFavoriteState = result.current.workoutPrograms.find(w => w.id === 'workout-1')?.favorite;
    expect(initialFavoriteState).toBe(false);
    
    // Call toggleFavorite
    await act(async () => {
      await result.current.toggleFavorite('workout-1');
    });
    
    // Verify the workout was updated in the context state
    const updatedFavoriteState = result.current.workoutPrograms.find(w => w.id === 'workout-1')?.favorite;
    expect(updatedFavoriteState).toBe(true);
    
    // Verify AsyncStorage was called to persist the change
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    expect(savedData.find(w => w.id === 'workout-1').favorite).toBe(true);
  });

  test('WorkoutLibraryScreen favorite toggle flow integration', async () => {
    // Mock the toggleFavorite function on DataContext
    const mockToggleFavorite = jest.fn(() => Promise.resolve());
    
    // Render WorkoutLibraryScreen with mocked context
    const { getByTestId, getByText } = render(
      <UserContext.Provider 
        value={{
          userSettings: {
            profile: { name: 'Test User', dateCreated: new Date().toISOString(), lastActive: new Date().toISOString() },
            paceSettings: {
              recovery: { speed: 3.5, incline: 1.0 },
              base: { speed: 5.0, incline: 1.5 },
              run: { speed: 6.5, incline: 2.0 },
              sprint: { speed: 8.0, incline: 2.5 },
            },
            preferences: { units: 'imperial', darkMode: true }
          },
          isLoading: false,
          error: null,
          authState: {
            isAuthenticated: true,
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com', authMethod: 'email' },
            token: 'test-token'
          },
          signUp: () => Promise.resolve(),
          signIn: () => Promise.resolve(true),
          signInWithApple: () => Promise.resolve(true),
          signOut: () => Promise.resolve(),
          updateProfile: () => Promise.resolve(),
          updatePaceSetting: () => Promise.resolve(),
          updatePreference: () => Promise.resolve(),
          resetToDefault: () => Promise.resolve(),
        }}
      >
        <DataContext.Provider 
          value={{
            workoutPrograms: [mockWorkout],
            workoutHistory: [],
            stats: { lastUpdated: new Date().toISOString(), stats: {}, achievements: [] },
            isLoading: false,
            error: null,
            getWorkoutById: () => mockWorkout,
            getSessionById: () => undefined,
            toggleFavorite: mockToggleFavorite,
            addWorkoutSession: () => Promise.resolve(),
            updateStats: () => Promise.resolve(),
          }}
        >
          <WorkoutLibraryScreen navigation={mockNavigation} />
        </DataContext.Provider>
      </UserContext.Provider>
    );

    // Find the workout card
    const workoutName = getByText('Test Workout');
    expect(workoutName).toBeTruthy();
    
    // Find all heart icons and press the one for our workout
    const favoriteButtons = screen.getAllByTestId('favorite-button');
    fireEvent.press(favoriteButtons[0]);
    
    // Check that handleFavoriteToggle was called
    expect(mockToggleFavorite).toHaveBeenCalledWith('workout-1');
  });
});