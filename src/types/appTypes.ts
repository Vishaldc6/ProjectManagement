import { FieldValue } from "@react-native-firebase/firestore";

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: RolesType;
  isAdmin?: boolean;
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
  created_at?: string;
};

export type ProjectStatusType = 'ACTIVE' | 'COMPLETED' | 'IN-ACTIVE';

export type TaskType = {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  project_id: string;
  status: TaskStatusType;
  created_at: string;
};

export type TaskStatusType = 'TO DO' | 'IN-PROGRESS' | 'DONE';

export type MemberType = {} & UserType;

export type MemberProjectType = {
  id: string;
  member_id: string;
  project_title: string;
  project_id: string;
  status: ProjectStatusType;
  created_at: FieldValue;
};
