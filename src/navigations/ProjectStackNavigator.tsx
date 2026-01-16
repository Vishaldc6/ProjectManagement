import { StyleSheet } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProjectScreen from '../screens/ProjectScreen';
import { ProjectStackNavigatorType } from '../types/navigationTypes';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ProjectFormScreen from '../screens/admin/ProjectFormScreen';
import TaskFormScreen from '../screens/admin/TaskFormScreen';

const Stack = createNativeStackNavigator<ProjectStackNavigatorType>();

const ProjectStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Project"
        component={ProjectScreen}
        options={{
          title: 'Project',
        }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{
          title: 'Project',
        }}
      />
      <Stack.Screen
        name="ProjectForm"
        component={ProjectFormScreen}
        options={{
          title: 'Project',
        }}
      />
      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{
          title: 'Project',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProjectStackNavigator;

const styles = StyleSheet.create({});
