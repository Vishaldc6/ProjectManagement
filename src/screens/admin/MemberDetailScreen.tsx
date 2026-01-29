import {
  ScrollView,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { MemberStackNavigatorType } from '../../types/navigationTypes';
import { getUser } from '../../firebase/userCollection';
import {
  MemberType,
  ProjectStatusType,
  ProjectType,
  RolesType,
  TaskStatusEnum,
} from '../../types/appTypes';
import { BaseIcon, BaseLoader } from '../../components';
import appColors from '../../styles/appColors';
import appFonts from '../../styles/appFonts';
import { toCapitalize } from '../../utils/helperFunctions';
import {
  getDoc,
  getDocs,
  query,
  where,
} from '@react-native-firebase/firestore';
import { taskRef } from '../../firebase/taskCollection';
import { projectRef } from '../../firebase/projectCollection';

interface StatisticDataType {
  completedTask: number;
  managingProjects: ProjectType[];
  otherProjects: ProjectType[];
  totalProjects: number;
}

const MemberDetailScreen = () => {
  const { params } =
    useRoute<RouteProp<MemberStackNavigatorType, 'MemberDetail'>>();

  const [member, setMember] = useState<MemberType | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [statisticData, setStatisticData] = useState<StatisticDataType>({
    completedTask: 0,
    managingProjects: [],
    otherProjects: [],
    totalProjects: 0,
  });

  useEffect(() => {
    params.id &&
      getUser(params.id).then(async res => {
        setMember(res);
        await fetchStatistic(res);
        setIsLoading(false);
      });
  }, []);

  const fetchStatistic = async (member: MemberType) => {
    let task_count = 0;
    const task_q = query(
      taskRef,
      where('is_archived', '==', false),
      where('is_deleted', '==', false),
      where('assigned_to', '==', member?.id),
      where('status', '==', TaskStatusEnum.DONE),
    );
    await getDocs(task_q).then(snapshots => {
      task_count = snapshots.size;
    });

    const project_q = query(
      projectRef,
      where('is_archived', '==', false),
      where('is_deleted', '==', false),
      where('member_list', 'array-contains', member?.id),
    );
    const project_list: ProjectType[] = [];
    await getDocs(project_q).then(snapshots => {
      snapshots.forEach((doc: any) => project_list.push(doc.data()));
    });

    setStatisticData({
      completedTask: task_count,
      totalProjects: project_list.length,
      otherProjects: project_list.filter(
        ({ project_manager }) => !project_manager.includes(member.id),
      ),
      managingProjects: project_list.filter(({ project_manager }) =>
        project_manager.includes(member.id),
      ),
    });
  };

  const sectionListData = useMemo(() => {
    const list = [];
    if (statisticData.managingProjects.length) {
      list.push({
        title: 'Managing Projects',
        data: statisticData.managingProjects,
      });
    }
    if (statisticData.otherProjects.length) {
      list.push({
        title: 'Projects',
        data: statisticData.otherProjects,
      });
    }
    return list;
  }, [statisticData]);

  const renderProjects = ({ item }: { item: ProjectType }) => {
    return (
      <View style={styles.projectCard}>
        <View style={styles.projectImg}>
          <BaseIcon name="FolderOpen" color={appColors.PRIMARY} />
        </View>
        <View style={styles.projectDetail}>
          <Text style={styles.title} numberOfLines={1}>
            {toCapitalize(item.title)}
          </Text>
          <Text style={styles.client} numberOfLines={1}>
            {toCapitalize(item.client_name)}
          </Text>
        </View>
        <View
          style={[
            styles.statusCard,
            item?.status === ProjectStatusType.ACTIVE
              ? styles.activeStatusCard
              : item?.status === ProjectStatusType.COMPLETED &&
                styles.completedStatusCard,
          ]}
        >
          <Text
            style={[
              styles.projectStatus,
              item?.status === ProjectStatusType.ACTIVE
                ? styles.activeStatus
                : item?.status === ProjectStatusType.COMPLETED &&
                  styles.completedStatus,
            ]}
          >
            {toCapitalize(item?.status)}
          </Text>
        </View>
      </View>
    );
  };

  const renderProjectSectionHeader = ({
    section: { title },
  }: {
    section: SectionListData<ProjectType, { title: string }>;
  }) => {
    return <Text style={styles.sectionText}>{title}</Text>;
  };

  return (
    <View style={styles.flexContainer}>
      {isLoading ? (
        <BaseLoader />
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.profileContainer}>
              <BaseIcon
                name="User"
                size={appFonts.FONT_24}
                color={appColors.PRIMARY}
              />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text>{toCapitalize(member?.name ?? '')}</Text>
              <Text>{member?.email}</Text>
            </View>
          </View>

          <View style={styles.statisticsRow}>
            <View style={[styles.card, styles.flexContainer]}>
              <Text style={styles.totalNumber}>
                {statisticData.totalProjects}
              </Text>
              <Text>{'Total Projects'}</Text>
            </View>
            <View style={[styles.card, styles.flexContainer]}>
              <Text style={styles.totalNumber}>
                {statisticData.completedTask}
              </Text>
              <Text>{'Completed Tasks'}</Text>
            </View>
          </View>

          <SectionList
            contentContainerStyle={{
              paddingBottom: hp(5),
            }}
            sections={sectionListData}
            renderItem={renderProjects}
            renderSectionHeader={renderProjectSectionHeader}
          />
        </ScrollView>
      )}
    </View>
  );
};

export default MemberDetailScreen;

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  contentContainer: {
    margin: wp(3),
    gap: hp(2),
  },
  card: {
    gap: hp(1),
    alignItems: 'center',
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    elevation: 5,
    padding: wp(3),
    borderRadius: wp(3),
  },
  profileContainer: {
    height: wp(20),
    width: wp(20),
    borderRadius: wp(20),
    backgroundColor: appColors.PRIMARY_LIGHT_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleContainer: {
    alignSelf: 'center',
    paddingVertical: wp(1),
    paddingHorizontal: wp(2),
    borderRadius: wp(1.5),
  },
  totalNumber: {
    fontWeight: 'bold',
    fontSize: appFonts.FONT_20,
  },
  statisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(5),
  },
  sectionText: {
    fontSize: appFonts.FONT_14,
  },
  projectCard: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    borderColor: appColors.BORDER,
    borderWidth: 1,
    borderRadius: wp(2),
    padding: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginVertical: hp(0.4),
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
});
