import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';

import { useAppNavigation } from '../hooks/useAppNavigation';
import { ProjectStatusType, ProjectType } from '../types/appTypes';
import appColors from '../styles/appColors';
import appFonts from '../styles/appFonts';
import {
  BaseFloatingButton,
  BaseIcon,
  BaseIndicator,
  BaseInput,
  BaseLoader,
  BaseModal,
} from '../components';
import { PROJECT_STATUS_LIST } from '../constants';
import { debounce, toCapitalize } from '../utils/helperFunctions';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { useAppRoutes } from '../hooks/useAppRoute';
import {
  fetchProjects,
  PROJECT_PAGE_SIZE,
  resetProjectList,
} from '../redux/slices/ProjectSlice';

const ProjectScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);
  const { params } = useAppRoutes<'Project'>();
  const navigation = useAppNavigation('Project');

  const dispatch = useAppDispatch();
  const { projectList, lastDoc, hasMore } = useAppSelector(
    state => state.ProjectReducer,
  );

  const IS_ADMIN = user?.role === 'Admin';

  const [isLoading, setIsLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisiable, setIsModalVisiable] = useState(false);

  const [searchText, setSearchText] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      setSearchText('');
      setSelectedFilter('ALL');
      dispatch(resetProjectList());
      loadData(true);
    }, []),
  );

  const loadData = async (init = false) => {
    dispatch(
      fetchProjects({
        init,
        isAdmin: IS_ADMIN,
        lastDoc: lastDoc,
        seeArchive: params?.seeArchive,
        userId: user?.id,
        searchStatus: selectedFilter,
        searchTitle: searchText,
      }),
    )
      .unwrap()
      .then(res => {
        setIsLoading(false);
        setIsSearchLoading(false);
        setIsRefreshing(false);
      })
      .catch(error => {
        console.log({ error });
        setIsLoading(false);
        setIsSearchLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    setIsSearchLoading(true);
    loadData(true);
  }, [searchText, selectedFilter]);

  // -- NEED TO CHECK: issue
  // const debouncedFunc = useCallback(debounce(loadSearchData, 2000), []);

  const onRefresh = () => {
    setIsRefreshing(true);
    setSearchText('');
    setSelectedFilter('ALL');
    loadData(true);
  };

  const AdminProjectCard = memo(({ project }: { project: ProjectType }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.projectCard}
        onPress={() =>
          navigation.navigate('ProjectDetail', {
            id: project.id,
          })
        }
      >
        <View style={styles.projectImg}>
          <BaseIcon name="FolderOpen" color={appColors.PRIMARY} />
        </View>
        <View style={styles.projectDetail}>
          <Text style={styles.title} numberOfLines={1}>
            {toCapitalize(project.title)}
          </Text>
          <Text style={styles.client} numberOfLines={1}>
            {toCapitalize(project.client_name)}
          </Text>
        </View>
        <BaseIcon name="ChevronRight" color={appColors.BORDER} />
      </TouchableOpacity>
    );
  });

  const MemberProjectCard = memo(({ project }: { project: ProjectType }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.memberProjectCard}
        onPress={() =>
          navigation.navigate('ProjectDetail', {
            id: project.id,
          })
        }
      >
        <View style={styles.memberProjectSubCard}>
          <View style={styles.memberProjectInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {toCapitalize(project.title)}
            </Text>
            <View style={styles.clientInfoContainer}>
              <BaseIcon
                name="Building"
                color={appColors.SECONDARY_TEXT}
                size={appFonts.FONT_18}
              />
              <Text style={styles.client} numberOfLines={1}>
                {toCapitalize(project?.client_name)}
              </Text>
            </View>
          </View>

          <BaseIcon name="ChevronRight" color={appColors.BORDER} />
        </View>
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
            {toCapitalize(project?.status)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  });

  const renderProject = ({ item }: { item: ProjectType }) => {
    return IS_ADMIN ? (
      <AdminProjectCard project={item} />
    ) : (
      <MemberProjectCard project={item} />
    );
  };

  const ListEmptyComponent = memo(() => (
    <View style={styles.emptyContainer}>
      <Text>
        {projectList?.length === 0 && searchText.trim().length
          ? IS_ADMIN
            ? 'Searched project or client not found'
            : 'Searched project not found'
          : 'Projects not found!'}
      </Text>
    </View>
  ));

  const listHeaderTitle = useMemo(() => {
    let title = params?.seeArchive ? 'Archived Projects' : 'Projects';
    return searchText.trim().length
      ? `Searched ${title}`
      : selectedFilter !== 'ALL'
      ? `Filtered ${title} (by ${toCapitalize(selectedFilter)})`
      : `All ${title}`;
  }, [searchText, selectedFilter]);

  const ListHeaderComponent = memo(() => (
    <Text style={styles.listHeader}>{listHeaderTitle}</Text>
  ));

  const toggleModal = () => setIsModalVisiable(!isModalVisiable);

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
      <View style={styles.searchHeader}>
        <BaseInput
          value={searchText}
          onChangeText={text => {
            // debouncedFunc(text);
            setSearchText(text);
          }}
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

      {!isLoading && isSearchLoading ? (
        <View style={styles.loaderContainer}>
          <BaseIndicator />
        </View>
      ) : (
        <FlatList
          initialNumToRender={PROJECT_PAGE_SIZE}
          contentContainerStyle={styles.listContainer}
          data={projectList}
          renderItem={renderProject}
          ListEmptyComponent={ListEmptyComponent}
          onEndReachedThreshold={0.2}
          onEndReached={() => hasMore && loadData()}
          ListFooterComponent={() => hasMore && <BaseIndicator />}
          ListHeaderComponent={ListHeaderComponent}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          overScrollMode="always"
          alwaysBounceVertical
        />
      )}

      {IS_ADMIN && !params?.seeArchive && (
        <BaseFloatingButton
          name="Plus"
          onPress={() => navigation.navigate('ProjectForm')}
        />
      )}

      <BaseModal
        visible={isModalVisiable}
        onRequestClose={toggleModal}
        backDropContainerStyle={styles.backDropContainerStyle}
        modalContainerStyle={styles.modalContainerStyle}
        modalTitle="Filter Project by status"
      >
        <View style={styles.filterList}>
          {PROJECT_STATUS_LIST.map(status => (
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
          {IS_ADMIN && !params?.seeArchive && (
            <Text
              style={styles.linkText}
              onPress={() => {
                toggleModal();
                navigation.push('Project', {
                  seeArchive: true,
                });
              }}
            >
              {'See Archive'}
            </Text>
          )}
        </View>
      </BaseModal>
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
    flexGrow: 1,
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
  backDropContainerStyle: {
    justifyContent: 'flex-end',
  },
  modalContainerStyle: {
    borderRadius: 0,
    margin: 0,
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
    marginVertical: hp(1.5),
    gap: wp(3),
    flexWrap: 'wrap',
    alignItems: 'center',
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
  listHeader: { marginHorizontal: wp(3), fontWeight: '500' },
  linkText: {
    color: appColors.PRIMARY,
    textDecorationLine: 'underline',
  },
  loaderContainer: { height: '85%', justifyContent: 'center' },
});
