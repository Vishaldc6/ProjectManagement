import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MemberListScreen } from '../screens/admin';
import MemberDetailScreen from '../screens/admin/MemberDetailScreen';
import { MemberStackNavigatorType } from '../types/navigationTypes';

const Stack = createNativeStackNavigator<MemberStackNavigatorType>();

const MemberStackNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Member" component={MemberListScreen} />
      <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
    </Stack.Navigator>
  );
};

export default MemberStackNavigation;
