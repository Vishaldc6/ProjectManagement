import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import appFonts from '../styles/appFonts';
import BaseButton from '../components/BaseButton';

const LoginScreen = () => {
  function loginHandler() {}

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Image
          source={require('../assets/images/app_logo.png')}
          style={styles.appLogo}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Project Management</Text>
          <Text style={styles.subTitle}>Simple project and task tracking</Text>
        </View>
        <BaseButton
          style={styles.loginBtn}
          title="Login using Google"
          onPress={loginHandler}
        />
      </View>
      <View style={styles.policyContainer}>
        <Text style={styles.policyText}>Privacy Policy</Text>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    gap: hp(0.5),
    alignItems: 'center',
    marginBottom: hp(2),
  },
  appLogo: {
    height: hp(20),
    width: hp(20),
    resizeMode: 'center',
  },
  title: {
    fontSize: appFonts.FONT_18,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: appFonts.FONT_14,
  },
  loginBtn: {
    marginVertical: hp(2),
  },
  policyContainer: {
    marginBottom: hp(5),
  },
  policyText: {
    fontWeight: '500',
  },
});
