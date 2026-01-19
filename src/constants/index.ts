import { TaskStatusEnum } from '../types/appTypes';

export const PROJECT_STATUS_LIST = ['ACTIVE', 'IN-ACTIVE', 'COMPLETED'];

export const TASK_STATUS_LIST: TaskStatusEnum[] = [
  TaskStatusEnum.TO_DO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
];
