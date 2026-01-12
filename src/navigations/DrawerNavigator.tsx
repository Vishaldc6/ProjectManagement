import { createDrawerNavigator } from '@react-navigation/drawer';
import React, { useEffect, useState } from 'react';

import { MemberListScreen } from '../screens/admin';
import ProjectStackNavigator from './ProjectStackNavigator';
import { DrawerNavigatorType } from '../types/navigationTypes';
import { useAppSelector } from '../hooks/reduxHooks';
import DrawerContainer from './component/DrawerContainer';

const Drawer = createDrawerNavigator<DrawerNavigatorType>();

const DrawerNavigator = () => {
  const { user } = useAppSelector(state => state.AuthReducer);

  const [initialRouteName, setInitialRouteName] =
    useState<keyof DrawerNavigatorType>('ProjectStack');

  // set initial screen based on user role: admin or member
  return (
    <Drawer.Navigator
      initialRouteName={initialRouteName}
      drawerContent={props => <DrawerContainer {...props} />}
    >
      <Drawer.Screen name="ProjectStack" component={ProjectStackNavigator} />
      <Drawer.Screen name="Member" component={MemberListScreen} />
      {/* tasks stack*/}
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
