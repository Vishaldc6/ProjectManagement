import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from '@react-native-firebase/firestore';
import uuid from 'react-native-uuid';
import { MemberProjectType, ProjectType } from '../types/appTypes';
import { db } from '.';
import { sendNotification } from '../utils/helperFunctions';
import { store } from '../redux/store';

export const projectRef = collection(db, 'projects');
export const membersProjectsRef = collection(db, 'members_projects');

// add new project
export const addProject = async (docId: string, data: ProjectType) => {
  const result = await setDoc(projectRef.doc(docId), {
    ...data,
    created_at: serverTimestamp() as Timestamp,
    updated_at: serverTimestamp() as Timestamp,
  });

  return result;
};

// export const projectCollectionListener = async () => {
//   const q = query(projectRef);
//   const projects: ProjectType[] = [];
//   const unsubscribe = onSnapshot(q, querySnapshot => {
//     querySnapshot.forEach((doc: any) => {
//       projects.push(doc.data());
//     });
//   });

//   return { projects, unsubscribe };
// };

// associate member to project
export const associateMemberToProject = async ({
  memberIds,
  project,
}: {
  memberIds: string[];
  project: ProjectType;
}) => {
  // id, memberid, projectid, title, status

  memberIds.forEach(async mid => {
    const docId = uuid.v4();
    const data: MemberProjectType = {
      id: docId,
      member_id: mid,
      project_id: project.id,
      project_title: project.title,
      client_name: project.client_name,
      status: project.status,
      created_at: serverTimestamp() as Timestamp,
      updated_at: serverTimestamp() as Timestamp,
    };
    const result = await setDoc(membersProjectsRef.doc(docId), {
      ...data,
      created_at: serverTimestamp(),
    });

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

// fetch all projects
export const fetchProjects = async () => {
  const q = query(projectRef);
  const querySnap = await getDocs(q);

  const projectList: ProjectType[] = [];
  querySnap.forEach((doc: any) => {
    projectList.push(doc.data());
  });

  return projectList;
};

// fetch single project
export const fetchSingleProject = async (projectId: string) => {
  const querySnap = await getDoc(doc(projectRef, projectId));

  const project: ProjectType = querySnap.data() as ProjectType;

  return project;
};
