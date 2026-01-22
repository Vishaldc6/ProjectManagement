import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';

import { ProjectType, RolesType, UserType } from '../types/appTypes';
import { db } from '.';
import { sendNotification } from '../utils/helperFunctions';
import { store } from '../redux/store';
import { userRef } from './userCollection';

export const projectRef = collection(db, 'projects');

// add new project
export const addProject = async (docId: string, data: ProjectType) => {
  const result = await setDoc(projectRef.doc(docId), {
    ...data,
    is_archived: false,
    is_deleted: false,
    created_at: serverTimestamp() as Timestamp,
    updated_at: serverTimestamp() as Timestamp,
  });

  return result;
};

// update project
export const updateProject = async (
  docId: string,
  projectData: Partial<ProjectType>,
) => {
  await updateDoc(doc(projectRef, docId), projectData);
};

// notify member about project
export const notifyMemberForProject = async ({
  memberIds,
  project,
}: {
  memberIds: string[];
  project: ProjectType;
}) => {
  memberIds.forEach(async mid => {
    // NOTIFY THOSE ADDED MEMBERS
    if (mid !== store.getState().AuthReducer.user?.id) {
      sendNotification({
        body: `You are added in new Project: ${project.title}`,
        data: {
          project_id: project.id,
          project_title: project.title,
        },
        title: 'New Project added',
        user_id: mid,
      });
    }
  });

  return;
};

// fetch single project
export const fetchSingleProject = async (projectId: string) => {
  const querySnap = await getDoc(doc(projectRef, projectId));

  const project: ProjectType = querySnap.data() as ProjectType;

  return project;
};

// fetch members of the project
export const fetchProjectMembers = async (project: ProjectType) => {
  const memberList: UserType[] = [];
  const q = query(userRef, where('id', 'in', project.member_list));

  const querysnapshot = await getDocs(q);
  querysnapshot.forEach((doc: any) => {
    const member = {
      ...doc.data(),
    };
    if (project.project_manager?.includes(member.id)) {
      member.role = RolesType.Project_Manager;
    }
    memberList.push(member);
  });

  return memberList;
};
