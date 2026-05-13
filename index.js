/**
 * @format
 */

import { AppRegistry, LogBox, NativeModules } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// إيقاف الـ warnings
LogBox.ignoreAllLogs(true);

// إخفاء رسالة Connect to Metro نهائياً
NativeModules.DevLoadingView?.hide?.();

AppRegistry.registerComponent(appName, () => App);
