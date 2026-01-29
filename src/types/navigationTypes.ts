import { NavigatorScreenParams } from '@react-navigation/native';
import { TaskType } from './appTypes';

export type RootStackNavigatorType = {
  Login: { forSignUp?: boolean };
  Drawer: NavigatorScreenParams<DrawerNavigatorType>;
};

export type DrawerNavigatorType = {
  ProjectStack: NavigatorScreenParams<ProjectStackNavigatorType>;
  TaskStack: NavigatorScreenParams<TaskStackNavigatorType>;
  MemberStack: NavigatorScreenParams<MemberStackNavigatorType>;
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
  Task: { projectId?: string } | undefined;
  TaskDetail: { id: string };
  TaskForm: {
    projectId?: string;
    task?: TaskType;
  };
};

export type MemberStackNavigatorType = {
  Member: undefined;
  MemberDetail: { id: string };
};
