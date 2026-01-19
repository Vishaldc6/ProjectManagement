import { Timestamp } from '@react-native-firebase/firestore';

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: RolesType;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  fcm_token?: string[];
  // later add more
}

export type RolesType =
  | 'Admin'
  | 'Developer'
  | 'UI/UX'
  | 'Web Developer'
  | 'Mobile Developer'
  | 'QA'
  | 'Project Manager';

export type ProjectType = {
  client_name: string;
  description: string;
  id: string;
  status: ProjectStatusType;
  title: string;
  member_list: string[];
  created_at?: Timestamp;
  updated_at?: Timestamp;
};

export type ProjectStatusType = 'ACTIVE' | 'COMPLETED' | 'IN-ACTIVE';

export type TaskType = {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_member: string;
  project_id: string;
  project_title: string;
  task_status: TaskStatusEnum;
  // comments: CommentType[];
  created_by?: string;
  file_url?: string[];
  created_at?: Timestamp;
  updated_at?: Timestamp;
};

export type CommentType = {
  task_id: string;
  message: string;
  author: string;
  author_id: string;
  created_at: Timestamp;
  file_url?: string[];
};

export enum TaskStatusEnum {
  TO_DO = 'TO DO',
  IN_PROGRESS = 'IN-PROGRESS',
  DONE = 'DONE',
}

export type MemberType = {} & UserType;

export type MemberProjectType = {
  id: string;
  member_id: string;
  project_title: string;
  project_id: string;
  status: ProjectStatusType;
  client_name: string;
  created_at?: Timestamp;
  updated_at?: Timestamp;
};
