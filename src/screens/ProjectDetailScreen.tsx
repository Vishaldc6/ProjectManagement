import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

import { taskRef } from '../firebase/taskCollection';
import appColors from '../styles/appColors';
import appFonts from '../styles/appFonts';
import { useAppNavigation } from '../hooks/useAppNavigation';
import {
  ProjectStatusType,
  ProjectType,
  RolesType,
  TaskType,
  UserType,
} from '../types/appTypes';
import {
  fetchProjectMembers,
  fetchSingleProject,
  updateProject,
} from '../firebase/projectCollection';
import { BaseIcon, BaseLoader, BaseModal } from '../components';
import { useAppSelector } from '../hooks/reduxHooks';
import { timestampToDate, toCapitalize } from '../utils/helperFunctions';
import { useAppRoutes } from '../hooks/useAppRoute';

const ProjectDetailScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);

  const { params } = useAppRoutes<'ProjectDetail'>();
  const navigation = useAppNavigation('ProjectDetail');

  const [isLoading, setIsLoading] = useState(false);
  const [isMemberListLoading, setIsMemberListLoading] = useState(true);
  const [taskList, setTaskList] = useState<TaskType[]>([]);
  const [project, setProject] = useState<ProjectType | undefined>();
  const [memberListModal, setMemberListModal] = useState(false);
  const [memberList, setMemberList] = useState<UserType[]>([]);

  const IS_ADMIN = user?.role === RolesType.Admin;
  const IS_PM = useMemo(
    () => project?.project_manager?.includes(user?.id ?? ''),
    [project],
  );

  useEffect(() => {
    if (params?.id) {
      setIsLoading(true);
      fetchSingleProject(params?.id).then(res => {
        setProject(res);
        setIsLoading(false);
        fetchProjectMembers(res).then(members => {
          setIsMemberListLoading(false);
          setMemberList(members);
        });
      });
    }
  }, []);

  useEffect(() => {
    let q;
    if (IS_ADMIN || IS_PM) {
      q = query(
        taskRef,
        where('project_id', '==', params?.id),
        orderBy('updated_at', 'desc'),
        limit(4),
      );
    } else {
      q = query(
        taskRef,
        where('assigned_to', '==', user?.id),
        where('project_id', '==', params?.id),
        orderBy('updated_at', 'desc'),
        limit(4),
      );
    }

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const tasks: TaskType[] = [];
      if (querySnapshot != null)
        querySnapshot?.forEach((doc: any) => tasks.push(doc.data()));

      setTaskList(tasks);
    });

    return () => {
      unsubscribe();
    };
  }, [IS_PM]);

  enum OperationTypes {
    ARCHIVE = 'ARCHIVE',
    RESTORE = 'RESTORE',
    DELETE = 'DELETE',
  }
  const handleConfirm = (type: OperationTypes) => {
    const title =
      type === OperationTypes.ARCHIVE
        ? 'Project Archive'
        : type === OperationTypes.RESTORE
        ? 'Project Restore'
        : 'Project Delete';
    const msg =
      type === OperationTypes.ARCHIVE
        ? 'Are you sure to archive this project?'
        : type === OperationTypes.RESTORE
        ? 'Are you sure to restore this project?'
        : 'Are you sure to delete this project?';
    Alert.alert(title, msg, [
      {
        text: 'No',
      },
      {
        text: 'Yes',
        onPress: () => handleOperation(type),
      },
    ]);
  };

  const handleOperation = (operation: OperationTypes) => {
    setIsLoading(true);
    const data: Partial<TaskType> =
      operation === OperationTypes.DELETE
        ? { is_deleted: true }
        : { is_archived: operation === OperationTypes.ARCHIVE ? true : false };
    updateProject(project?.id ?? '', data).then(() => {
      setIsLoading(false);
      navigation.goBack();
    });
  };

  const renderItem = ({ item: task }: { item: TaskType }) => {
    const taskStyle =
      task.task_status === 'DONE'
        ? {
            icon: 'CircleCheck',
            bg: appColors.TASK_DONE_BG,
            iconColor: appColors.TASK_DONE,
          }
        : task.task_status === 'IN-PROGRESS'
        ? {
            icon: 'CircleDot',
            bg: appColors.TASK_IN_PROGRESS_BG,
            iconColor: appColors.TASK_IN_PROGRESS,
          }
        : {
            icon: 'Circle',
            bg: appColors.TASK_TODO_BG,
            iconColor: appColors.TASK_TODO,
          };

    const taskIcon =
      task.task_status === 'DONE'
        ? 'CircleCheck'
        : task.task_status === 'IN-PROGRESS'
        ? 'CircleDot'
        : 'Circle';

    return (
      <View style={styles.taskCard}>
        <BaseIcon name={taskIcon} color={taskStyle.iconColor} />
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {toCapitalize(task.title)}
          </Text>
          {(IS_ADMIN || IS_PM) && (
            <Text style={styles.taskMember} numberOfLines={1}>
              {toCapitalize(task.assigned_member)}
            </Text>
          )}
          <Text style={styles.taskAssignAt} numberOfLines={2}>
            {'Assigned on: '}
            {timestampToDate(task?.created_at)}
          </Text>
        </View>
        <Text
          style={[
            styles.taskStatus,
            {
              color: taskStyle.iconColor,
              backgroundColor: taskStyle.bg,
            },
          ]}
        >
          {toCapitalize(task.task_status)}
        </Text>
      </View>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text>
        {IS_ADMIN || IS_PM
          ? 'Tasks not added yet'
          : 'Task have not assigned to you yet'}
      </Text>
    </View>
  );

  const renderMember = ({ item: member }: { item: UserType }) => {
    const memberColor =
      member.role === RolesType.Project_Manager
        ? {
            text: appColors.MEMBER_PROJECT_MANAGER,
            bg: appColors.MEMBER_PROJECT_MANAGER_BG,
          }
        : member.role === RolesType.Developer
        ? {
            text: appColors.MEMBER_DEV,
            bg: appColors.MEMBER_DEV_BG,
          }
        : member.role === RolesType.Mobile_Developer
        ? {
            text: appColors.MEMBER_MOB_DEV,
            bg: appColors.MEMBER_MOB_DEV_BG,
          }
        : member.role === RolesType.Web_Developer
        ? {
            text: appColors.MEMBER_WEB_DEV,
            bg: appColors.MEMBER_WEB_DEV_BG,
          }
        : member.role === RolesType.QA
        ? {
            text: appColors.MEMBER_QA,
            bg: appColors.MEMBER_QA_BG,
          }
        : member.role === RolesType.UI_UX
        ? {
            text: appColors.MEMBER_UI,
            bg: appColors.MEMBER_UI_BG,
          }
        : member.role === RolesType.Admin
        ? {
            text: appColors.MEMBER_ADMIN,
            bg: appColors.MEMBER_ADMIN_BG,
          }
        : {
            text: appColors.MEMBER,
            bg: appColors.MEMBER_BG,
          };

    return (
      <View style={styles.memberCard}>
        <View style={styles.profileContainer}>
          <BaseIcon
            name="User"
            size={appFonts.FONT_24}
            color={appColors.PRIMARY}
          />
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {member.id === user?.id && (
              <Text style={{ fontWeight: 'bold' }}>{'(You)'}&nbsp;</Text>
            )}
            {toCapitalize(member.name)}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {member.email}
          </Text>
        </View>
        <View
          style={[styles.roleContainer, { backgroundColor: memberColor.bg }]}
        >
          <Text style={{ color: memberColor.text }}>{member.role}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isLoading ? (
        <BaseLoader />
      ) : !project ? (
        <Text>{'Project not found'}</Text>
      ) : (
        <>
          <View style={styles.projectInfoContainer}>
            {project.is_archived && (
              <Text style={{ color: appColors.DANGER_TEXT }}>
                {'This is archived project'}
              </Text>
            )}
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <View
                style={[
                  styles.statusCard,
                  project?.status === ProjectStatusType.ACTIVE
                    ? styles.activeStatusCard
                    : project?.status === ProjectStatusType.COMPLETED &&
                      styles.completedStatusCard,
                ]}
              >
                <Text
                  style={[
                    styles.projectStatus,
                    project?.status === ProjectStatusType.ACTIVE
                      ? styles.activeStatus
                      : project?.status === ProjectStatusType.COMPLETED &&
                        styles.completedStatus,
                  ]}
                >
                  {project?.status}
                </Text>
              </View>
              {IS_ADMIN && (
                <View style={{ flexDirection: 'row' }}>
                  <Text
                    style={[styles.linkText, { color: appColors.DANGER_TEXT }]}
                    onPress={() => handleConfirm(OperationTypes.DELETE)}
                  >
                    {'Delete'}
                  </Text>
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      handleConfirm(
                        project?.is_archived
                          ? OperationTypes.RESTORE
                          : OperationTypes.ARCHIVE,
                      )
                    }
                  >
                    {project?.is_archived ? 'Restore' : 'Archive'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.projectHeaderContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{toCapitalize(project?.title)}</Text>
                <View style={styles.clientInfoContainer}>
                  <BaseIcon name="Building" />
                  <Text style={styles.clientText}>
                    {'Client:'} {toCapitalize(project?.client_name)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setMemberListModal(true)}>
                <Text style={styles.descriptionTitle}>
                  {project?.member_list.length}&nbsp;
                  {(project?.member_list.length ?? 0) > 1
                    ? 'Members'
                    : 'Member'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>{'Description'}</Text>
            <Text style={styles.description}>{project?.description}</Text>
          </View>

          <View>
            <View style={styles.taskHeaderRow}>
              <Text style={styles.projectTask}>{'Project Tasks'}</Text>
              {(IS_ADMIN || IS_PM) && !project?.is_archived && (
                <Text
                  style={styles.newTask}
                  onPress={() =>
                    navigation.navigate('TaskForm', {
                      projectId: project?.id,
                    })
                  }
                >
                  {'Add Task'}
                </Text>
              )}
            </View>
            <FlatList
              data={taskList.slice(0, 3)}
              renderItem={renderItem}
              ListEmptyComponent={ListEmptyComponent}
              ListFooterComponent={() =>
                taskList.length > 3 && (
                  <Text
                    style={{
                      alignSelf: 'center',
                      margin: hp(1),
                      color: appColors.PRIMARY,
                    }}
                    onPress={() => {
                      navigation.navigate('TaskStack', {
                        screen: 'Task',
                        params: {
                          projectId: project.id,
                        },
                      });
                    }}
                  >
                    {'See more tasks'}
                  </Text>
                )
              }
            />
          </View>

          <BaseModal
            visible={memberListModal}
            onRequestClose={() => {
              setMemberListModal(false);
            }}
            modalTitle="Member List"
          >
            {isMemberListLoading ? (
              <BaseLoader />
            ) : (
              <FlatList data={memberList} renderItem={renderMember} />
            )}
          </BaseModal>
        </>
      )}
    </ScrollView>
  );
};

export default ProjectDetailScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: wp(3),
    paddingBottom: hp(5),
  },
  projectInfoContainer: {
    gap: hp(1),
  },
  projectHeaderContainer: {
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'center',
  },
  statusCard: {
    alignSelf: 'flex-start',
    padding: wp(1),
    paddingHorizontal: wp(3),
    borderRadius: wp(10),
    backgroundColor: appColors.PROJECT_IN_ACTIVE_BG,
  },
  activeStatusCard: {
    backgroundColor: appColors.PROJECT_ACTIVE_BG,
  },
  completedStatusCard: {
    backgroundColor: appColors.PROJECT_COMPLETED_BG,
  },
  projectStatus: {
    fontWeight: 'bold',
    color: appColors.PROJECT_IN_ACTIVE,
  },
  activeStatus: {
    color: appColors.PROJECT_ACTIVE,
  },
  completedStatus: {
    color: appColors.PROJECT_COMPLETED,
  },
  linkText: {
    color: appColors.PRIMARY,
    fontWeight: '500',
    marginHorizontal: wp(2),
  },
  title: {
    fontSize: appFonts.FONT_18,
    fontWeight: '600',
  },
  clientInfoContainer: {
    flexDirection: 'row',
    gap: wp(1),
  },
  clientText: {
    fontSize: appFonts.FONT_12,
    fontWeight: '400',
  },
  descriptionContainer: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    padding: wp(3),
    borderRadius: wp(3),
    elevation: 5,
    marginVertical: hp(2),
  },
  descriptionTitle: {
    color: appColors.SECONDARY_TEXT,
    fontWeight: 'bold',
  },
  description: {},
  projectTask: {
    color: appColors.SECONDARY_TEXT,
    fontWeight: 'bold',
  },
  newTask: {
    color: appColors.PRIMARY,
  },
  emptyContainer: {
    height: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskCard: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    padding: wp(3),
    borderRadius: wp(3),
    elevation: 2,
    marginVertical: hp(0.5),
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: '500',
  },
  taskMember: {
    fontSize: appFonts.FONT_10,
    color: appColors.SECONDARY_TEXT,
  },
  taskAssignAt: {
    fontSize: 10,
    fontWeight: '300',
    color: appColors.SECONDARY_TEXT,
  },
  taskStatus: {
    paddingHorizontal: wp(2),
    borderRadius: wp(1.5),
  },
  memberCard: {
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    borderRadius: wp(3),
    marginVertical: hp(0.5),
    padding: wp(2),
  },
  profileContainer: {
    height: wp(12),
    width: wp(12),
    borderRadius: wp(12),
    backgroundColor: appColors.PRIMARY_LIGHT_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContainer: {
    gap: hp(0.5),
    flex: 1,
  },
  name: {
    fontSize: appFonts.FONT_12,
  },
  email: {
    fontSize: appFonts.FONT_10,
    color: appColors.SECONDARY_TEXT,
  },
  roleContainer: {
    alignSelf: 'center',
    backgroundColor: 'red',
    paddingVertical: wp(0.5),
    paddingHorizontal: wp(1),
    borderRadius: wp(1.5),
  },
});
