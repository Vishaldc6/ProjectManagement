import { useEffect } from 'react';
import { ViewProps } from 'react-native';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import { messagingApp } from '../firebase';
import { navigationRef } from '../navigations/RootNavigator';
import { NotificationDataType } from '../utils/helperFunctions';

const NotificationController = ({ children }: ViewProps) => {
  useEffect(() => {
    const onForegroundUnsubscribe = notifee.onForegroundEvent(event => {
      switch (event.type) {
        case EventType.DISMISSED:
          console.log('User dismissed notification', event.detail.notification);
          break;
        case EventType.PRESS:
          console.log('User pressed notification', event.detail.notification);
          handleNavigation(event.detail.notification?.data as NotificationDataType);
          break;
      }
    });

    const onMessageUnsubscribe = messagingApp.onMessage(async remoteMessage => {
      console.log('onMessage: ', { remoteMessage });

      displayNotification(remoteMessage);
    });

    const unsubscribe = messagingApp.onNotificationOpenedApp(remoteMessage => {
      // open notification from bg
      console.log('onNotificationOpenedApp: ', { remoteMessage });
      handleNavigation(remoteMessage.data as NotificationDataType);
    });

    messagingApp.getInitialNotification().then(remoteMessage => {
      // open notification from killed
      console.log('messagingApp getInitialNotification: ', { remoteMessage });
      handleNavigation(remoteMessage?.data as NotificationDataType);
    });

    return () => {
      onForegroundUnsubscribe();
      onMessageUnsubscribe();
      unsubscribe();
    };
  }, []);

  const displayNotification = async (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  ) => {
    const currentRoute = navigationRef.current?.getCurrentRoute();
    console.log({ currentRoute });

    if (
      (remoteMessage.data?.task_id && currentRoute?.name === 'TaskDetail') ||
      (remoteMessage.data?.project_id && currentRoute?.name === 'ProjectDetail')
    ) {
      console.log('same screen');
      return;
    }
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    notifee.displayNotification({
      android: {
        channelId,
      },
      body: remoteMessage.notification?.body,
      title: remoteMessage.notification?.title,
      data: remoteMessage.data,
    });
  };

  const handleNavigation = (data?: NotificationDataType) => {
    if (data?.project_id) {
      navigationRef.current?.navigate('Drawer', {
        screen: 'ProjectStack',
        params: {
          initial: false,
          screen: 'ProjectDetail',
          params: {
            id: data.project_id.toString(),
          },
        },
      });
    }
    if (data?.task_id) {
      navigationRef.current?.navigate('Drawer', {
        screen: 'TaskStack',
        params: {
          initial: false,
          screen: 'TaskDetail',
          params: {
            id: data.task_id.toString(),
          },
        },
      });
    }
  };

  return children;
};

export default NotificationController;
