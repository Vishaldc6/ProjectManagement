import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import appFonts from '../styles/appFonts';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { BaseButton, BaseLoader } from '../components';

GoogleSignin.configure({
  webClientId:
    '256795844408-rno5v64mq2ildd7fo9jm78gok2pvk25q.apps.googleusercontent.com',
});

const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  function loginHandler() {
    setIsLoading(true);
    GoogleSignin.signIn()
      .then(async res => {
        console.log({ res });
        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });

        // Get the users ID token
        const signInResult = await GoogleSignin.signIn();
        console.log({ signInResult });

        if (signInResult.type === 'cancelled') {
          throw new Error('Sign in process cancelled');
        }

        const idToken = signInResult.data?.idToken;
        if (!idToken) {
          throw new Error('No ID token found');
        }

        // Create a Google credential with the token
        const googleCredential = GoogleAuthProvider.credential(
          signInResult.data?.idToken,
        );

        // Sign-in the user with the credential
        const result = await signInWithCredential(
          getAuth(getApp()),
          googleCredential,
        );
        console.log({ result });

      })
      .catch(er => {
        console.log({ er });
        Alert.alert('Login Error', er.toString());
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
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
