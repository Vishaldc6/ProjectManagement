import { NavigatorScreenParams } from '@react-navigation/native';
import { ProjectType, TaskType } from './appTypes';

export type RootStackNavigatorType = {
  Login: { forSignUp?: boolean };
  Drawer: NavigatorScreenParams<DrawerNavigatorType>;
};

export type DrawerNavigatorType = {
  ProjectStack: NavigatorScreenParams<ProjectStackNavigatorType>;
  TaskStack: NavigatorScreenParams<TaskStackNavigatorType>;
  Member: undefined;
  Profile: undefined;
};

export type ProjectStackNavigatorType = {
  Project: { seeArchive?: boolean } | undefined;
  ProjectDetail: { id: string };
  ProjectForm: { id: string } | undefined;
  TaskForm: {
    projectId?: string;
    task?: TaskType;
  };
};

export type TaskStackNavigatorType = {
  Task: { seeArchive?: boolean; projectId?: string } | undefined;
  TaskDetail: { id: string };
  TaskForm: {
    projectId?: string;
    task?: TaskType;
  };
};
