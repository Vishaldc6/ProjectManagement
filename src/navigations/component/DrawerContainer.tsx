import { Alert, StyleSheet } from 'react-native';
import React, { memo } from 'react';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import { signOut } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { USER_LOGOUT } from '../../redux/store';
import { useAppDispatch } from '../../hooks/reduxHooks';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import appColors from '../../styles/appColors';
import { authApp } from '../../firebase';

const DrawerContainer = (props: DrawerContentComponentProps) => {
  const dispatch = useAppDispatch();
  const navigation = useAppNavigation('Drawer');

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure to sign out?', [
      {
        text: 'No',
      },
      {
        text: 'Yes, Sign out',
        onPress: handleSignOut,
      },
    ]);
  };

  const handleSignOut = async () => {
    signOut(authApp);
    await GoogleSignin.signOut();
    dispatch({ type: USER_LOGOUT });
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Login',
        },
      ],
    });
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label={'Sign out'}
        onPress={confirmSignOut}
        labelStyle={{
          color: appColors.DANGER_TEXT,
        }}
      />
    </DrawerContentScrollView>
  );
};

export default memo(DrawerContainer);

const styles = StyleSheet.create({});
