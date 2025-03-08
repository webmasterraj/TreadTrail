import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { DataProvider } from '../src/context/DataContext';
import { UserProvider, UserContext } from '../src/context/UserContext';
import EditPaceScreen from '../src/screens/EditPaceScreen';

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

// Mock route
const mockRoute = {};

// Mock the UserContext to provide pace settings
const mockUpdatePaceSettings = jest.fn();
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
            updatePaceSettings: mockUpdatePaceSettings,
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

describe('EditPaceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with current pace settings', async () => {
    const { getByText, getAllByText } = renderWithProviders(
      <EditPaceScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Verify screen title and description
    await waitFor(() => {
      expect(getByText('Edit Your Pace Settings')).toBeTruthy();
      expect(getByText(/personalize your treadmill pace settings/i)).toBeTruthy();
    });
    
    // Check for pace type labels
    await waitFor(() => {
      expect(getByText('Recovery Pace')).toBeTruthy();
      expect(getByText('Base Pace')).toBeTruthy();
      expect(getByText('Run Pace')).toBeTruthy();
      expect(getByText('Sprint Pace')).toBeTruthy();
    });
    
    // Check for pace values
    await waitFor(() => {
      // Speed values
      expect(getAllByText('3.5')[0]).toBeTruthy(); // Recovery speed
      expect(getAllByText('5.0')[0]).toBeTruthy(); // Base speed
      expect(getAllByText('6.5')[0]).toBeTruthy(); // Run speed
      expect(getAllByText('8.0')[0]).toBeTruthy(); // Sprint speed
      
      // Incline values
      expect(getAllByText('1.0')[0]).toBeTruthy(); // Recovery incline
      expect(getAllByText('1.5')[0]).toBeTruthy(); // Base incline
      expect(getAllByText('2.0')[0]).toBeTruthy(); // Run incline
      expect(getAllByText('2.5')[0]).toBeTruthy(); // Sprint incline
    });
  });

  test('updates pace settings when save button is pressed', async () => {
    const { getByText } = renderWithProviders(
      <EditPaceScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Find and press the save button
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    // Verify updatePaceSettings was called with the current values
    await waitFor(() => {
      expect(mockUpdatePaceSettings).toHaveBeenCalledWith({
        recovery: { speed: 3.5, incline: 1.0 },
        base: { speed: 5.0, incline: 1.5 },
        run: { speed: 6.5, incline: 2.0 },
        sprint: { speed: 8.0, incline: 2.5 },
      });
    });
    
    // Verify navigation to the previous screen
    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  test('validates pace settings', async () => {
    // Mock implementation of updatePaceSettings that rejects invalid values
    mockUpdatePaceSettings.mockImplementation((settings) => {
      if (settings.recovery.speed >= settings.base.speed) {
        throw new Error("Recovery pace should be slower than Base pace");
      }
      return Promise.resolve();
    });
    
    const { getByText } = renderWithProviders(
      <EditPaceScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Find and press the save button
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    // Expect updatePaceSettings to be called
    await waitFor(() => {
      expect(mockUpdatePaceSettings).toHaveBeenCalled();
    });
  });

  test('cancel button returns to previous screen without saving', async () => {
    const { getByText } = renderWithProviders(
      <EditPaceScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Find and press the cancel button
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);
    
    // Verify updatePaceSettings was not called
    expect(mockUpdatePaceSettings).not.toHaveBeenCalled();
    
    // Verify navigation back
    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
  
  test('reset button should be available for user', async () => {
    const { getByText } = renderWithProviders(
      <EditPaceScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Find the reset button
    const resetButton = getByText('Reset to Defaults');
    
    // Verify button exists
    expect(resetButton).toBeTruthy();
  });
});