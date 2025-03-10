import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import workoutReducer from './slices/workoutSlice';
import workoutProgramsReducer from './slices/workoutProgramsSlice';

// Configure Redux Persist for workout state
const workoutPersistConfig = {
  key: 'workout',
  storage: AsyncStorage,
};

// Configure Redux Persist for workout programs state
const workoutProgramsPersistConfig = {
  key: 'workoutPrograms',
  storage: AsyncStorage,
};

const persistedWorkoutReducer = persistReducer(workoutPersistConfig, workoutReducer);
const persistedWorkoutProgramsReducer = persistReducer(workoutProgramsPersistConfig, workoutProgramsReducer);

// Configure store
export const store = configureStore({
  reducer: {
    workout: persistedWorkoutReducer,
    workoutPrograms: persistedWorkoutProgramsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
