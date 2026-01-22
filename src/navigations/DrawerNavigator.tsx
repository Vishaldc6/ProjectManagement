import { createDrawerNavigator } from '@react-navigation/drawer';
import React, { useEffect, useState } from 'react';

import { MemberListScreen } from '../screens/admin';
import ProjectStackNavigator from './ProjectStackNavigator';
import { DrawerNavigatorType } from '../types/navigationTypes';
import { useAppSelector } from '../hooks/reduxHooks';
import DrawerContainer from './component/DrawerContainer';
import TaskStackNavigator from './TaskStackNavigator';
import { requestUserPermission } from '../utils/helperFunctions';
import { messagingApp } from '../firebase';
import { updateUser } from '../firebase/userCollection';
import ProfileScreen from '../screens/ProfileScreen';

const Drawer = createDrawerNavigator<DrawerNavigatorType>();

const DrawerNavigator = () => {
  const { user } = useAppSelector(state => state.AuthReducer);

  const [initialRouteName, setInitialRouteName] =
    useState<keyof DrawerNavigatorType>('ProjectStack');

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
      initialRouteName={initialRouteName}
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
      {user?.role === 'Admin' && (
        <Drawer.Screen
          name="Member"
          options={{
            drawerLabel: 'Members',
            title: 'Members',
          }}
          component={MemberListScreen}
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
