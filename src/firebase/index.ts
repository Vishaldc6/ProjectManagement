import { getApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';
import { getMessaging } from '@react-native-firebase/messaging';

export const firebaseApp = getApp();

export const db = getFirestore(firebaseApp);

export const messagingApp = getMessaging(firebaseApp);
