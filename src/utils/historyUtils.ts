import { WorkoutSession } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys - avoid using @ symbol which might cause issues with Expo's storage
const WORKOUT_HISTORY_KEY = 'treadtrail_workout_history';

// Create a new workout session (simplified implementation)
export const createWorkoutSession = async (session: WorkoutSession): Promise<string> => {
  try {
    // First get existing history
    const storedHistory = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
    let workoutHistory: WorkoutSession[] = [];
    
    if (storedHistory) {
      workoutHistory = JSON.parse(storedHistory);
    }
    
    // Add new session to the beginning of the array
    workoutHistory = [session, ...workoutHistory];
    
    // Save updated history
    await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(workoutHistory));
    
    // Return the session ID
    return session.id;
  } catch (error) {
    console.error('Error creating workout session:', error);
    throw error;
  }
};

// Get workout session by ID
export const getWorkoutSessionById = async (id: string): Promise<WorkoutSession | null> => {
  try {
    const storedHistory = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
    if (!storedHistory) return null;
    
    const workoutHistory: WorkoutSession[] = JSON.parse(storedHistory);
    return workoutHistory.find(session => session.id === id) || null;
  } catch (error) {
    console.error('Error getting workout session:', error);
    return null;
  }
};

// Get all workout sessions
export const getAllWorkoutSessions = async (): Promise<WorkoutSession[]> => {
  try {
    const storedHistory = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
    if (!storedHistory) return [];
    
    return JSON.parse(storedHistory);
  } catch (error) {
    console.error('Error getting all workout sessions:', error);
    return [];
  }
};