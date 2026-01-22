import { Alert, StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import { BaseButton, BaseDropDown, BaseInput, BaseLoader } from '../components';
import { updateUser } from '../firebase/userCollection';
import { useAppSelector } from '../hooks/reduxHooks';
import { ROLE_LIST } from '../constants';
import { RolesType } from '../types/appTypes';

const ProfileScreen = () => {
  const { user } = useAppSelector(state => state.AuthReducer);

  const IS_ADMIN = user?.role === RolesType.Admin;
  const roleList = ROLE_LIST.filter(role =>
    IS_ADMIN ? true : role !== RolesType.Admin,
  ).map(role => ({ value: role, label: role }));

  const [isLoading, setIsLoading] = useState(false);

  const ProfileValidationSchema = yup.object({
    fullname: yup
      .string()
      .trim()
      .required('please enter full name')
      .min(3, 'full name should have at least 3 characters'),
  });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useFormik({
      initialValues: {
        fullname: user?.name,
        email: user?.email,
        role: user?.role,
      },
      validationSchema: ProfileValidationSchema,
      onSubmit: () => {
        handleSaveProfile();
      },
    });

  const handleSaveProfile = () => {
    if (isDataChanged()) {
      setIsLoading(true);
      updateUser(user?.id ?? '', {
        name: values.fullname,
        role: values.role,
      })
        .then(() => {
          setIsLoading(false);
        })
        .catch(error => {
          console.log({ error });
          setIsLoading(false);
          Alert.alert('Save Profile', 'Something went wrong!');
        });
    }
  };

  const isDataChanged = () => {
    if (
      values.fullname?.trim() === user?.name.trim() &&
      values.role === user?.role
    ) {
      return false;
    }
    return true;
  };

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
      <View style={styles.form}>
        <BaseInput
          required
          title="Full Name"
          value={values.fullname}
          onChangeText={handleChange('fullname')}
          onBlur={handleBlur('fullname')}
          errorMessage={
            touched.fullname && errors.fullname ? errors.fullname : ''
          }
        />
        <BaseInput title={'E-mail'} value={values.email} readOnly />
        <BaseDropDown
          title="Role"
          data={roleList}
          labelField="label"
          value={values.role}
          onChange={val => {
            handleChange('role')(val.value);
          }}
          valueField="value"
          disable={IS_ADMIN}
        />

        <BaseButton title="Save Profile" onPress={handleSubmit} />
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(3),
  },
  form: {
    gap: hp(1.5),
  },
});
