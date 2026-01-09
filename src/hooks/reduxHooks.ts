import { useDispatch, useSelector } from 'react-redux';
import { store } from '../redux/store';

type AppDispatch = typeof store.dispatch;
type RootState = typeof store.getState;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
