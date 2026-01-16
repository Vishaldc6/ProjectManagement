import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TaskStackNavigatorType } from '../types/navigationTypes';
import TaskFormScreen from '../screens/admin/TaskFormScreen';
import MemberTaskListScreen from '../screens/member/MemberTaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

const Stack = createNativeStackNavigator<TaskStackNavigatorType>();

const TaskStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Task"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Task" component={MemberTaskListScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} />
    </Stack.Navigator>
  );
};

export default TaskStackNavigator;
