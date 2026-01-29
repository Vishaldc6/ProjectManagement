import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  FieldPath,
  FirebaseFirestoreTypes,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

import { ProjectType } from '../../types/appTypes';
import { projectRef } from '../../firebase/projectCollection';

interface InitialStateType {
  lastDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot;
  projectList: ProjectType[];
  hasMore: boolean;
}

const PROJECT = 'PROJECT_SLICE';

const initialState: InitialStateType = {
  projectList: [],
  lastDoc: undefined,
  hasMore: false,
};

interface ProjectParamsType {
  seeArchive?: boolean;
  isAdmin?: boolean;
  userId?: string;
  lastDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot;
  init?: boolean;
  searchTitle?: string;
  searchStatus?: string;
}

interface ProjectReturnType {
  lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot;
  projectList: ProjectType[];
  hasMore: boolean;
}

export const PROJECT_PAGE_SIZE = 10;

export const fetchProjects = createAsyncThunk<
  ProjectReturnType,
  ProjectParamsType
>('fetchProjects', async ({ init = false, ...params }, { rejectWithValue }) => {
  try {
    console.log({ params });

    let q = query(
      projectRef,
      where('is_archived', '==', !!params?.seeArchive),
      where('is_deleted', '==', false),
      params?.searchTitle ? orderBy('title') : orderBy('updated_at', 'desc'),
      limit(PROJECT_PAGE_SIZE),
    );

    if (params.isAdmin) {
      q = q.where(new FieldPath('created_by'), '==', params.userId);
    } else {
      q = q.where(
        new FieldPath('member_list'),
        'array-contains',
        params.userId,
      );
    }

    if (params?.searchTitle) {
      q = q
        .where(
          new FieldPath('title'),
          '>=',
          params.searchTitle.trim().toLowerCase(),
        )
        .where(
          new FieldPath('title'),
          '<=',
          params.searchTitle.trim().toLowerCase() + '\uf8ff',
        );
    }
    if (params?.searchStatus && params?.searchStatus != 'ALL') {
      q = q.where(new FieldPath('status'), '==', params.searchStatus);
    }

    if (params.lastDoc && !init) {
      q = q.startAfter(params.lastDoc);
    }
    console.log({ q });

    const querySnapshot = await getDocs(q);
    console.log({ querySnapshot });
    const projects: ProjectType[] = [];
    querySnapshot.forEach((doc: any) => projects.push(doc.data()));

    return {
      lastDoc: querySnapshot.docs.at(-1),
      projectList: projects,
      hasMore: querySnapshot.docs.length === PROJECT_PAGE_SIZE,
    };
  } catch (error) {
    console.log({ error });
    return rejectWithValue(error);
  }
});

const ProjectSlice = createSlice({
  initialState,
  name: PROJECT,
  reducers: {
    resetProjectList: state => {
      state.projectList = [];
      state.hasMore = false;
      state.lastDoc = undefined;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchProjects.fulfilled, (state, action) => {
      state.hasMore = action.payload.hasMore;
      state.lastDoc = action.payload.lastDoc;
      state.projectList = action.meta.arg.init
        ? action.payload.projectList
        : [...state.projectList, ...action.payload.projectList];
    });
    builder.addCase(fetchProjects.rejected, state => {
      state.projectList = [];
      state.hasMore = false;
      state.lastDoc = undefined;
    });
  },
});

export const { resetProjectList } = ProjectSlice.actions;
export default ProjectSlice.reducer;
