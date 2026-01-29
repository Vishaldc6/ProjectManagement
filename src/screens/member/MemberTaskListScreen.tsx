import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  FieldPath,
  FirebaseFirestoreTypes,
  getDocs,
  limit,
  or,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';

import { ProjectType, TaskStatusEnum, TaskType } from '../../types/appTypes';
import { taskRef } from '../../firebase/taskCollection';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import appFonts from '../../styles/appFonts';
import appColors from '../../styles/appColors';
import { TASK_STATUS_LIST } from '../../constants';
import { BaseDropDown, BaseIndicator } from '../../components';
import { toCapitalize } from '../../utils/helperFunctions';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useAppRoutes } from '../../hooks/useAppRoute';
import {
  fetchProjects,
  resetProjectList,
} from '../../redux/slices/ProjectSlice';

const MemberTaskListScreen = () => {
  const { params } = useAppRoutes<'Task'>();
  const navigation = useAppNavigation('Task');

  const dispatch = useAppDispatch();

  const { user } = useAppSelector(state => state.AuthReducer);
  const { hasMore: hasMoreProjects, lastDoc: lastProjectDoc } = useAppSelector(
    state => state.ProjectReducer,
  );
  const IS_ADMIN = user?.role === 'Admin';

  const [projects, setProjects] = useState<Partial<ProjectType>[]>([]);
  const [taskList, setTaskList] = useState<TaskType[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState<
    string | undefined | Partial<ProjectType>
  >(undefined);

  const TASK_PAGE_LIMIT = 10;
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<
    FirebaseFirestoreTypes.DocumentData | undefined
  >(undefined);
  const [isRefreshLoading, setIsRefreshLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsSearchLoading(true);
      loadTasks();
    }, [selectedProject, selectedStatus]),
  );

  useEffect(() => {
    params?.projectId && setSelectedProject(params.projectId ?? '');
    dispatch(resetProjectList());
    loadProjects(true);
  }, [params]);

  const loadProjects = (init = false) => {
    dispatch(
      fetchProjects({
        init,
        isAdmin: IS_ADMIN,
        lastDoc: lastProjectDoc,
        userId: user?.id,
      }),
    )
      .unwrap()
      .then(res => {
        console.log({ res });
        setProjects(prev => [
          ...(init
            ? [
                {
                  title: 'All',
                  id: undefined,
                },
              ]
            : prev),
          ...res.projectList.map(p => ({ ...p, title: toCapitalize(p.title) })),
        ]);
      });
  };

  const loadTasks = (next = false) => {
    let q = query(
      taskRef,
      where('is_archived', '==', false),
      where('is_deleted', '==', false),
      orderBy('created_at', 'desc'),
      limit(TASK_PAGE_LIMIT),
    );

    if (!IS_ADMIN) {
      const or_q = or(
        where('assigned_to', '==', user?.id),
        where('created_by', '==', user?.id),
      );
      q = query(q, or_q);
    }

    if (selectedProject) {
      q = q.where(new FieldPath('project_id'), '==', selectedProject);
    }

    if (selectedStatus !== 'ALL') {
      q = q.where(new FieldPath('task_status'), '==', selectedStatus);
    }

    if (lastDoc && next) {
      q = q.startAfter(lastDoc);
    }

    console.log({ q });

    const tasks: TaskType[] = [];
    getDocs(q)
      .then((querysnapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
        querysnapshot.forEach((doc: any) => tasks.push(doc.data()));
        setLastDoc(querysnapshot.docs.at(-1));
        setHasMore(tasks.length >= TASK_PAGE_LIMIT);
        setTaskList(prev => (next ? [...prev, ...tasks] : tasks));
        setIsRefreshLoading(false);
        setIsSearchLoading(false);
      })
      .catch(error => {
        console.log({ error });
        setLastDoc(undefined);
        setHasMore(false);
        setTaskList([]);
        setIsRefreshLoading(false);
        setIsSearchLoading(false);
      });
  };

  const renderItem = ({ item: task }: { item: TaskType }) => {
    const taskColorStyle = {
      color:
        task.task_status === TaskStatusEnum.DONE
          ? appColors.TASK_DONE
          : task.task_status === TaskStatusEnum.IN_PROGRESS
          ? appColors.TASK_IN_PROGRESS
          : appColors.TASK_TODO,
      backgroundColor:
        task.task_status === TaskStatusEnum.DONE
          ? appColors.TASK_DONE_BG
          : task.task_status === TaskStatusEnum.IN_PROGRESS
          ? appColors.TASK_IN_PROGRESS_BG
          : appColors.TASK_TODO_BG,
    };

    return (
      <TouchableOpacity
        style={styles.taskCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('TaskDetail', {
            id: task.id,
          });
        }}
      >
        <View style={styles.detailRow}>
          <Text style={styles.projectTitle}>{task.project_title}</Text>
          <Text style={[styles.taskStatus, taskColorStyle]}>
            {toCapitalize(task.task_status)}
          </Text>
        </View>
        <Text style={styles.taskTitle}>{task.title}</Text>
        {IS_ADMIN && (
          <Text style={styles.taskMember}>
            {toCapitalize(task.assigned_member)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = memo(() => (
    <View style={styles.emptyContainer}>
      <Text>
        {selectedStatus !== 'ALL'
          ? 'Tasks not found'
          : 'No tasks assigned to you yet!'}
      </Text>
    </View>
  ));

  const ListFooterComponent = memo(() => hasMore && <BaseIndicator />);

  const onRefresh = () => {
    setIsRefreshLoading(true);
    setSelectedProject(undefined);
    setSelectedStatus('ALL');
    loadTasks();
    loadProjects(true);
  };

  const onEndReached = () => hasMore && loadTasks(true);

  return (
    <View style={styles.container}>
      <BaseDropDown
        data={projects}
        labelField={'title'}
        value={selectedProject}
        onChange={val => setSelectedProject(val.id)}
        valueField={'id'}
        maxHeight={hp(15)}
        autoScroll={false}
        flatListProps={{
          ListFooterComponent: hasMoreProjects ? <BaseIndicator /> : null,
          onEndReachedThreshold: 0.2,
          onEndReached: () => {
            hasMoreProjects && loadProjects();
          },
        }}
      />
      <View>
        <ScrollView
          style={{ alignSelf: 'flex-start' }}
          contentContainerStyle={styles.filterContainer}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {['ALL', ...TASK_STATUS_LIST].map(status => {
            return (
              <TouchableOpacity
                style={[
                  styles.filterStatusContainer,
                  selectedStatus === status && styles.selectedStatusContainer,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterStatus,
                    selectedStatus === status && styles.selectedStatus,
                  ]}
                >
                  {toCapitalize(status)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {isSearchLoading ? (
        <View style={styles.loaderContainer}>
          <BaseIndicator />
        </View>
      ) : (
        <FlatList
          initialNumToRender={TASK_PAGE_LIMIT}
          data={taskList}
          renderItem={renderItem}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.taskList}
          ListFooterComponent={ListFooterComponent}
          refreshing={isRefreshLoading}
          onRefresh={onRefresh}
          onEndReachedThreshold={0.2}
          onEndReached={onEndReached}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default MemberTaskListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    gap: hp(1),
  },
  taskList: {
    flexGrow: 1,
    paddingBottom: hp(5),
  },
  taskCard: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    padding: wp(3),
    elevation: 5,
    borderRadius: wp(3),
    gap: hp(0.5),
    marginVertical: hp(0.5),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectTitle: {
    color: appColors.SECONDARY_TEXT,
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: appFonts.FONT_12,
    fontWeight: '700',
  },
  taskMember: {
    fontSize: appFonts.FONT_10,
    color: appColors.SECONDARY_TEXT,
  },
  taskStatus: {
    paddingHorizontal: wp(2),
    borderRadius: wp(1.5),
  },
  filterContainer: {
    gap: wp(2),
  },
  filterStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: wp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(5),
  },
  selectedStatusContainer: {
    backgroundColor: 'black',
  },
  filterStatus: {
    fontSize: appFonts.FONT_12,
  },
  selectedStatus: {
    color: 'white',
  },
  emptyContainer: {
    height: hp(70),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: { height: '80%', justifyContent: 'center' },
});
