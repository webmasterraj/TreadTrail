// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStorage = {};
  return {
    setItem: jest.fn((key, value) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key) => {
      return Promise.resolve(mockStorage[key] || null);
    }),
    removeItem: jest.fn((key) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(mockStorage).forEach(key => {
        delete mockStorage[key];
      });
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => {
      return Promise.resolve(Object.keys(mockStorage));
    }),
    // Add other methods as needed
  };
});

// Mock react-native/Settings
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  get: jest.fn(() => ({})),
  set: jest.fn(() => {}),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  // The mock for `call` immediately calls the callback with first argument
  Reanimated.default.call = (callback, ...args) => callback(...args);
  
  return {
    ...Reanimated,
    useSharedValue: jest.fn((value) => ({ value })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((toValue) => toValue),
    withSpring: jest.fn((toValue) => toValue),
  };
});

// Mock the Native Modules as needed
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
      StatusBarManager: { 
        HEIGHT: 42,
        getHeight: jest.fn((callback) => callback(null, 42)) 
      },
      SettingsManager: {
        settings: {},
        getConstants: () => ({}),
      },
    },
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
    },
  };
});

// Mock share functionality
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    Share: {
      share: jest.fn().mockImplementation(() => Promise.resolve({ action: 'sharedAction' })),
    },
  };
}, { virtual: true });

// Mock Animated
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  return {
    ...reactNative,
    Animated: {
      ...reactNative.Animated,
      timing: jest.fn().mockReturnValue({
        start: jest.fn((callback) => callback && callback({ finished: true })),
      }),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({
          interpolate: jest.fn(),
        })),
      })),
    },
  };
}, { virtual: true });

// Setup timers
jest.useFakeTimers();