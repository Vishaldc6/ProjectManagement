import { Timestamp } from '@react-native-firebase/firestore';

export interface UserType {
  id: string;
  name: string;
  email: string;
  role?: RolesType;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  fcm_token?: string[];
  // later add more
}

export enum RolesType {
  Admin = 'Admin',
  Member = 'Member',
  Developer = 'Developer',
  UI_UX = 'UI/UX',
  Web_Developer = 'Web Developer',
  Mobile_Developer = 'Mobile Developer',
  QA = 'QA',
  Project_Manager = 'Project Manager',
}

export type ProjectType = {
  client_name: string;
  description: string;
  id: string;
  status: ProjectStatusType;
  title: string;
  member_list: string[];
  project_manager: string[];
  created_by?: string;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  is_deleted?: boolean;
  is_archived?: boolean;
};

export enum ProjectStatusType {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  IN_ACTIVE = 'IN-ACTIVE',
}

export type TaskType = {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_member: string;
  project_id: string;
  project_title: string;
  task_status: TaskStatusEnum;
  // priority?:string, // enum : low, medium, high
  created_by?: string;
  file_url?: string[];
  created_at?: Timestamp;
  updated_at?: Timestamp;
  is_deleted?: boolean;
  is_archived?: boolean;
};

export type CommentType = {
  task_id: string;
  message: string;
  author: string;
  author_id: string;
  created_at: Timestamp;
  updated_at?: Timestamp;
  file_url?: string[];
  is_deleted?: boolean;
};

export enum TaskStatusEnum {
  TO_DO = 'TO DO',
  IN_PROGRESS = 'IN-PROGRESS',
  DONE = 'DONE',
}

export type MemberType = {} & UserType;
