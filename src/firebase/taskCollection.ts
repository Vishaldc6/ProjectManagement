import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import uuid from 'react-native-uuid';

import { CommentType, TaskType } from '../types/appTypes';
import { sendNotification } from '../utils/helperFunctions';

export const taskRef = collection(getFirestore(), 'tasks');

// add new task
export const addTask = async (task: Partial<TaskType>) => {
  const taskData = {
    ...task,
    updated_at: serverTimestamp() as Timestamp,
  };
  if (!task?.id) {
    const docId = uuid.v4();
    taskData.id = docId;
    taskData.created_at = serverTimestamp() as Timestamp;
  }

  const result = await setDoc(doc(taskRef, taskData.id), taskData);

  //
  // NOTIFY THAT ASSIGNED MEMBER
  sendNotification({
    body: `You got a task in project: ${task.project_title}`,
    data: {
      task_id: taskData.id,
    },
    title: 'New task assigned',
    user_id: task.assigned_to ?? '',
  });

  return result;
};

// fetch single task
export const getTask = async (taskId: string) => {
  const docSnap = await getDoc(doc(taskRef, taskId));
  const task = docSnap.data() as TaskType;
  return task;
};

// update task
export const updateTask = async (
  docId: string,
  taskData: Partial<TaskType>,
) => {
  await updateDoc(doc(taskRef, docId), taskData);
};

// task and comment collection
export const tasksCommentsRef = collection(getFirestore(), 'tasks_comments');

// add comment
export const addComment = async (commentData: Partial<CommentType>) => {
  const data = {
    ...commentData,
    created_at: serverTimestamp() as Timestamp,
  };
  const docSnap = await addDoc(tasksCommentsRef, data);

  return docSnap;
};
