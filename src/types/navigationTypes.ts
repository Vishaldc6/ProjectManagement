import { NavigatorScreenParams } from '@react-navigation/native';
import { ProjectType, TaskType } from './appTypes';

export type RootStackNavigatorType = {
  Login: undefined;
  Drawer: NavigatorScreenParams<DrawerNavigatorType>;
};

export type DrawerNavigatorType = {
  ProjectStack: NavigatorScreenParams<ProjectStackNavigatorType>;
  TaskStack: NavigatorScreenParams<TaskStackNavigatorType>;
  Member: undefined;
};

export type ProjectStackNavigatorType = {
  Project: undefined;
  ProjectDetail: { id: string };
  ProjectForm: { id: string } | undefined;
  TaskForm: {
    project?: ProjectType;
    projectId?: string;
    taskId?: string;
    task?: TaskType;
  };
};

export type TaskStackNavigatorType = {
  Task: undefined;
  TaskDetail: { id: string };
  TaskForm: {
    project?: ProjectType;
    projectId?: string;
    taskId?: string;
    task?: TaskType;
  };
};
