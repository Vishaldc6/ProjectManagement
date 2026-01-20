import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getMessaging } from '@react-native-firebase/messaging';

export const firebaseApp = getApp();

export const authApp = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);

export const messagingApp = getMessaging(firebaseApp);
