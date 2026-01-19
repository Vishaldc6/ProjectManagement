import { getApp } from '@react-native-firebase/app';
import {
  collection,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { UserType } from '../types/appTypes';

const db = getFirestore(getApp());

export const userRef = collection(db, 'users');

// get user
export const getUser = async (docId: string) => {
  const documentSnap = await getDoc(userRef.doc(docId));
  return documentSnap.data() as UserType;
};

// add new user
export const addUser = async (docId: string, data: UserType) => {
  const result = await setDoc(userRef.doc(docId), data);
  return result;
};

// update user
export const updateUser = async (docId: string, data: Partial<UserType>) => {
  return updateDoc(userRef.doc(docId), data);
};
