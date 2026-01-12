/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { LogBox, StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import BootSplash from 'react-native-bootsplash';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from './src/redux/store';
import RootNavigator from './src/navigations/RootNavigator';

LogBox.ignoreAllLogs();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    hideSplash();
  }, []);

  async function hideSplash() {
    await BootSplash.hide({ fade: true });
  }

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <SafeAreaProvider style={styles.container}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
