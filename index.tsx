import ExceptionsManager from 'react-native/Libraries/Core/ExceptionsManager';

if (__DEV__) {
  ExceptionsManager.handleException = (error, isFatal) => {
    // no-op
  };
}

import 'react-native-url-polyfill/auto';
global.Buffer = require('buffer').Buffer;

// Initialize i18n before the router mounts any screens
import './src/i18n';

import 'expo-router/entry';
import { SplashScreen } from 'expo-router';
import { App } from 'expo-router/build/qualified-entry';
import { type ReactNode, memo, useEffect } from 'react';
import { AppRegistry, LogBox, SafeAreaView, Text, View } from 'react-native';
import { serializeError } from 'serialize-error';

if (__DEV__) {
  LogBox.ignoreAllLogs();
  LogBox.uninstall();
  AppRegistry.registerComponent('main', () => App);
}
