import { RouteProp, useRoute } from '@react-navigation/native';
import {
  DrawerNavigatorType,
  ProjectStackNavigatorType,
  RootStackNavigatorType,
  TaskStackNavigatorType,
} from '../types/navigationTypes';

type RootType = RootStackNavigatorType &
  DrawerNavigatorType &
  ProjectStackNavigatorType &
  TaskStackNavigatorType;

export const useAppRoutes = <screenName extends keyof RootType>() => {
  return useRoute<RouteProp<RootType, screenName>>();
};
