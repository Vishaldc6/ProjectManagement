import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { store } from '../redux/store';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { setUser } from '../redux/slices/AuthSlice';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {

  const [initializing, setInitializing] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState<string>('Login');
  
  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), user => {
      store.dispatch(setUser(user));
      if (initializing) setInitializing(false);
      setInitialRouteName('Drawer');
    });
    return subscriber;
  }, []);

  if (initializing) return null;

  return (
    <NavigationContainer>
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
