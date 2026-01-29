import { createDrawerNavigator } from '@react-navigation/drawer';
import React, { useEffect, useState } from 'react';

import MemberStackNavigation from './MemberStackNavigation';
import ProjectStackNavigator from './ProjectStackNavigator';
import { DrawerNavigatorType } from '../types/navigationTypes';
import { useAppSelector } from '../hooks/reduxHooks';
import DrawerContainer from './component/DrawerContainer';
import TaskStackNavigator from './TaskStackNavigator';
import { requestUserPermission } from '../utils/helperFunctions';
import { messagingApp } from '../firebase';
import { updateUser } from '../firebase/userCollection';
import ProfileScreen from '../screens/ProfileScreen';
import { RolesType } from '../types/appTypes';

const Drawer = createDrawerNavigator<DrawerNavigatorType>();

const DrawerNavigator = () => {
  const { user } = useAppSelector(state => state.AuthReducer);

  useEffect(() => {
    requestUserPermission()
      .then(async () => {
        const token = await messagingApp.getToken();
        console.log({ token });
        saveTokenToDatabase(token);
      })
      .catch(err => {
        console.log({ err });
      });
  }, []);

  const saveTokenToDatabase = async (token: string) => {
    await updateUser(user?.id ?? '', { fcm_token: [token] });
  };

  return (
    <Drawer.Navigator
      initialRouteName={'ProjectStack'}
      screenOptions={{ popToTopOnBlur: true }}
      drawerContent={props => <DrawerContainer {...props} />}
    >
      <Drawer.Screen
        name="ProjectStack"
        options={{
          drawerLabel: 'Projects',
          title: 'Projects',
        }}
        component={ProjectStackNavigator}
      />
      <Drawer.Screen
        name="TaskStack"
        options={{
          drawerLabel: 'Tasks',
          title: 'Tasks',
        }}
        component={TaskStackNavigator}
      />
      {user?.role === RolesType.Admin && (
        <Drawer.Screen
          name="MemberStack"
          options={{
            drawerLabel: 'Members',
            title: 'Members',
          }}
          component={MemberStackNavigation}
        />
      )}
      <Drawer.Screen
        name="Profile"
        options={{
          drawerLabel: 'Profile',
          title: 'Profile',
        }}
        component={ProfileScreen}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
