import { getApp } from '@react-native-firebase/app';
import {
  collection,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where,
} from '@react-native-firebase/firestore';
import { MemberType, UserType } from '../types/appTypes';

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

// update new user
export const updateUser = async (docId: string, data: UserType) => {
  // const result = await setDoc(userRef.doc(docId), data);
  // console.log({ result });
  return addUser(docId, data);
};

// fetch all members - no admin
export const fetchMembers = async () => {
  const q = query(userRef, where('role', '!=', 'Admin'));
  const memberList: MemberType[] = [];

  const unsubscribe = onSnapshot(q, querySnapshot => {
    querySnapshot.forEach((doc: any) => {
      console.log('querySnapshot ', { data: doc.data() });

      memberList.push(doc.data());
      console.log('after querySnapshot ', { memberList });
    });
  });

  const roleList = ['All', ...memberList.map(({ role }) => role)];
  console.log('fetchMembers: ', { memberList });

  return { unsubscribe, memberList, roleList };
};
