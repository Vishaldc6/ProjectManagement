import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  DrawerNavigatorType,
  MemberStackNavigatorType,
  ProjectStackNavigatorType,
  RootStackNavigatorType,
  TaskStackNavigatorType,
} from '../types/navigationTypes';
import { useNavigation } from '@react-navigation/native';

type ScreenNameType =
  | keyof RootStackNavigatorType
  | keyof DrawerNavigatorType
  | keyof ProjectStackNavigatorType
  | keyof TaskStackNavigatorType
  | keyof MemberStackNavigatorType;

type RootType = RootStackNavigatorType &
  DrawerNavigatorType &
  ProjectStackNavigatorType &
  TaskStackNavigatorType &
  MemberStackNavigatorType;

export const useAppNavigation = (screenName: ScreenNameType) => {
  type Props = NativeStackNavigationProp<RootType, typeof screenName>;

  const navigation = useNavigation<Props>();
  return navigation;
};
