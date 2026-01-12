import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';

import DrawerNavigator from './DrawerNavigator';
import { store } from '../redux/store';
import { setUser } from '../redux/slices/AuthSlice';
import LoginScreen from '../screens/LoginScreen';
import appColors from '../styles/appColors';
import { RootStackNavigatorType } from '../types/navigationTypes';
import { getUser } from '../firebase/userCollection';

const Stack = createNativeStackNavigator<RootStackNavigatorType>();

const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: appColors.PRIMARY_BACKGROUND,
    primary: appColors.PRIMARY,
  },
};

const RootNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [initialRouteName, setInitialRouteName] =
    useState<keyof RootStackNavigatorType>('Login');

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), user => {
      if (user) {
        getUser(user.uid).then(_user => {
          store.dispatch(setUser(_user));
        });
        setInitialRouteName('Drawer');
      }
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, []);

  if (initializing) return null;

  return (
    <NavigationContainer theme={NavigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
