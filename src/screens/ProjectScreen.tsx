import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

import { useAppNavigation } from '../hooks/useAppNavigation';
import { projectRef } from '../firebase/projectCollection';
import { ProjectType } from '../types/appTypes';
import appColors from '../styles/appColors';
import appFonts from '../styles/appFonts';
import {
  BaseFloatingButton,
  BaseIcon,
  BaseInput,
  BaseLoader,
} from '../components';
import { PROJECT_STATUS_LIST } from '../constants';
import { toCapitalize } from '../utils/helperFunctions';
import { useAppSelector } from '../hooks/reduxHooks';

const ProjectScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);
  const navigation = useAppNavigation('Project');

  const IS_ADMIN = user?.role === 'Admin';
  const [isLoading, setIsLoading] = useState(true);
  const [projectList, setProjectList] = useState<ProjectType[]>([]);
  const [isModalVisiable, setIsModalVisiable] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [filterProjectList, setFilterProjectList] = useState<ProjectType[]>();

  useEffect(() => {
    let q;
    if (IS_ADMIN) {
      q = query(projectRef, orderBy('updated_at', 'desc'));
    } else {
      q = query(
        projectRef,
        where('member_list', 'array-contains', user?.id),
        orderBy('updated_at', 'desc'),
      );
    }

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const projects: ProjectType[] = [];
      querySnapshot &&
        querySnapshot.forEach((doc: any) => projects.push(doc.data()));
      setProjectList(projects);
      setFilterProjectList(projects);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let list = projectList;
    if (searchText) {
      list = list.filter(
        proj =>
          proj.title.toLowerCase().startsWith(searchText.toLowerCase()) ||
          (IS_ADMIN
            ? proj.client_name
                .toLowerCase()
                .startsWith(searchText.toLowerCase())
            : false),
      );
    }
    if (selectedFilter !== 'ALL') {
      list = list.filter(
        proj => proj.status.toLowerCase() === selectedFilter.toLowerCase(),
      );
    }
    setFilterProjectList(list);
  }, [searchText, selectedFilter]);

  const renderProject = ({ item }: { item: ProjectType }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.projectCard}
        onPress={() =>
          navigation.navigate('ProjectDetail', {
            id: item.id,
          })
        }
      >
        <View style={styles.projectImg}>
          <BaseIcon name="FolderOpen" color={appColors.PRIMARY} />
        </View>
        <View style={styles.projectDetail}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.client} numberOfLines={1}>
            {item.client_name}
          </Text>
        </View>
        <BaseIcon name="ChevronRight" color={appColors.BORDER} />
      </TouchableOpacity>
    );
  };

  const renderMemberProject = ({ item }: { item: ProjectType }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.memberProjectCard}
        onPress={() =>
          navigation.navigate('ProjectDetail', {
            id: item.id,
          })
        }
      >
        <View style={styles.memberProjectSubCard}>
          <View style={styles.memberProjectInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.clientInfoContainer}>
              <BaseIcon
                name="Building"
                color={appColors.SECONDARY_TEXT}
                size={appFonts.FONT_18}
              />
              <Text style={styles.client} numberOfLines={1}>
                {item?.client_name}
              </Text>
            </View>
          </View>

          <BaseIcon name="ChevronRight" color={appColors.BORDER} />
        </View>
        <View
          style={[
            styles.statusCard,
            item?.status === 'ACTIVE'
              ? styles.activeStatusCard
              : item?.status === 'COMPLETED' && styles.completedStatusCard,
          ]}
        >
          <Text
            style={[
              styles.projectStatus,
              item?.status === 'ACTIVE'
                ? styles.activeStatus
                : item?.status === 'COMPLETED' && styles.completedStatus,
            ]}
          >
            {toCapitalize(item?.status)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text>
        {filterProjectList?.length === 0 && searchText
          ? IS_ADMIN
            ? 'Searched project or client not found'
            : 'Searched project not found'
          : 'Projects not found!'}
      </Text>
    </View>
  );

  const toggleModal = () => {
    setIsModalVisiable(!isModalVisiable);
  };

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
      <View style={styles.searchHeader}>
        <BaseInput
          value={searchText}
          onChangeText={text => setSearchText(text)}
          placeholder={
            IS_ADMIN
              ? 'Search Project name or client name'
              : 'Search Project name'
          }
          containerStyle={{ flex: 1 }}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.filterIconContainer}
          onPress={toggleModal}
        >
          <BaseIcon name="SlidersHorizontal" color={appColors.PRIMARY_TEXT} />
        </TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={styles.listContainer}
        data={filterProjectList}
        renderItem={IS_ADMIN ? renderProject : renderMemberProject}
        ListEmptyComponent={ListEmptyComponent}
      />

      {IS_ADMIN && (
        <BaseFloatingButton
          name="Plus"
          onPress={() => navigation.navigate('ProjectForm')}
        />
      )}

      <Modal
        animationType="slide"
        backdropColor={appColors.LOADER_BACKGROUND}
        visible={isModalVisiable}
        onRequestClose={toggleModal}
        statusBarTranslucent
      >
        <View style={styles.modalView}>
          <View style={styles.modalContentView}>
            <BaseIcon name="X" style={styles.closeIcon} onPress={toggleModal} />
            <Text style={styles.modalTitle}>{'Filter Project by status'}</Text>
            <View style={styles.filterList}>
              {['ALL', ...PROJECT_STATUS_LIST].map(status => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedFilter(status);
                    toggleModal();
                  }}
                  style={[
                    styles.filterStatusContainer,
                    selectedFilter === status && styles.selectedStatusContainer,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterStatus,
                      selectedFilter === status && styles.selectedFilterStatus,
                    ]}
                  >
                    {toCapitalize(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProjectScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: {
    flexDirection: 'row',
    gap: wp(3),
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingBottom: hp(1),
    paddingTop: hp(2),
  },
  filterIconContainer: {
    backgroundColor: appColors.PRIMARY_LIGHT_BACKGROUND,
    padding: wp(2),
    borderRadius: wp(2),
  },
  listContainer: {
    paddingTop: hp(2),
    paddingBottom: hp(5),
  },
  projectCard: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    borderColor: appColors.BORDER,
    borderWidth: 1,
    marginHorizontal: wp(3),
    borderRadius: wp(2),
    padding: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(0.8),
  },
  memberProjectCard: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    borderColor: appColors.BORDER,
    borderWidth: 1,
    marginHorizontal: wp(3),
    borderRadius: wp(2),
    padding: wp(3),
    gap: wp(3),
    marginBottom: hp(0.8),
  },
  memberProjectSubCard: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  memberProjectInfo: {
    flex: 1,
    gap: hp(0.5),
  },
  projectDetail: {
    flex: 1,
    gap: hp(0.5),
  },
  projectImg: {
    backgroundColor: appColors.PRIMARY_LIGHT_BACKGROUND,
    width: wp(15),
    height: wp(15),
    borderRadius: wp(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: appFonts.FONT_12,
    fontWeight: '500',
  },
  clientInfoContainer: {
    flexDirection: 'row',
    gap: wp(1),
  },
  client: {
    fontSize: appFonts.FONT_12,
    color: appColors.SECONDARY_TEXT,
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
  emptyContainer: {
    height: hp(75),
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBtn: {
    backgroundColor: appColors.PRIMARY,
    padding: wp(5),
    borderRadius: wp(50),
    elevation: 3,
    position: 'absolute',
    bottom: hp(5),
    right: wp(5),
  },
  modalView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContentView: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    padding: wp(4),
    paddingBottom: hp(4),
    borderTopRightRadius: wp(3),
    borderTopLeftRadius: wp(3),
  },
  closeIcon: {
    alignSelf: 'flex-end',
  },
  modalTitle: {
    fontSize: appFonts.FONT_16,
    fontWeight: '500',
  },
  filterList: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    marginVertical: hp(1.5),
    gap: wp(3),
    flexWrap: 'wrap',
  },
  filterStatusContainer: {
    borderWidth: 1,
    paddingHorizontal: wp(4),
    borderRadius: wp(5),
  },
  selectedStatusContainer: {
    backgroundColor: appColors.PRIMARY_LIGHT_BACKGROUND,
    borderColor: appColors.PRIMARY,
  },
  filterStatus: {
    fontSize: appFonts.FONT_14,
  },
  selectedFilterStatus: {
    color: appColors.PRIMARY,
  },
});
