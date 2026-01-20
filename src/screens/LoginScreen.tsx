import {
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useMemo, useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';
import { serverTimestamp, Timestamp } from '@react-native-firebase/firestore';
import { useFormik } from 'formik';
import * as yup from 'yup';

import appFonts from '../styles/appFonts';
import { setUser } from '../redux/slices/AuthSlice';
import { useAppDispatch } from '../hooks/reduxHooks';
import { addUser, getUser } from '../firebase/userCollection';
import { BaseButton, BaseInput, BaseLoader } from '../components';
import { RolesType, UserType } from '../types/appTypes';
import { authApp } from '../firebase';
import { useAppNavigation } from '../hooks/useAppNavigation';
import appColors from '../styles/appColors';
import { useAppRoutes } from '../hooks/useAppRoute';
// import { saveToStorage } from '../utils/helperFunctions';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

GoogleSignin.configure({
  webClientId:
    '256795844408-rno5v64mq2ildd7fo9jm78gok2pvk25q.apps.googleusercontent.com',
});

const SignUpvalidationSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('please enter valid email')
    .required('please enter email'),
  fullname: yup
    .string()
    .trim()
    .required('please enter full name')
    .min(3, 'name at least have 3 characters'),
  password: yup
    .string()
    .trim()
    .min(8, 'password at least have 8 characters')
    .required('please enter password'),
  confirm_password: yup
    .string()
    .trim()
    .required('please enter confirm password')
    .oneOf([yup.ref('password')], 'confirm password must match with password'),
  // currentRole: yup.string().required('please choose your role'),
  // -----------------------------
  // required role field if member selected
  // -----------------------------
});

const SignInvalidationSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('please enter valid email')
    .required('please enter email'),
  password: yup.string().trim().required('please enter password'),
});

const LoginScreen = () => {
  const dispatch = useAppDispatch();

  const { params } = useAppRoutes<'Login'>();
  const navigation = useAppNavigation('Login');

  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<RolesType>(RolesType.Member);

  const isSignUp = useMemo(() => {
    console.log({ params });

    return params?.forSignUp;
  }, [params]);

  const { values, errors, touched, handleBlur, handleChange, handleSubmit } =
    useFormik({
      initialValues: {
        email: '',
        password: '',
        confirm_password: '',
        fullname: '',
        // currentRole: '',
      },
      validationSchema: isSignUp
        ? SignUpvalidationSchema
        : SignInvalidationSchema,
      onSubmit: () => {
        handleEmail();
      },
    });

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
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
          authApp,
          googleCredential,
        );

        if (signedUser.additionalUserInfo?.isNewUser) {
          const userData: UserType = {
            id: signedUser.user.uid,
            name: signedUser.user.displayName ?? '',
            email: signedUser.user.email ?? '',
            role: role,
            created_at: serverTimestamp() as Timestamp,
            updated_at: serverTimestamp() as Timestamp,
          };

          await addUser(signedUser.user.uid, userData);
        }

        saveUserAndNavigate(signedUser.user.uid);
      } else {
        throw Error('Your device dont have play service');
      }
    } catch (error) {
      console.log({ error });
      setIsLoading(false);
      Alert.alert('Login', error?.toString());
    }
  };

  const handleEmail = async () => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        createUserWithEmailAndPassword(authApp, values.email, values.password)
          .then(async credentials => {
            console.log({ credentials });

            const userData: UserType = {
              id: credentials.user.uid,
              name: credentials.user.displayName ?? values.fullname,
              email: credentials.user.email ?? '',
              role: role,
              created_at: serverTimestamp() as Timestamp,
              updated_at: serverTimestamp() as Timestamp,
            };

            await addUser(credentials.user.uid, userData);
            saveUserAndNavigate(credentials.user.uid);
          })
          .catch(error => {
            console.log({ error });
            setIsLoading(false);
            if (error.code === 'auth/email-already-in-use') {
              Alert.alert(
                'Sign in',
                'Provided email address is already in use!',
              );
            }

            if (error.code === 'auth/invalid-email') {
              Alert.alert('Sign in', 'Provided email address is invalid!');
            }
          });
      } else {
        signInWithEmailAndPassword(authApp, values.email, values.password)
          .then(credentials => {
            console.log({ credentials });
            saveUserAndNavigate(credentials.user.uid);
          })
          .catch(error => {
            setIsLoading(false);
            console.log({ error });
            if (error.code === 'auth/invalid-credential') {
              Alert.alert('Sign in', 'Invalid credential !');
            }
          });
      }
    } catch (error) {
      console.log({ error });
      setIsLoading(false);
    }
  };

  const saveUserAndNavigate = (uid: string) => {
    getUser(uid).then(_user => {
      setIsLoading(false);
      // saveToStorage('AUTH_USER', _user);
      dispatch(setUser(_user));
      navigation.reset({
        routes: [
          {
            name: 'Drawer',
          },
        ],
      });
    });
  };

  const handlePolicy = () => {
    // privacy policy link
    Linking.openURL('https://google.com');
  };

  return (
    <View style={styles.container}>
      {isLoading && <BaseLoader />}
      <KeyboardAwareScrollView
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        extraScrollHeight={hp(5)}
      >
        <View style={styles.contentContainer}>
          <View style={styles.appDetail}>
            <Image
              source={require('../assets/images/app_logo.png')}
              style={styles.appLogo}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Project Management</Text>
              <Text style={styles.subTitle}>
                Simple project and task tracking
              </Text>
            </View>
          </View>

          {/* Role container */}
          {isSignUp && (
            <View style={styles.roleRowContainer}>
              {[RolesType.Member, RolesType.Admin].map(_role => (
                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    _role === role && styles.selectedRoleBtn,
                  ]}
                  onPress={() => setRole(_role)}
                >
                  <Text>{_role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.form}>
            {isSignUp && (
              <BaseInput
                required
                title="Full Name"
                placeholder="Enter Full name"
                value={values.fullname}
                onChangeText={handleChange('fullname')}
                onBlur={handleBlur('fullname')}
                errorMessage={
                  touched.fullname && errors.fullname ? errors.fullname : ''
                }
              />
            )}
            <BaseInput
              required
              title="E-mail"
              placeholder="Enter E-mail"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              errorMessage={touched.email && errors.email ? errors.email : ''}
              keyboardType="email-address"
            />
            <BaseInput
              required
              title="Password"
              placeholder="Enter password"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              errorMessage={
                touched.password && errors.password ? errors.password : ''
              }
              secureTextEntry
            />
            {isSignUp && (
              <BaseInput
                required
                title="Confirm Password"
                placeholder="Enter confirm password"
                value={values.confirm_password}
                onChangeText={handleChange('confirm_password')}
                onBlur={handleBlur('confirm_password')}
                errorMessage={
                  touched.confirm_password && errors.confirm_password
                    ? errors.confirm_password
                    : ''
                }
                secureTextEntry
              />
            )}
            <BaseButton
              title={isSignUp ? 'Sign up' : 'Sign in'}
              onPress={handleSubmit}
            />
            <View style={styles.orOptionContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>{'OR'}</Text>
              <View style={styles.divider} />
            </View>
            <BaseButton
              title={(isSignUp ? 'Sign up' : 'Sign in') + ' with Google'}
              onPress={handleGoogle}
            />
            <Text style={{ textAlign: 'center' }}>
              {isSignUp ? 'Already have account?' : "Don't have account?"}
              &nbsp;
              <Text
                style={styles.linkText}
                onPress={() => {
                  isSignUp
                    ? navigation.pop()
                    : navigation.push('Login', {
                        forSignUp: !isSignUp,
                      });
                }}
              >
                {isSignUp ? 'Sign in here' : 'Sign up now'}
              </Text>
            </Text>
          </View>
          <View style={styles.policyContainer}>
            <Text style={styles.linkText} onPress={handlePolicy}>
              {'Privacy Policy'}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
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
    justifyContent: 'center',
    gap: hp(1),
  },
  appDetail: {
    paddingVertical: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRowContainer: {
    flexDirection: 'row',
    gap: wp(3),
    backgroundColor: appColors.PRIMARY_BACKGROUND,
    borderRadius: wp(2),
    padding: wp(1.5),
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    padding: wp(2),
    borderRadius: wp(2),
  },
  selectedRoleBtn: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
  },
  form: {
    gap: hp(1),
  },
  orOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orText: {
    fontWeight: '500',
    marginHorizontal: wp(3),
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
  titleContainer: {
    gap: hp(0.5),
    alignItems: 'center',
  },
  appLogo: {
    height: hp(18),
    width: hp(18),
    resizeMode: 'center',
  },
  title: {
    fontSize: appFonts.FONT_18,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: appFonts.FONT_14,
  },
  policyContainer: {
    alignSelf: 'center',
  },
  linkText: {
    fontWeight: '500',
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
    color: appColors.PRIMARY,
  },
});
