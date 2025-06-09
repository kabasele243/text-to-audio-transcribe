import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// Additional utility hooks following RTK best practices
export const useAppStore = () => {
  const dispatch = useAppDispatch();
  const getState = () => useAppSelector(state => state);
  return { dispatch, getState };
}; 