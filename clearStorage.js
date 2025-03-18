const AsyncStorage = require('@react-native-async-storage/async-storage');

// Function to clear all AsyncStorage data
const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('All AsyncStorage data has been cleared!');
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
  }
};

// Execute the function
clearAllData();
