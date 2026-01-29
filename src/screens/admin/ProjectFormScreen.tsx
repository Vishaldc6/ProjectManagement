import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import uuid from 'react-native-uuid';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  and,
  getDocs,
  or,
  query,
  where,
} from '@react-native-firebase/firestore';

import {
  BaseButton,
  BaseIcon,
  BaseInput,
  BaseLoader,
  BaseModal,
} from '../../components';
import appColors from '../../styles/appColors';
import {
  MemberType,
  ProjectStatusType,
  ProjectType,
  RolesType,
  UserType,
} from '../../types/appTypes';
import {
  addProject,
  fetchProjectMembers,
  fetchSingleProject,
  notifyMemberForProject,
  updateProject,
} from '../../firebase/projectCollection';
import { userRef } from '../../firebase/userCollection';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import appFonts from '../../styles/appFonts';
import { useAppSelector } from '../../hooks/reduxHooks';
import { useAppRoutes } from '../../hooks/useAppRoute';
import { debounce, toCapitalize } from '../../utils/helperFunctions';

const STATUS_LIST = [
  ProjectStatusType.ACTIVE,
  ProjectStatusType.IN_ACTIVE,
  ProjectStatusType.COMPLETED,
];

const ProjectFormScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);
  const { params } = useAppRoutes<'ProjectForm'>();
  const navigation = useAppNavigation('ProjectForm');

  const isUpdateMode = useMemo(() => !!params?.id, [params]);

  const [currentStatus, setCurrentStatus] = useState<ProjectStatusType>(
    ProjectStatusType.ACTIVE,
  );
  const [project, setProject] = useState<ProjectType>();
  const [addedMemberList, setAddedMemberList] = useState<MemberType[]>(
    user ? [user] : [],
  );
  const [memberList, setMemberList] = useState<MemberType[]>([]);
  const [memberModal, setMemberModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const projectValidationSchema = yup.object({
    title: yup.string().trim().required('please enter project title'),
    //.min(2,'project title at least have 2 characters'),
    clientName: yup
      .string()
      .trim()
      .required('please enter client name')
      .min(2, 'client name at least have 2 characters'),
    description: yup
      .string()
      .trim()
      .required('please enter description')
      .min(10, 'description at least have 10 characters'),
    members: yup
      .array()
      .of(yup.string())
      .min(1, 'at least 1 member should be selected'),
    project_manager: yup.object().required('please choose project manager'),
  });

  type InitialValueType = {
    title: string;
    clientName: string;
    description: string;
    members: string[];
    searchMember: string;
    project_manager?: UserType;
  };

  const {
    values,
    errors,
    touched,
    handleSubmit,
    handleBlur,
    handleChange,
    setFieldValue,
    setFieldTouched,
    setValues,
  } = useFormik<InitialValueType>({
    initialValues: {
      title: '',
      clientName: '',
      description: '',
      members: user ? [user?.id] : [],
      searchMember: '',
      project_manager: undefined,
    },
    validationSchema: projectValidationSchema,
    onSubmit: () => {
      handleSaveProject();
    },
  });

  useEffect(() => {
    if (params?.id) {
      setIsLoading(true);
      fetchSingleProject(params?.id)
        .then(_project => {
          setProject(_project);
          fetchProjectMembers(_project)
            .then(members => {
              setAddedMemberList(members);
              setCurrentStatus(_project.status);
              setValues({
                clientName: _project.client_name,
                description: _project.description,
                members: _project.member_list,
                searchMember: '',
                title: _project.title,
                project_manager: members.find(
                  ({ role }) => role === RolesType.Project_Manager,
                ),
              });
              setIsLoading(false);
            })
            .catch(() => {
              setIsLoading(false);
              Alert.alert('Project', 'Something went wrong');
            });
        })
        .catch(() => {
          setIsLoading(false);
          Alert.alert('Project', 'Something went wrong');
        });
    }
  }, [params]);

  const searchMemberFunc = (text: string) => {
    const searchText = text.trim().toLowerCase();
    if (searchText) {
      setIsSearchLoading(true);

      const q = query(
        userRef,
        where('role', '!=', 'Admin'),
        or(
          and(
            where('name', '>=', searchText.trim().toLowerCase()),
            where('name', '<=', searchText.trim().toLowerCase() + '\uf8ff'),
          ),
          and(
            where('email', '>=', searchText.trim().toLowerCase()),
            where('email', '<=', searchText.trim().toLowerCase() + '\uf8ff'),
          ),
        ),
      );
      console.log({ q });

      getDocs(q).then(querySnapshot => {
        const _memberList: MemberType[] = [];
        querySnapshot.forEach((doc: any) => {
          _memberList.push(doc.data());
        });
        setMemberList(_memberList);
        setIsSearchLoading(false);
      });
    } else {
      setMemberList([]);
      setIsSearchLoading(false);
    }
  };

  const debouncedFunc = useCallback(debounce(searchMemberFunc, 2000), []);

  const isDataChanged = () => {
    const isSameLength = values.members.length === project?.member_list.length;
    const areSameMembers = values.members.every(m =>
      project?.member_list.includes(m),
    );
    const isMemberListChanged = !(isSameLength && areSameMembers);

    if (
      values.clientName.trim().toLowerCase() !== project?.client_name.trim() ||
      values.description.trim() !== project?.description.trim() ||
      values.title.trim().toLowerCase() !== project?.title.trim() ||
      values.project_manager?.id !== project?.project_manager[0] ||
      currentStatus !== project.status ||
      isMemberListChanged
    ) {
      return true;
    }
    return false;
  };

  // returns new and old member ids and pm ids
  const getChangedMemberData = () => {
    const newMember = values.members.filter(
      id => !project?.member_list.includes(id),
    );
    const oldMember = project?.member_list.filter(
      id => !values.members.includes(id),
    );

    let oldPmId, newPmId;
    if (values.project_manager?.id !== project?.project_manager[0]) {
      oldPmId = project?.project_manager[0];
      newPmId = values.project_manager?.id;
    }
    return {
      oldPmId,
      newPmId,
      newMemberIds: newMember,
      removedMemberIds: oldMember,
    };
  };

  const handleSaveProject = async () => {
    setIsLoading(true);
    const projectData: ProjectType = {
      id: project?.id ?? '',
      client_name: values.clientName.toLowerCase(),
      description: values.description,
      status: currentStatus,
      title: values.title.toLowerCase(),
      member_list: values.members,
      created_by: user?.id,
      project_manager: values.project_manager
        ? [values.project_manager?.id]
        : [],
    };
    console.log({ projectData });

    if (isUpdateMode) {
      if (isDataChanged()) {
        console.log('changes... so update');
        updateProject(project?.id ?? '', projectData)
          .then(async () => {
            console.log({
              type: 'update',
              project: projectData,
              ...getChangedMemberData(),
              isStatusChanged: currentStatus !== project?.status,
            });

            // notify members : add/removed, status update
            await notifyMemberForProject({
              type: 'update',
              project: projectData,
              ...getChangedMemberData(),
              isStatusChanged: currentStatus !== project?.status,
            });
            setIsLoading(false);
            navigation.goBack();
          })
          .catch(error => {
            setIsLoading(false);
            console.log({ error });
            Alert.alert('Update Project', 'Something went wrong!');
          });
      }
    } else {
      // add
      const uid = uuid.v4();
      projectData.id = uid;
      console.log('adding new doc...');
      addProject(uid, projectData)
        .then(async () => {
          // just notify members
          await notifyMemberForProject({
            type: 'add',
            project: projectData,
          });
          setIsLoading(false);
          navigation.goBack();
        })
        .catch(error => {
          setIsLoading(false);
          console.log({ error });
          Alert.alert('Add Project', 'Something went wrong!');
        });
    }
    setIsLoading(false);
  };

  const handleSelection = (mId: string) => {
    const isFound = values.members.includes(mId);
    const filter = isFound
      ? values.members.filter(id => id !== mId)
      : [...values.members, mId];

    setFieldValue('members', filter);
  };

  useEffect(() => {
    const foundAt = addedMemberList.findIndex(
      ({ id }) => id === values.project_manager?.id,
    );
    foundAt === -1 && setFieldValue('project_manager', '');
  }, [addedMemberList]);

  const renderItem = ({ item }: { item: MemberType }) => {
    const isPM = values.project_manager?.id === item.id;
    return (
      <View style={styles.memberProfileContainer}>
        {item.role !== RolesType.Admin && (
          <BaseIcon
            name="CircleMinus"
            style={styles.removeMemberIcon}
            size={appFonts.FONT_16}
            color={appColors.DANGER_TEXT}
            onPress={() => {
              // manage formik value
              handleSelection(item.id);
              // manage list
              setAddedMemberList(prev =>
                prev.filter(({ id }) => item.id !== id),
              );
            }}
          />
        )}
        <TouchableOpacity
          onPress={() => setFieldValue('project_manager', item)}
          activeOpacity={0.8}
          style={[styles.memberProfile, isPM && styles.selectedMember]}
        >
          <BaseIcon
            name="User"
            size={appFonts.FONT_24}
            color={isPM ? appColors.PRIMARY : appColors.BORDER}
          />
        </TouchableOpacity>
        <Text
          style={{
            ...styles.memberdDetails,
            color: isPM ? appColors.PRIMARY : appColors.PRIMARY_TEXT,
          }}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text
          style={{
            ...styles.memberdDetails,
            color: isPM ? appColors.PRIMARY : appColors.SECONDARY_TEXT,
          }}
          numberOfLines={2}
        >
          ({item.role})
        </Text>
      </View>
    );
  };

  const renderSearchedMember = ({ item }: { item: UserType }) => {
    const isAdded = addedMemberList.find(({ id }) => id === item.id);
    return (
      <View style={styles.searchedMemberCard}>
        <View style={{ flex: 1 }}>
          <Text>{item.name}</Text>
          <Text>{item.email}</Text>
        </View>
        <BaseIcon
          name={isAdded ? 'Check' : 'Plus'}
          color={appColors.PRIMARY}
          onPress={() => {
            // manage formik value
            handleSelection(item.id);
            // manage list
            setAddedMemberList(prev =>
              isAdded
                ? prev.filter(({ id }) => item.id !== id)
                : [...prev, item],
            );
          }}
        />
      </View>
    );
  };

  const SearchedMemberListEmptyComponent = memo(() => (
    <Text>
      {values.searchMember
        ? 'Members not found'
        : 'Add members by search their name or email'}
    </Text>
  ));

  const ListHeaderComponent = memo(() => {
    return (
      <TouchableOpacity
        style={styles.memberProfileContainer}
        onPress={toggleModal}
      >
        <View style={[styles.memberProfile]}>
          <BaseIcon
            name="Plus"
            size={appFonts.FONT_24}
            color={appColors.BORDER}
          />
        </View>
        <Text style={styles.memberdDetails} numberOfLines={2}>
          {'Add member'}
        </Text>
      </TouchableOpacity>
    );
  });

  const toggleModal = () => {
    setFieldValue('searchMember', '');
    setMemberList([]);
    setMemberModal(!memberModal);
  };

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}

      {isUpdateMode && (
        <View>
          <Text style={styles.fieldTitle}>{'Status'}</Text>
          <View style={{ flexDirection: 'row', gap: wp(3), marginTop: hp(1) }}>
            {STATUS_LIST.map(status => {
              const isSelected = status === currentStatus;

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCurrentStatus(status)}
                  style={[
                    styles.statusContainer,
                    isSelected && styles.selectedStatusContainer,
                  ]}
                >
                  <Text>{toCapitalize(status)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
      <BaseInput
        title="Project Title"
        required
        placeholder="Enter Project title"
        value={values.title}
        onChangeText={handleChange('title')}
        onBlur={handleBlur('title')}
        errorMessage={touched.title && errors.title ? errors.title : ''}
      />
      <BaseInput
        title="Client Name"
        required
        placeholder="Enter Client Name"
        value={values.clientName}
        onChangeText={handleChange('clientName')}
        onBlur={handleBlur('clientName')}
        errorMessage={
          touched.clientName && errors.clientName ? errors.clientName : ''
        }
      />
      <BaseInput
        title="Description"
        required
        placeholder="Enter Project Description"
        multiline
        value={values.description}
        onChangeText={handleChange('description')}
        onBlur={handleBlur('description')}
        errorMessage={
          touched.description && errors.description ? errors.description : ''
        }
        style={{
          height: hp(15),
          textAlignVertical: 'top',
        }}
      />
      <View style={styles.memberSelectionRow}>
        <Text style={styles.fieldTitle}>
          {'Team Members'}&nbsp;({values.members.length})
        </Text>
      </View>
      <View>
        <FlatList
          data={addedMemberList}
          renderItem={renderItem}
          horizontal
          ListHeaderComponent={ListHeaderComponent}
        />
      </View>
      {errors.members && (
        <Text style={styles.errorMessage}>{errors.members}</Text>
      )}
      <View style={styles.memberSelectionRow}>
        <Text style={styles.fieldTitle}>{'Project Manager'}</Text>
        <Text style={styles.selectedText}>
          {values.project_manager?.name ?? 'No project manager'}
        </Text>
      </View>
      {touched.project_manager && errors.project_manager && (
        <Text style={styles.errorMessage}>
          {errors.project_manager.toString()}
        </Text>
      )}

      <BaseButton
        title="Save Project"
        onPress={() => {
          setFieldTouched('project_manager', true);
          handleSubmit();
        }}
        style={{ marginVertical: hp(2) }}
      />
      <BaseModal
        visible={memberModal}
        onRequestClose={toggleModal}
        modalTitle={'Add new member'}
        modalContainerStyle={{ height: hp(50) }}
      >
        <BaseInput
          placeholder="Search member by name or email"
          value={values.searchMember}
          onChangeText={val => {
            !isSearchLoading && setIsSearchLoading(!isSearchLoading);
            debouncedFunc(val);
            handleChange('searchMember')(val);
          }}
        />

        <View style={{ flex: 1 }}>
          {isSearchLoading ? (
            <BaseLoader
              style={{ backgroundColor: appColors.SECONDARY_BACKGROUND }}
            />
          ) : (
            <FlatList
              data={memberList}
              renderItem={renderSearchedMember}
              ListEmptyComponent={SearchedMemberListEmptyComponent}
            />
          )}
        </View>
      </BaseModal>
    </View>
  );
};

export default ProjectFormScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(3),
    gap: hp(1.5),
  },
  memberSelectionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldTitle: {
    fontWeight: '500',
  },
  selectedText: {
    color: appColors.PRIMARY,
  },
  memberProfileContainer: {
    width: wp(18),
    alignItems: 'center',
    marginRight: wp(1),
  },
  removeMemberIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 99,
  },
  memberProfile: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(15),
    borderWidth: 2,
    borderColor: appColors.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberdDetails: {
    fontSize: 10,
    textAlign: 'center',
  },
  selectedMember: {
    borderColor: appColors.PRIMARY,
  },
  errorMessage: {
    color: appColors.ERROR_TEXT,
  },
  searchedMemberCard: {
    padding: wp(1),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: wp(2),
    marginBottom: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    padding: wp(1),
    paddingHorizontal: wp(3),
    gap: wp(1),
    borderRadius: wp(5),
  },
  selectedStatusContainer: {
    borderColor: appColors.PRIMARY,
    backgroundColor: appColors.PRIMARY_LIGHT_BACKGROUND,
  },
});
