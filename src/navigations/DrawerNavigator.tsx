import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import {
  HomeScreen as AdminHomeScreen,
  MemberListScreen,
} from '../screens/admin';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="home" component={AdminHomeScreen} />
      {/* <Drawer.Screen name="ProjectStack" component={ProjectStackNavigator} /> */}
      <Drawer.Screen name="MemberList" component={MemberListScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
