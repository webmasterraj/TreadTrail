/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';

// For Expo Go, use 'main' as the component name
// For production builds, use the app name from app.json
const appName = process.env.NODE_ENV === 'development' ? 'main' : 'TreadTrail';
AppRegistry.registerComponent(appName, () => App);
