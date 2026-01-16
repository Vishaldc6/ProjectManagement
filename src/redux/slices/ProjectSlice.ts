import { createSlice } from '@reduxjs/toolkit';
import { ProjectType } from '../../types/appTypes';

const PROJECT = 'PROJECT';

interface InitialStateType {
  projectList: ProjectType[];
}

const initialState: InitialStateType = {
  projectList: [],
};

const ProjectSlice = createSlice({
  initialState,
  name: PROJECT,
  reducers: {
    setProjectList: (state, action) => {
      state.projectList = action.payload;
    },
  },
});

export const { setProjectList } = ProjectSlice.actions;

export default ProjectSlice.reducer;
