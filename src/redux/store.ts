import {
  combineReducers,
  configureStore,
  PayloadAction,
} from '@reduxjs/toolkit';

import AuthSlice from './slices/AuthSlice';
import {
  PERSIST,
  persistReducer,
  persistStore,
  REGISTER
} from 'redux-persist';
import logger from 'redux-logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const reducers = combineReducers({
  AuthReducer: AuthSlice,
});

export const USER_LOGOUT = 'USER_LOGOUT';

const getRootReducers = (
  state: ReturnType<typeof reducers> | undefined,
  action: PayloadAction,
) => {
  if (action.type === USER_LOGOUT) {
    AsyncStorage.removeItem('persist:root');
    return reducers(undefined, action); // Reset all reducers to their initial state
  }
  return reducers(state, action);
};

const persistReducers = persistReducer(
  { key: 'root', storage: AsyncStorage },
  getRootReducers,
);

export const store = configureStore({
  reducer: persistReducers,
  middleware: getDefaultMiddleware => {
    const DefaultMiddleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [PERSIST, REGISTER],
      },
    });
    return __DEV__ ? DefaultMiddleware.concat(logger) : DefaultMiddleware;
  },
});

export const persistor = persistStore(store);
