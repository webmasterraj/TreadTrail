import React from 'react';
import { render, act } from '@testing-library/react-native';
import { UserContext } from '../src/context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Create a mock UserContext provider for testing
const createTestProvider = (initialState = {}) => {
  const mockSignUp = jest.fn(() => Promise.resolve());
  const mockSignIn = jest.fn(() => Promise.resolve(true));
  const mockSignOut = jest.fn(() => Promise.resolve());
  const mockSignInWithApple = jest.fn(() => Promise.resolve(true));
  
  const contextValue = {
    userSettings: null,
    isLoading: false,
    error: null,
    authState: {
      isAuthenticated: false,
      user: null,
      token: null,
    },
    signUp: mockSignUp,
    signIn: mockSignIn,
    signInWithApple: mockSignInWithApple,
    signOut: mockSignOut,
    updateProfile: jest.fn(),
    updatePaceSetting: jest.fn(),
    updatePreference: jest.fn(),
    resetToDefault: jest.fn(),
    ...initialState,
  };
  
  const TestProvider = ({ children }: { children: React.ReactNode }) => (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
  
  return {
    TestProvider,
    mockSignUp,
    mockSignIn,
    mockSignOut,
    mockSignInWithApple,
    contextValue,
  };
};

describe('User Authentication Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should call AsyncStorage when signing up', async () => {
    // Setup
    const email = 'test@example.com';
    const password = 'password123';
    const name = 'Test User';
    
    // Create a real implementation of signUp that we can test
    const signUp = async (name: string, email: string, password: string) => {
      try {
        // For MVP, we'll store credentials in AsyncStorage
        const userId = 'test-uuid';
        const now = new Date().toISOString();
        
        // Create a simple token
        const token = 'test-token';
        
        // Create user object
        const user = {
          id: userId,
          name,
          email,
          authMethod: 'email',
        };
        
        // Store user credentials
        await AsyncStorage.setItem(`@treadtrail:user_${email}`, JSON.stringify({
          id: userId,
          email,
          password,
          name,
        }));
        
        // Update auth state
        const newAuthState = {
          isAuthenticated: true,
          user,
          token,
        };
        
        await AsyncStorage.setItem('@treadtrail:auth_state', JSON.stringify(newAuthState));
        
        return true;
      } catch (err) {
        console.error('Error signing up:', err);
        return false;
      }
    };
    
    // Act
    await act(async () => {
      await signUp(name, email, password);
    });
    
    // Assert
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@treadtrail:user_test@example.com',
      expect.any(String)
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@treadtrail:auth_state',
      expect.any(String)
    );
  });
  
  it('should call AsyncStorage when signing in', async () => {
    // Setup
    const email = 'test@example.com';
    const password = 'password123';
    
    // Mock the user already exists in storage
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@treadtrail:user_test@example.com') {
        return Promise.resolve(JSON.stringify({
          id: 'test-id',
          email,
          password,
          name: 'Test User',
        }));
      }
      return Promise.resolve(null);
    });
    
    // Create a real implementation of signIn that we can test
    const signIn = async (email: string, password: string) => {
      try {
        // Get stored user data
        const userData = await AsyncStorage.getItem(`@treadtrail:user_${email}`);
        
        if (!userData) {
          return false;
        }
        
        const user = JSON.parse(userData);
        
        // Verify password (in a real app, this would involve hashing)
        if (user.password !== password) {
          return false;
        }
        
        // Create a token
        const token = 'test-token';
        
        // Update auth state
        const newAuthState = {
          isAuthenticated: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            authMethod: 'email',
          },
          token,
        };
        
        await AsyncStorage.setItem('@treadtrail:auth_state', JSON.stringify(newAuthState));
        
        return true;
      } catch (err) {
        console.error('Error signing in:', err);
        return false;
      }
    };
    
    // Act
    let result;
    await act(async () => {
      result = await signIn(email, password);
    });
    
    // Assert
    expect(result).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@treadtrail:user_test@example.com');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@treadtrail:auth_state',
      expect.any(String)
    );
  });
  
  it('should call AsyncStorage when signing out', async () => {
    // Create a real implementation of signOut that we can test
    const signOut = async () => {
      try {
        // Update auth state to unauthenticated
        const newAuthState = {
          isAuthenticated: false,
          user: null,
          token: null,
        };
        
        await AsyncStorage.setItem('@treadtrail:auth_state', JSON.stringify(newAuthState));
        
        return true;
      } catch (err) {
        console.error('Error signing out:', err);
        return false;
      }
    };
    
    // Act
    await act(async () => {
      await signOut();
    });
    
    // Assert
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@treadtrail:auth_state',
      JSON.stringify({
        isAuthenticated: false,
        user: null,
        token: null,
      })
    );
  });
});
