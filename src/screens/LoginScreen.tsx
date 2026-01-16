import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { serverTimestamp, Timestamp } from '@react-native-firebase/firestore';

import appFonts from '../styles/appFonts';
import { setUser } from '../redux/slices/AuthSlice';
import { useAppDispatch } from '../hooks/reduxHooks';
import { addUser, getUser } from '../firebase/userCollection';
import { BaseButton, BaseLoader } from '../components';
import { UserType } from '../types/appTypes';
import { firebaseApp } from '../firebase';
import { useAppNavigation } from '../hooks/useAppNavigation';
import appColors from '../styles/appColors';
import { requestUserPermission, setUserRole } from '../utils/helperFunctions';

GoogleSignin.configure({
  webClientId:
    '256795844408-rno5v64mq2ildd7fo9jm78gok2pvk25q.apps.googleusercontent.com',
});

const LoginScreen = () => {
  const dispatch = useAppDispatch();

  const navigation = useAppNavigation('Login');

  const [isLoading, setIsLoading] = useState(false);

  function loginHandler() {
    setIsLoading(true);
    GoogleSignin.signIn()
      .then(async res => {
        console.log({ res });
        // Check if your device supports Google Play
        const hasService = await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        if (hasService) {
          // Get the users ID token
          const signInResult = await GoogleSignin.signIn();
          console.log({ signInResult });

          if (signInResult.type === 'cancelled') {
            throw new Error('Sign in process cancelled');
          }

          // Create a Google credential with the token
          const googleCredential = GoogleAuthProvider.credential(
            signInResult.data?.idToken,
          );

          // Sign-in the user with the credential
          const signedUser = await signInWithCredential(
            getAuth(firebaseApp),
            googleCredential,
          );

          if (signedUser.additionalUserInfo?.isNewUser) {
            const userData: UserType = {
              id: signedUser.user.uid,
              name: signedUser.user.displayName ?? '',
              email: signedUser.user.email ?? '',
              role: setUserRole(signedUser.user.email ?? ''),
              created_at: serverTimestamp() as Timestamp,
              updated_at: serverTimestamp() as Timestamp,
            };

            await addUser(signedUser.user.uid, userData);
          }

          const user = await getUser(signedUser.user.uid);
          dispatch(setUser(user));

          navigation.reset({
            routes: [
              {
                name: 'Drawer',
              },
            ],
          });
        } else {
          throw Error('Your device dont have play service');
        }
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
    backgroundColor: appColors.SECONDARY_BACKGROUND,
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
