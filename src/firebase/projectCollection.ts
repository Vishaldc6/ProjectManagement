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

import {
  ProjectStatusType,
  ProjectType,
  RolesType,
  UserType,
} from '../types/appTypes';
import { db } from '.';
import {
  BodyDataType,
  NotificationTypeEnum,
  sendNotification,
} from '../utils/helperFunctions';
import { store } from '../redux/store';
import { userRef } from './userCollection';

export const projectRef = collection(db, 'projects');

// add new project
export const addProject = async (docId: string, data: Partial<ProjectType>) => {
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

interface NotifyMemberParamType {
  type: 'add' | 'update' | 'delete' | 'archive' | 'restore';
  project: Partial<ProjectType>;
  newMemberIds?: string[];
  removedMemberIds?: string[];
  newPmId?: string;
  oldPmId?: string;
  isStatusChanged?: boolean;
}
// notify member about project add and update
export const notifyMemberForProject = async ({
  type,
  newMemberIds,
  removedMemberIds,
  newPmId,
  oldPmId,
  project,
  isStatusChanged,
}: NotifyMemberParamType) => {
  console.log({
    type,
    newMemberIds,
    removedMemberIds,
    newPmId,
    oldPmId,
    project,
    isStatusChanged,
  });

  const defaultNotificationData: BodyDataType = {
    body: '',
    data: {
      project_id: project.id,
      project_title: project.title,
      type: NotificationTypeEnum.ADD_NEW_PROJECT,
    },
    title: '',
    user_id: '',
  };
  const notificationList: BodyDataType[] = [];
  const currentUser = store.getState().AuthReducer.user?.id; // admin / current user / project.created_by

  if (type === 'delete' || type === 'archive' || type === 'restore') {
    // archive or delete project : notify to members of project, no admin
    project.member_list?.forEach(mId => {
      defaultNotificationData.user_id = mId;
      if (mId !== currentUser) {
        switch (type) {
          case 'delete':
            defaultNotificationData.title = 'Project deleted';
            defaultNotificationData.data.type =
              NotificationTypeEnum.DELETE_PROJECT;
            defaultNotificationData.body = `${project.title} project is deleted by admin`;
            break;

          case 'archive':
            defaultNotificationData.title = 'Project archived';
            defaultNotificationData.data.type =
              NotificationTypeEnum.ARCHIVE_PROJECT;
            defaultNotificationData.body = `${project.title} project is archived by admin`;
            break;

          case 'restore':
            defaultNotificationData.title = 'Project restored';
            defaultNotificationData.data.type =
              NotificationTypeEnum.RESTORE_PROJECT;
            defaultNotificationData.body = `${project.title} project is restored by admin`;
            break;
        }

        notificationList.push({ ...defaultNotificationData });
      }
    });
  } else if (type === 'add') {
    defaultNotificationData.title = 'New Project added';
    defaultNotificationData.data.type = NotificationTypeEnum.ADD_NEW_PROJECT;

    const projectManagerId = project?.project_manager?.at(0);
    // all member (no admin)
    const onlyMemberList = project.member_list?.filter(
      id => id !== currentUser && id !== projectManagerId,
    );
    // pm : you added in project as pm
    if (projectManagerId) {
      defaultNotificationData.body = `You are added in new Project as Project Manager: ${project.title}`;
      defaultNotificationData.user_id = projectManagerId;

      notificationList.push({ ...defaultNotificationData });
    }

    // other : you added in new project
    onlyMemberList?.forEach(mId => {
      defaultNotificationData.body = `You are added in new Project: ${project.title}`;
      defaultNotificationData.user_id = mId;

      notificationList.push({ ...defaultNotificationData });
    });
  } else {
    // new member added
    newMemberIds?.forEach(mId => {
      defaultNotificationData.title = 'New Project added';
      defaultNotificationData.data.type = NotificationTypeEnum.ADD_NEW_PROJECT;
      defaultNotificationData.body = `You are added in new Project: ${project.title}`;
      defaultNotificationData.user_id = mId;

      // new pm & new member : you are added in project as pm
      if (newPmId && mId === newPmId) {
        defaultNotificationData.body = `You are added in new Project as Project Manager: ${project.title}`;
      }

      notificationList.push({ ...defaultNotificationData });
    });

    // old removed
    removedMemberIds?.forEach(mId => {
      defaultNotificationData.data.type = NotificationTypeEnum.REMOVE_PROJECT;
      defaultNotificationData.title = 'Project removed';
      defaultNotificationData.user_id = mId;
      defaultNotificationData.body = `You are removed from a Project: ${project.title}`;

      notificationList.push({ ...defaultNotificationData });
    });

    // new pm & old member : you are now pm of project:
    if (
      newPmId &&
      newPmId !== project.created_by &&
      !newMemberIds?.includes(newPmId)
    ) {
      defaultNotificationData.data.type = NotificationTypeEnum.PM_ASSIGN;
      defaultNotificationData.title = 'New Project manager role';
      defaultNotificationData.user_id = newPmId;
      defaultNotificationData.body = `You are now Project Manager of project: ${project.title}`;

      notificationList.push({ ...defaultNotificationData });
    }

    // old pm & existing member: no longer pm in project
    if (
      oldPmId &&
      oldPmId !== project.created_by &&
      project.member_list?.includes(oldPmId)
    ) {
      defaultNotificationData.data.type = NotificationTypeEnum.PM_REVOKE;
      defaultNotificationData.title = 'Project manager role revoked';
      defaultNotificationData.user_id = oldPmId;
      defaultNotificationData.body = `You are no longer project manager in Project: ${project.title}`;

      notificationList.push({ ...defaultNotificationData });
    }

    // status update : project completed / in active / active again
    // only to old members, no new member needed to notify
    // oldMemberList = existing - new
    const existingMemberList = project.member_list?.filter(
      id => !newMemberIds?.includes(id) && id !== currentUser,
    );

    if (isStatusChanged) {
      let msg =
        project.status === ProjectStatusType.ACTIVE
          ? 'activated again'
          : project.status === ProjectStatusType.IN_ACTIVE
          ? 'is no longer active'
          : 'completed sucessfully';

      existingMemberList?.forEach(mId => {
        defaultNotificationData.data.type = NotificationTypeEnum.STATUS_CHANGE;
        defaultNotificationData.title = 'Project status updated';
        defaultNotificationData.user_id = mId;
        defaultNotificationData.body = `${project.title} ${msg}`;

        notificationList.push({ ...defaultNotificationData });
      });
    }
  }

  notificationList.length &&
    notificationList.forEach(notification => {
      sendNotification({ ...notification });
    });
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
