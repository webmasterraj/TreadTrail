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
const mockUpdatePaceSetting = jest.fn();
jest.mock('../src/context/UserContext', () => {
  const actualContext = jest.requireActual('../src/context/UserContext');
  return {
    ...actualContext,
    UserProvider: ({ children }) => {
      return (
        <actualContext.UserContext.Provider
          value={{
            userSettings: {
              profile: { name: 'Test User', createdAt: new Date().toISOString() },
              paceSettings: {
                recovery: { speed: 3.5, incline: 1.0 },
                base: { speed: 5.0, incline: 1.5 },
                run: { speed: 6.5, incline: 2.0 },
                sprint: { speed: 8.0, incline: 2.5 },
              },
              preferences: { useMetric: false, soundEnabled: true, darkMode: true },
            },
            updatePaceSetting: mockUpdatePaceSetting,
            updateProfile: jest.fn(),
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
    const { getByText } = renderWithProviders(
      <EditPaceScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Verify screen title and description
    await waitFor(() => {
      expect(getByText('Set Your Pace Levels')).toBeTruthy();
      expect(getByText(/Define your personal pace levels/i)).toBeTruthy();
    });
    
    // Check for pace type labels
    await waitFor(() => {
      expect(getByText('Recovery Pace')).toBeTruthy();
      expect(getByText('Base Pace')).toBeTruthy();
      expect(getByText('Run Pace')).toBeTruthy();
      expect(getByText('Sprint Pace')).toBeTruthy();
    });
    
    // Check for units toggle
    await waitFor(() => {
      expect(getByText('Units:')).toBeTruthy();
      expect(getByText('mi')).toBeTruthy();
      expect(getByText('km')).toBeTruthy();
    });
  });

  test('updates pace settings when save button is pressed', async () => {
    const { getByText } = renderWithProviders(
      <EditPaceScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Find and press the save button
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    // Verify updatePaceSetting was called for each pace type
    await waitFor(() => {
      expect(mockUpdatePaceSetting).toHaveBeenCalledTimes(4); // Called once for each pace type
    });
    
    // Verify navigation to the previous screen
    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  test('toggles between miles and kilometers', async () => {
    const { getByText, getAllByText } = renderWithProviders(
      <EditPaceScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Initially we should see mph as the unit
    expect(getAllByText('mph').length).toBeGreaterThan(0);
    
    // Press the km option
    const kmToggle = getByText('km');
    fireEvent.press(kmToggle);
    
    // Now we should see km/h as the unit
    await waitFor(() => {
      expect(getAllByText('km/h').length).toBeGreaterThan(0);
    });
    
    // Press the mi option
    const miToggle = getByText('mi');
    fireEvent.press(miToggle);
    
    // We should go back to mph
    await waitFor(() => {
      expect(getAllByText('mph').length).toBeGreaterThan(0);
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
    expect(mockUpdatePaceSetting).not.toHaveBeenCalled();
    
    // Verify navigation back
    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
  
  // Remove the "Reset to Defaults" test since we don't have that button in the new design
});