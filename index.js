/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler
getMessaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', { remoteMessage });
});

AppRegistry.registerComponent(appName, () => App);
