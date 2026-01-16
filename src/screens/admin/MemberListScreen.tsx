import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { onSnapshot, query, where } from '@react-native-firebase/firestore';

import appColors from '../../styles/appColors';
import { MemberType } from '../../types/appTypes';
import appFonts from '../../styles/appFonts';
import { userRef } from '../../firebase/userCollection';
import { BaseIcon, BaseLoader } from '../../components';

const MemberListScreen = () => {
  const [memberList, setMemberList] = useState<MemberType[]>([]);
  const [filterMemberList, setFilterMemberList] = useState<MemberType[]>([]);
  const [roleList, setRoleList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState('All');

  useEffect(() => {
    const q = query(userRef, where('role', '!=', 'Admin'));

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const _memberList: MemberType[] = [];
      querySnapshot.forEach((doc: any) => {
        _memberList.push(doc.data());
      });
      setMemberList(_memberList);
      setFilterMemberList(_memberList);
      setRoleList(['All', ...new Set(_memberList.map(({ role }) => role))]);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setFilterMemberList(
      selectedRole === 'All'
        ? memberList
        : memberList.filter(
            ({ role }) => role.toLowerCase() === selectedRole.toLowerCase(),
          ),
    );
  }, [selectedRole]);

  const renderItem = ({ item: member }: { item: MemberType }) => {
    const memberRole =
      member.role === 'Project Manager'
        ? appColors.MEMBER_PROJECT_MANAGER
        : member.role === 'Developer'
        ? appColors.MEMBER_DEV
        : member.role === 'Mobile Developer'
        ? appColors.MEMBER_MOB_DEV
        : member.role === 'Web Developer'
        ? appColors.MEMBER_WEB_DEV
        : member.role === 'QA'
        ? appColors.MEMBER_QA
        : member.role === 'UI/UX'
        ? appColors.MEMBER_UI
        : appColors.MEMBER_ADMIN;

    const memberBG =
      member.role === 'Project Manager'
        ? appColors.MEMBER_PROJECT_MANAGER_BG
        : member.role === 'Developer'
        ? appColors.MEMBER_DEV_BG
        : member.role === 'Mobile Developer'
        ? appColors.MEMBER_MOB_DEV_BG
        : member.role === 'Web Developer'
        ? appColors.MEMBER_WEB_DEV_BG
        : member.role === 'QA'
        ? appColors.MEMBER_QA_BG
        : member.role === 'UI/UX'
        ? appColors.MEMBER_UI_BG
        : appColors.MEMBER_ADMIN_BG;

    return (
      <TouchableOpacity activeOpacity={0.8} style={styles.memberCard}>
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
        <View style={[styles.roleContainer, { backgroundColor: memberBG }]}>
          <Text style={[styles.role, { color: memberRole }]}>
            {member.role}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
      <ScrollView
        showsHorizontalScrollIndicator={false}
        horizontal
        style={{ marginVertical: heightPercentageToDP(1) }}
        contentContainerStyle={{
          gap: widthPercentageToDP(2),
          paddingHorizontal: widthPercentageToDP(3),
        }}
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
        data={filterMemberList}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: widthPercentageToDP(3),
          paddingBottom: heightPercentageToDP(10),
        }}
      />
    </View>
  );
};

export default MemberListScreen;

const styles = StyleSheet.create({
  container: {},
  filerRoleContainer: {
    borderWidth: 1,
    paddingVertical: widthPercentageToDP(1),
    paddingHorizontal: widthPercentageToDP(4),
    borderRadius: widthPercentageToDP(5),
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
  memberCard: {
    backgroundColor: appColors.PRIMARY_BACKGROUND,
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPercentageToDP(2),
    elevation: 3,
    borderRadius: widthPercentageToDP(3),
    marginVertical: heightPercentageToDP(1),
    padding: widthPercentageToDP(3),
  },
  profileContainer: {
    height: widthPercentageToDP(15),
    width: widthPercentageToDP(15),
    borderRadius: widthPercentageToDP(15),
    backgroundColor: appColors.PRIMARY_LIGHT_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContainer: {
    gap: heightPercentageToDP(0.5),
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
    paddingVertical: widthPercentageToDP(1),
    paddingHorizontal: widthPercentageToDP(2),
    borderRadius: widthPercentageToDP(1.5),
  },
  role: {},
});
