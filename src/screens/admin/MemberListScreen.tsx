import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {
  FirebaseFirestoreTypes,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

import appColors from '../../styles/appColors';
import { MemberType, ProjectType, RolesType } from '../../types/appTypes';
import appFonts from '../../styles/appFonts';
import { userRef } from '../../firebase/userCollection';
import { BaseIcon, BaseIndicator, BaseLoader } from '../../components';
import { projectRef } from '../../firebase/projectCollection';
import { useAppSelector } from '../../hooks/reduxHooks';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { ROLE_LIST } from '../../constants';

interface IdListType {
  memberIdList: string[];
  managerIdList: string[];
}

const MemberListScreen = () => {
  const navigation = useAppNavigation('Member');
  const { user } = useAppSelector(state => state.AuthReducer);

  const [idListData, setIdListData] = useState<IdListType>({
    memberIdList: [],
    managerIdList: [],
  });
  const [memberList, setMemberList] = useState<MemberType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] =
    useState<FirebaseFirestoreTypes.QueryDocumentSnapshot>();
  const [selectedRole, setSelectedRole] = useState('All');

  const roleList = useMemo(() => {
    return ['All', ...ROLE_LIST.filter(role => role !== RolesType.Admin)];
  }, []);

  const MEMBER_PAGE_LIMIT = 10;

  useEffect(() => {
    fetchAllProjects();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [selectedRole, idListData]);

  const fetchAllProjects = async () => {
    let q = query(
      projectRef,
      where('is_archived', '==', false),
      where('is_deleted', '==', false),
      where('created_by', '==', user?.id),
    );

    const unique_memberList = new Set<string>();
    const unique_managerList = new Set<string>();

    await getDocs(q).then(snapshots => {
      snapshots?.forEach((doc: any) => {
        const project = doc.data() as ProjectType;
        project.member_list.forEach(id => unique_memberList.add(id));
        project.project_manager.forEach(id => unique_managerList.add(id));
      });
    });
    unique_memberList.delete(user?.id ?? '');

    setIdListData({
      memberIdList: [...unique_memberList],
      managerIdList: [...unique_managerList],
    });
  };

  const fetchMembers = async (next = false) => {
    const { managerIdList, memberIdList } = idListData;

    const members: MemberType[] = [];

    if (memberIdList.length) {
      let member_q = query(
        userRef,
        where(
          'id',
          'in',
          selectedRole === RolesType.Project_Manager
            ? managerIdList
            : memberIdList,
        ),
        orderBy('name'),
        limit(MEMBER_PAGE_LIMIT),
      );

      if (!['All', RolesType.Project_Manager].includes(selectedRole)) {
        member_q = query(member_q, where('role', '==', selectedRole));
      }

      if (lastDoc && next) {
        member_q = member_q.startAfter(lastDoc);
      }

      await getDocs(member_q)
        .then(snapshots => {
          snapshots.forEach((doc: any) => {
            const m = doc.data() as MemberType;
            if (managerIdList.includes(m.id)) {
              m.role = RolesType.Project_Manager;
            }
            members.push(m);
          });
          setLastDoc(snapshots.docs.at(-1));
          setHasMore(members.length >= MEMBER_PAGE_LIMIT);
          setMemberList(prev => (next ? [...prev, ...members] : members));
          setIsLoading(false);
          setIsRefreshing(false);
        })
        .catch(error => {
          console.log({ error });
          setLastDoc(undefined);
          setHasMore(false);
          setMemberList([]);
          setIsLoading(false);
          setIsRefreshing(false);
        });
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setSelectedRole('All');
    fetchMembers();
  };

  const renderItem = ({ item: member }: { item: MemberType }) => {
    const memberRole =
      member.role === RolesType.Project_Manager
        ? {
            color: appColors.MEMBER_PROJECT_MANAGER,
            bg: appColors.MEMBER_PROJECT_MANAGER_BG,
          }
        : member.role === RolesType.Developer
        ? { color: appColors.MEMBER_DEV, bg: appColors.MEMBER_DEV_BG }
        : member.role === RolesType.Mobile_Developer
        ? { color: appColors.MEMBER_MOB_DEV, bg: appColors.MEMBER_MOB_DEV_BG }
        : member.role === RolesType.Web_Developer
        ? { color: appColors.MEMBER_WEB_DEV, bg: appColors.MEMBER_WEB_DEV_BG }
        : member.role === RolesType.QA
        ? { color: appColors.MEMBER_QA, bg: appColors.MEMBER_QA_BG }
        : member.role === RolesType.UI_UX
        ? { color: appColors.MEMBER_UI, bg: appColors.MEMBER_UI_BG }
        : { color: appColors.MEMBER_ADMIN, bg: appColors.MEMBER_ADMIN_BG };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.memberCard}
        onPress={() =>
          navigation.navigate('MemberDetail', {
            id: member.id,
          })
        }
      >
        <View style={styles.profileContainer}>
          <BaseIcon
            name="User"
            size={appFonts.FONT_24}
            color={appColors.PRIMARY}
          />
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {member.name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {member.email}
          </Text>
        </View>
        <View
          style={[styles.roleContainer, { backgroundColor: memberRole.bg }]}
        >
          <Text style={{ color: memberRole.color }}>{member.role}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text>{'Members not found!'}</Text>
    </View>
  );

  const ListFooterComponent = () => {
    return hasMore && <BaseIndicator />;
  };

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
      <View>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal
          style={{ marginVertical: hp(1) }}
          contentContainerStyle={styles.roleScrollContainer}
        >
          {roleList.map(role => {
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.filerRoleContainer,
                  selectedRole === role && styles.selectedRoleContainer,
                ]}
                onPress={() => setSelectedRole(role)}
              >
                <Text
                  style={[
                    styles.filterRole,
                    selectedRole === role && styles.selectedFilterRole,
                  ]}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FlatList
          data={memberList}
          renderItem={renderItem}
          contentContainerStyle={styles.memberListContainer}
          ListEmptyComponent={ListEmptyComponent}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          onEndReachedThreshold={0.2}
          onEndReached={() => hasMore && fetchMembers(true)}
          ListFooterComponent={ListFooterComponent}
        />
      </View>
    </View>
  );
};

export default MemberListScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  roleScrollContainer: {
    gap: wp(2),
    paddingHorizontal: wp(3),
  },
  filerRoleContainer: {
    borderWidth: 1,
    paddingVertical: wp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(5),
  },
  selectedRoleContainer: {
    backgroundColor: 'black',
  },
  filterRole: {
    fontSize: appFonts.FONT_12,
  },
  selectedFilterRole: {
    color: 'white',
  },
  memberListContainer: {
    paddingHorizontal: wp(3),
    paddingBottom: hp(10),
  },
  memberCard: {
    backgroundColor: appColors.PRIMARY_BACKGROUND,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    elevation: 3,
    borderRadius: wp(3),
    marginVertical: hp(1),
    padding: wp(3),
  },
  profileContainer: {
    height: wp(15),
    width: wp(15),
    borderRadius: wp(15),
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
    paddingVertical: wp(1),
    paddingHorizontal: wp(2),
    borderRadius: wp(1.5),
  },
  emptyContainer: {
    height: hp(80),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
