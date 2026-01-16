import { Timestamp } from '@react-native-firebase/firestore';
import { AuthorizationStatus } from '@react-native-firebase/messaging';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

import { RolesType } from '../types/appTypes';
import { messagingApp } from '../firebase';

export const toCapitalize = (text: string) => {
  const textList = text.trim().split(' ');
  let res = '';
  textList.forEach((t, i) => {
    res += t.trim()[0].toUpperCase() + t.trim().slice(1).toLocaleLowerCase();
    if (textList.length > 1 && i != textList.length - 1) {
      res += ' ';
    }
  });
  return res;
};

export const timestampToDate = (timestamp?: Timestamp) => {
  const _date = timestamp?.toDate();
  const day = _date?.getDate().toString().padStart(2, '0');
  const month = ((_date?.getMonth() ?? 0) + 1).toString().padStart(2, '0');
  const res =
    day +
    '/' +
    month +
    '/' +
    _date?.getFullYear() +
    ', ' +
    _date?.toTimeString().substring(0, 5);
  // 02/01/2026, 13:29
  return res;
};

export const convertToDate = (timestamp?: Timestamp) => {
  const date = timestamp?.toDate().toDateString();
  // 'Tue Jan 13 2026'
  return date;
};

const ADMIN_EMAIL_LIST = ['vishalchaudharee8@gmail.com'];

export const setUserRole = (email: string): RolesType => {
  return ADMIN_EMAIL_LIST.includes(email) ? 'Admin' : 'Developer';
};

// request user for notification permission
export async function requestUserPermission() {
  if (!messagingApp.isDeviceRegisteredForRemoteMessages) {
    messagingApp.registerDeviceForRemoteMessages();
  }

  const hasPermission = await messagingApp.hasPermission();
  const permissionList = [
    AuthorizationStatus.AUTHORIZED,
    AuthorizationStatus.PROVISIONAL,
  ];
  if (!permissionList.includes(hasPermission)) {
    const authStatus = await messagingApp.requestPermission();

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const requestResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (requestResult !== 'granted') {
        Alert.alert('Notification', 'Notification permission not granted');
      }
      console.log('Permission:', requestResult);
    }

    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    console.log('Authorization status:', { authStatus, enabled });
  }

  console.log('Authorization status:', { hasPermission });
}

export type NotificationDataType = {
  user_id: string;
  title: string;
  body: string;
  data: any;
};

// send notification
export const sendNotification = async (bodyData: NotificationDataType) => {
  fetch('http://192.168.200.72:3000/send-notification', {
    body: JSON.stringify(bodyData),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(res => {
      console.log('sendNotification: ', { res });
    })
    .catch(error => {
      console.log('sendNotification: ', { error });
    });
};
