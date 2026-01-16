import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { onSnapshot, query, where } from '@react-native-firebase/firestore';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import { TaskType } from '../../types/appTypes';
import { taskRef } from '../../firebase/taskCollection';
import { useAppSelector } from '../../hooks/reduxHooks';
import appFonts from '../../styles/appFonts';
import appColors from '../../styles/appColors';
import { TASK_STATUS_LIST } from '../../constants';
import { BaseLoader } from '../../components';
import { toCapitalize } from '../../utils/helperFunctions';
import { useAppNavigation } from '../../hooks/useAppNavigation';

const MemberTaskListScreen = () => {
  const navigation = useAppNavigation('Task');

  const { user } = useAppSelector(state => state.AuthReducer);
  const IS_ADMIN = user?.role === 'Admin';

  const [isLoading, setIsLoading] = useState(true);
  const [taskList, setTaskList] = useState<TaskType[]>([]);
  const [filteredTaskList, setFilteredTaskList] = useState<TaskType[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    let q = query(taskRef, where('assigned_to', '==', user?.id));
    if (IS_ADMIN) {
      q = query(taskRef);
    }

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const tasks: TaskType[] = [];
      querySnapshot &&
        querySnapshot.forEach((doc: any) => {
          tasks.push(doc.data());
        });
      setTaskList(tasks);
      setFilteredTaskList(tasks);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setFilteredTaskList(
      selectedStatus === 'ALL'
        ? taskList
        : taskList.filter(task => task.task_status === selectedStatus),
    );
  }, [selectedStatus]);

  const renderItem = ({ item: task }: { item: TaskType }) => {
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
          <Text
            style={[
              styles.taskStatus,
              { color: taskIconTextColor, backgroundColor: statusBgColor },
            ]}
          >
            {toCapitalize(task.task_status)}
          </Text>
        </View>
        <Text style={styles.taskTitle}>{task.title}</Text>
        {IS_ADMIN && (
          <Text style={styles.taskMember}>{task.assigned_member}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text>
        {selectedStatus !== 'ALL'
          ? 'Tasks not found'
          : 'No tasks assigned to you yet!'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
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
        <FlatList
          data={filteredTaskList}
          renderItem={renderItem}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{
            paddingHorizontal: wp(3),
            paddingBottom: hp(10),
          }}
        />
      </View>
    </View>
  );
};

export default MemberTaskListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: wp(3),
    marginVertical: hp(1),
  },
  filterStatusContainer: {
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
});
