/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {Platform} from 'react-native';
import App from './App';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Register the app with a consistent name
// For Expo, we'll always use 'TreadTrail'
const appName = 'TreadTrail';
AppRegistry.registerComponent(appName, () => App);

// Also register as 'main' for Expo Go compatibility
if (Platform.OS !== 'web') {
  AppRegistry.registerComponent('main', () => App);
}
