import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import workoutReducer from './slices/workoutSlice';
import workoutProgramsReducer from './slices/workoutProgramsSlice';
import userReducer from './slices/userSlice';

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

// Configure Redux Persist for user state
const userPersistConfig = {
  key: 'user',
  storage: AsyncStorage,
  // Blacklist specific parts of state that should not be persisted
  blacklist: ['isLoading', 'error'],
};

const persistedWorkoutReducer = persistReducer(workoutPersistConfig, workoutReducer);
const persistedWorkoutProgramsReducer = persistReducer(workoutProgramsPersistConfig, workoutProgramsReducer);
const persistedUserReducer = persistReducer(userPersistConfig, userReducer);

// Configure store
export const store = configureStore({
  reducer: {
    workout: persistedWorkoutReducer,
    workoutPrograms: persistedWorkoutProgramsReducer,
    user: persistedUserReducer,
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
