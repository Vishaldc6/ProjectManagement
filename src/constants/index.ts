import {
  ProjectStatusType,
  RolesType,
  TaskStatusEnum,
} from '../types/appTypes';

export const PROJECT_STATUS_LIST = [
  'ALL',
  ProjectStatusType.ACTIVE,
  ProjectStatusType.IN_ACTIVE,
  ProjectStatusType.COMPLETED,
];

export const TASK_STATUS_LIST: TaskStatusEnum[] = [
  TaskStatusEnum.TO_DO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
];

export const ROLE_LIST: RolesType[] = [
  RolesType.Admin,
  RolesType.Developer,
  RolesType.Mobile_Developer,
  RolesType.Web_Developer,
  RolesType.Project_Manager,
  RolesType.Member,
  RolesType.QA,
  RolesType.UI_UX,
];
