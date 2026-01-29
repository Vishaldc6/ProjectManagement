import { RouteProp, useRoute } from '@react-navigation/native';
import {
  DrawerNavigatorType,
  MemberStackNavigatorType,
  ProjectStackNavigatorType,
  RootStackNavigatorType,
  TaskStackNavigatorType,
} from '../types/navigationTypes';

type RootType = RootStackNavigatorType &
  DrawerNavigatorType &
  ProjectStackNavigatorType &
  TaskStackNavigatorType &
  MemberStackNavigatorType;

export const useAppRoutes = <screenName extends keyof RootType>() => {
  return useRoute<RouteProp<RootType, screenName>>();
};
