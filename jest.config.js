module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  
  // Ignore image imports in tests
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Prevent problems with React Navigation
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-reanimated|react-native-gesture-handler)/)',
  ],
  
  testEnvironment: 'node',
};
