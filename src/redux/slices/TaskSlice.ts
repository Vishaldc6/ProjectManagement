import { createSlice } from '@reduxjs/toolkit';
import { TaskType } from '../../types/appTypes';

const TASKS = 'TASKS';

interface InitialStateType {
  taskList: TaskType[];
}

const initialState: InitialStateType = {
  taskList: [],
};

const TaskSlice = createSlice({
  initialState,
  name: TASKS,
  reducers: {
    setTaskList: (state, action) => {
      state.taskList = action.payload;
    },
  },
});

export const { setTaskList } = TaskSlice.actions;

export default TaskSlice.reducer;
