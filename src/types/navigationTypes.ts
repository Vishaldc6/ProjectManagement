import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackNavigatorType = {
  Login: undefined; 
  Drawer: NavigatorScreenParams<DrawerNavigatorType>;
};

export type DrawerNavigatorType = {
  ProjectStack: NavigatorScreenParams<ProjectStackNavigatorType>;
  Member: undefined;
};

export type ProjectStackNavigatorType = {
  Project: undefined;
  ProjectDetail: { id: string };
  ProjectForm: { id: string } | undefined;
  TaskForm: { taskId: string } | { projectId: string; projectName: string };
};
