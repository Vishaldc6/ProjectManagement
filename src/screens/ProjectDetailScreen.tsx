import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

import { taskRef } from '../firebase/taskCollection';
import appColors from '../styles/appColors';
import appFonts from '../styles/appFonts';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { ProjectType, TaskType } from '../types/appTypes';
import { fetchSingleProject } from '../firebase/projectCollection';
import { BaseIcon, BaseLoader } from '../components';
import { useAppSelector } from '../hooks/reduxHooks';
import { timestampToDate, toCapitalize } from '../utils/helperFunctions';
import { useAppRoutes } from '../hooks/useAppRoute';

const ProjectDetailScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);
  const IS_ADMIN = user?.role === 'Admin';

  const { params } = useAppRoutes<'ProjectDetail'>();
  const navigation = useAppNavigation('ProjectDetail');

  const [isLoading, setIsLoading] = useState(false);
  const [taskList, setTaskList] = useState<TaskType[]>([]);
  const [project, setProject] = useState<ProjectType | undefined>();

  useEffect(() => {
    if (params?.id) {
      setIsLoading(true);
      fetchSingleProject(params?.id).then(res => {
        setProject(res);
        setIsLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    let q = query(
      taskRef,
      where('project_id', '==', params?.id),
      orderBy('updated_at', 'desc'),
    );

    if (!IS_ADMIN) {
      q = query(
        taskRef,
        where('assigned_to', '==', user?.id),
        where('project_id', '==', params?.id),
        orderBy('updated_at', 'desc'),
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
  }, []);

  const renderItem = ({ item: task }: { item: TaskType }) => {
    const taskIcon =
      task.task_status === 'DONE'
        ? 'CircleCheck'
        : task.task_status === 'IN-PROGRESS'
        ? 'CircleDot'
        : 'Circle';

    const taskIconTextColor =
      task.task_status === 'DONE'
        ? appColors.TASK_DONE
        : task.task_status === 'IN-PROGRESS'
        ? appColors.TASK_IN_PROGRESS
        : appColors.TASK_TODO;

    const statusBgColor =
      task.task_status === 'DONE'
        ? appColors.TASK_DONE_BG
        : task.task_status === 'IN-PROGRESS'
        ? appColors.TASK_IN_PROGRESS_BG
        : appColors.TASK_TODO_BG;

    return (
      <View style={styles.taskCard}>
        <BaseIcon name={taskIcon} color={taskIconTextColor} />
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.title}
          </Text>
          {IS_ADMIN && (
            <Text style={styles.taskMember} numberOfLines={1}>
              {task.assigned_member}
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
            { color: taskIconTextColor, backgroundColor: statusBgColor },
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
        {IS_ADMIN ? 'Tasks not added yet' : 'Task have not assigned to you yet'}
      </Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isLoading ? (
        <BaseLoader />
      ) : !project ? (
        <Text>{'Project not found'}</Text>
      ) : (
        <>
          <View style={styles.projectInfoContainer}>
            <View
              style={[
                styles.statusCard,
                project?.status === 'ACTIVE'
                  ? styles.activeStatusCard
                  : project?.status === 'COMPLETED' &&
                    styles.completedStatusCard,
              ]}
            >
              <Text
                style={[
                  styles.projectStatus,
                  project?.status === 'ACTIVE'
                    ? styles.activeStatus
                    : project?.status === 'COMPLETED' && styles.completedStatus,
                ]}
              >
                {project?.status}
              </Text>
            </View>
            <View style={styles.projectHeaderContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{project?.title}</Text>
                <View style={styles.clientInfoContainer}>
                  <BaseIcon name="Building" />
                  <Text style={styles.clientText}>
                    {'Client:'} {project?.client_name}
                  </Text>
                </View>
              </View>
              <View>
                <Text style={styles.descriptionTitle}>
                  {project?.member_list.length}&nbsp;
                  {(project?.member_list.length ?? 0) > 1
                    ? 'Members'
                    : 'Member'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>{'Description'}</Text>
            <Text style={styles.description}>{project?.description}</Text>
          </View>

          <View>
            <View style={styles.taskHeaderRow}>
              <Text style={styles.projectTask}>
                {'Project Tasks'}&nbsp;
                {taskList.length > 0 && `(${taskList.length})`}
              </Text>
              {IS_ADMIN && (
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
              data={taskList}
              renderItem={renderItem}
              ListEmptyComponent={ListEmptyComponent}
            />
          </View>
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
});
