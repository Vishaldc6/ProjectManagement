import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { BaseButton, BaseIcon, BaseInput, BaseLoader } from '../../components';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import uuid from 'react-native-uuid';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { onSnapshot, query, where } from '@react-native-firebase/firestore';

import appColors from '../../styles/appColors';
import { MemberType, ProjectType } from '../../types/appTypes';
import {
  addProject,
  associateMemberToProject,
} from '../../firebase/projectCollection';
import { userRef } from '../../firebase/userCollection';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import appFonts from '../../styles/appFonts';
import { useAppSelector } from '../../hooks/reduxHooks';

const ProjectFormScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);
  const navigation = useAppNavigation('ProjectForm');
  const [memberList, setMemberList] = useState<MemberType[]>([]);

  const [isLoading, setIsLoading] = useState(true);

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
  });

  type InitialValueType = {
    title: string;
    clientName: string;
    description: string;
    members: string[];
  };

  const {
    values,
    errors,
    touched,
    handleSubmit,
    handleBlur,
    handleChange,
    setFieldValue,
  } = useFormik<InitialValueType>({
    initialValues: {
      title: '',
      clientName: '',
      description: '',
      members: [],
    },
    validationSchema: projectValidationSchema,
    onSubmit: () => {
      handleSaveProject();
    },
  });

  useEffect(() => {
    const q = query(userRef, where('role', '!=', 'Admin'));

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const _memberList: MemberType[] = user ? [user] : [];
      querySnapshot.forEach((doc: any) => {
        _memberList.push(doc.data());
      });
      setMemberList(_memberList);
      setFieldValue('members', [user?.id]);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSaveProject = async () => {
    setIsLoading(true);
    const uid = uuid.v4();
    const projectData: ProjectType = {
      client_name: values.clientName,
      id: uid,
      description: values.description,
      status: 'ACTIVE',
      title: values.title,
      member_list: values.members,
    };
    addProject(uid, projectData)
      .then(async () => {
        await associateMemberToProject({
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
    const isSelected = values.members.includes(item.id);
    return (
      <View
        style={{
          maxWidth: widthPercentageToDP(18),
          alignItems: 'center',
          marginRight: widthPercentageToDP(2),
        }}
      >
        <TouchableOpacity
          onPress={() => handleSelection(item.id)}
          activeOpacity={0.8}
          disabled={item.id === user?.id}
          style={[styles.memberProfile, isSelected && styles.selectedMember]}
        >
          <BaseIcon
            name="User"
            size={appFonts.FONT_24}
            color={isSelected ? appColors.PRIMARY : appColors.BORDER}
          />
        </TouchableOpacity>
        <Text
          style={{
            ...styles.memberdDetails,
            color: isSelected ? appColors.PRIMARY : appColors.PRIMARY_TEXT,
          }}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text
          style={{
            ...styles.memberdDetails,
            color: isSelected ? appColors.PRIMARY : appColors.SECONDARY_TEXT,
          }}
          numberOfLines={2}
        >
          ({item.role})
        </Text>
      </View>
    );
  };

  const ListEmptyComponent = () => <Text>{'Members not found'}</Text>;

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
          height: heightPercentageToDP(15),
          textAlignVertical: 'top',
        }}
      />
      <View style={styles.memberSelectionRow}>
        <Text style={styles.fieldTitle}>{'Team Members'}</Text>
        {values.members.length && (
          <Text
            style={styles.selectedText}
          >{`${values.members.length} selected`}</Text>
        )}
      </View>
      <View>
        <FlatList
          data={memberList}
          renderItem={renderItem}
          horizontal
          ListEmptyComponent={ListEmptyComponent}
        />
      </View>
      {touched.members && errors.members && (
        <Text style={styles.errorMessage}>{errors.members}</Text>
      )}

      <BaseButton
        title="Save Project"
        onPress={handleSubmit}
        style={{
          marginVertical: heightPercentageToDP(2),
        }}
      />
    </View>
  );
};

export default ProjectFormScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: widthPercentageToDP(3),
    gap: heightPercentageToDP(1.5),
  },
  memberSelectionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldTitle: {
    fontWeight: '500',
  },
  selectedText: {
    color: appColors.PRIMARY,
  },
  memberProfile: {
    width: widthPercentageToDP(15),
    height: widthPercentageToDP(15),
    borderRadius: widthPercentageToDP(15),
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
