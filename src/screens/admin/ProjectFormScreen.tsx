import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo, useEffect, useState } from 'react';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import uuid from 'react-native-uuid';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { getDocs, or, query, where } from '@react-native-firebase/firestore';

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
  UserType,
} from '../../types/appTypes';
import {
  addProject,
  notifyMemberForProject,
} from '../../firebase/projectCollection';
import { userRef } from '../../firebase/userCollection';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import appFonts from '../../styles/appFonts';
import { useAppSelector } from '../../hooks/reduxHooks';

const ProjectFormScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);
  const navigation = useAppNavigation('ProjectForm');
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

  // --- NEED TO FIX ---
  useEffect(() => {
    debouncedFunc();
  }, [values.searchMember]);

  const debounce = (func: any, time: number) => {
    let timeOut: number;
    return function () {
      clearTimeout(timeOut);
      timeOut = setTimeout(() => {
        func();
      }, time);
    };
  };

  const searchMemberFunc = () => {
    const searchText = values.searchMember.toLowerCase();
    if (searchText) {
      setIsSearchLoading(true);
      console.log('searchMember...');
      const q = query(
        userRef,
        where('role', '!=', 'Admin'),
        or(where('name', '==', searchText), where('email', '==', searchText)),
      );
      console.log({ q });

      getDocs(q).then(querySnapshot => {
        const _memberList: MemberType[] = [];
        querySnapshot.forEach((doc: any) => {
          _memberList.push(doc.data());
        });
        setMemberList(_memberList);
        console.log({ _memberList });
        setIsSearchLoading(false);

        // setFieldValue('members', [user?.id]);
      });
    }
  };

  const debouncedFunc = debounce(searchMemberFunc, 2000);

  const handleSaveProject = async () => {
    setIsLoading(true);
    const uid = uuid.v4();
    const projectData: ProjectType = {
      client_name: values.clientName.toLowerCase(),
      id: uid,
      description: values.description,
      status: ProjectStatusType.ACTIVE,
      title: values.title.toLowerCase(),
      member_list: values.members,
      created_by: user?.id,
      project_manager: values.project_manager
        ? [values.project_manager?.id]
        : [],
    };
    console.log({ projectData });

    addProject(uid, projectData)
      .then(async () => {
        // just notify members
        await notifyMemberForProject({
          memberIds: values.members,
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
  };

  const handleSelection = (mId: string) => {
    const isFound = values.members.includes(mId);
    const filter = isFound
      ? values.members.filter(id => id !== mId)
      : [...values.members, mId];

    setFieldValue('members', filter);
  };

  const renderItem = ({ item }: { item: MemberType }) => {
    const isPM = values.project_manager?.id === item.id;
    return (
      <View style={styles.memberProfileContainer}>
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

  const ListEmptyComponent = memo(() => <Text>{'Members not found'}</Text>);

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
    setMemberModal(!memberModal);
  };

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
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
        style={{
          marginVertical: hp(2),
        }}
      />
      <BaseModal
        visible={memberModal}
        onRequestClose={toggleModal}
        modalTitle={'Add new member'}
      >
        <BaseInput
          placeholder="Search member by name or email"
          value={values.searchMember}
          onChangeText={handleChange('searchMember')}
        />

        {isSearchLoading ? (
          <BaseLoader />
        ) : (
          <FlatList
            data={memberList}
            renderItem={({ item }) => {
              const isAdded = addedMemberList.find(({ id }) => id === item.id);
              return (
                <View
                  style={{
                    padding: wp(1),
                    borderWidth: StyleSheet.hairlineWidth,
                    borderRadius: wp(2),
                    marginBottom: hp(1),
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
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
            }}
            ListEmptyComponent={ListEmptyComponent}
          />
        )}
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
    maxWidth: wp(18),
    alignItems: 'center',
    marginRight: wp(1),
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
});
