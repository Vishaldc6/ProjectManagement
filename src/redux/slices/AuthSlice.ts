import { createSlice } from '@reduxjs/toolkit';
import { UserType } from '../../types/appTypes';


interface InitialStateType {
  user?: UserType;
}

const AUTH = 'AUTH_SLICE';

const initialState: InitialStateType = {};

const AuthSlice = createSlice({
  initialState,
  name: AUTH,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setUser } = AuthSlice.actions;
export default AuthSlice.reducer;
