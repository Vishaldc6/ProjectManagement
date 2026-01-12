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
import { onSnapshot, orderBy, query } from '@react-native-firebase/firestore';

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

const ProjectScreen = () => {
  const navigation = useAppNavigation('Project');

  const [isLoading, setIsLoading] = useState(true);
  const [projectList, setProjectList] = useState<ProjectType[]>([]);
  const [isModalVisiable, setIsModalVisiable] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [filterProjectList, setFilterProjectList] =
    useState<ProjectType[]>(projectList);

  useEffect(() => {
    const q = query(projectRef, orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const projects: ProjectType[] = [];
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
          proj.client_name.toLowerCase().startsWith(searchText.toLowerCase()),
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
        <View style={styles.projectImg}>{/* folder icon */}</View>
        <View style={styles.projectDetail}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.client}>{item.client_name}</Text>
        </View>
        {/* arrow */}
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text>
        {filterProjectList.length === 0 && searchText
          ? 'Search project or client not found'
          : 'Project not found!'}
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
          placeholder="Search Project name or client name"
          containerStyle={{ flex: 1 }}
          style={{ backgroundColor: appColors.SECONDARY_INPUT_BACKGROUND }}
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
        renderItem={renderProject}
        ListEmptyComponent={ListEmptyComponent}
      />

      <BaseFloatingButton
        name="Plus"
        onPress={() => navigation.navigate('ProjectForm')}
      />

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
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    flexDirection: 'row',
    gap: wp(3),
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    elevation: 5,
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
  projectDetail: {
    gap: hp(0.5),
  },
  projectImg: {
    backgroundColor: appColors.PRIMARY,
    width: wp(15),
    height: wp(15),
    borderRadius: wp(15),
  },
  title: {
    fontSize: appFonts.FONT_12,
    fontWeight: '500',
  },
  client: {},
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
