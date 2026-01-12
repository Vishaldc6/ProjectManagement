import {
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from '@react-native-firebase/firestore';
import uuid from 'react-native-uuid';
import { MemberProjectType, ProjectType } from '../types/appTypes';
import { db } from '.';

export const projectRef = collection(db, 'projects');
export const membersProjectsRef = collection(db, 'members_projects');

// add new project
export const addProject = async (docId: string, data: ProjectType) => {
  const result = await setDoc(projectRef.doc(docId), {
    ...data,
    created_at: serverTimestamp(),
  });

  return result;
};

// export const projectCollectionListener = async () => {
//   const q = query(projectRef);
//   const projects: ProjectType[] = [];
//   const unsubscribe = onSnapshot(q, querySnapshot => {
//     querySnapshot.forEach((doc: any) => {
//       projects.push(doc.data());
//       console.log({ projects });
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
      status: project.status,
      created_at: serverTimestamp(),
    };
    const result = await setDoc(membersProjectsRef.doc(docId), {
      ...data,
      created_at: serverTimestamp(),
    });

    console.log({ result });
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
