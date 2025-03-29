import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutProgram, WorkoutSession, WorkoutStats, AchievementProgress, Stats } from '../types';

// Storage keys
const WORKOUT_PROGRAMS_KEY = '@treadtrail:workout_programs';
const WORKOUT_HISTORY_KEY = '@treadtrail:workout_history';
const STATS_KEY = '@treadtrail:stats';

// Initial stats
const INITIAL_STATS: Stats = {
  lastUpdated: new Date().toISOString(),
  stats: {
    totalWorkouts: 0,
    totalDuration: 0,
    totalSegmentsCompleted: 0,
    workoutsByCategory: {
      'Easy \ud83d\udc23': 0,
      'Trad HIIT \ud83c\udfc3\ud83c\udffc': 0,
      'Hills \u26f0': 0,
      'Endurance \ud83d\udcaa\ud83c\udffd': 0,
      'Death \ud83d\udc80': 0,
    },
    workoutsByFocus: {
      endurance: 0,
      hiit: 0,
      fat_burn: 0,
    },
    lastWorkoutDate: null,
    longestWorkout: {
      duration: 0,
      date: '',
    },
  },
  achievements: [],
};

// Context type definition
interface DataContextType {
  workoutPrograms: WorkoutProgram[];
  workoutHistory: WorkoutSession[];
  stats: Stats;
  isLoading: boolean;
  error: string | null;
  getWorkoutById: (id: string) => WorkoutProgram | undefined;
  getSessionById: (id: string) => WorkoutSession | undefined;
  toggleFavorite: (id: string) => Promise<void>;
  addWorkoutSession: (session: WorkoutSession) => Promise<void>;
  updateStats: () => Promise<void>;
}

// Create the context
export const DataContext = createContext<DataContextType>({
  workoutPrograms: [],
  workoutHistory: [],
  stats: INITIAL_STATS,
  isLoading: true,
  error: null,
  getWorkoutById: () => undefined,
  getSessionById: () => undefined,
  toggleFavorite: async () => {},
  addWorkoutSession: async () => {},
  updateStats: async () => {},
});

// Provider component
interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [workoutPrograms, setWorkoutPrograms] = useState<WorkoutProgram[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Load workout programs from storage
        const storedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
        if (storedPrograms) {
          setWorkoutPrograms(JSON.parse(storedPrograms));
        } else {
          // Initialize empty programs
          await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify([]));
          setWorkoutPrograms([]);
        }
        
        // Load workout history from storage
        const storedHistory = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
        if (storedHistory) {
          setWorkoutHistory(JSON.parse(storedHistory));
        } else {
          // Initialize empty history
          await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify([]));
          setWorkoutHistory([]);
        }
        
        // Load stats from storage
        const storedStats = await AsyncStorage.getItem(STATS_KEY);
        if (storedStats) {
          setStats(JSON.parse(storedStats));
        } else {
          // Initialize empty stats
          await AsyncStorage.setItem(STATS_KEY, JSON.stringify(INITIAL_STATS));
          setStats(INITIAL_STATS);
        }
      } catch (err) {
        setError('Failed to initialize data');
        console.error('Error initializing data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Get workout by ID
  const getWorkoutById = (id: string): WorkoutProgram | undefined => {
    return workoutPrograms.find(workout => workout.id === id);
  };

  // Get session by ID
  const getSessionById = (id: string): WorkoutSession | undefined => {
    return workoutHistory.find(session => session.id === id);
  };

  // Toggle workout favorite status
  const toggleFavorite = async (id: string): Promise<void> => {
    try {
      // Check if workout exists
      const workoutExists = workoutPrograms.some(workout => workout.id === id);
      
      if (!workoutExists) {
        return;
      }
      
      // Create a deep copy to avoid mutation issues
      const programsCopy = JSON.parse(JSON.stringify(workoutPrograms));
      
      const updatedPrograms = programsCopy.map(workout => {
        if (workout.id === id) {
          // Ensure we're actually toggling the value
          // Cast to boolean to handle any undefined/null cases
          const currentFavorite = Boolean(workout.favorite);
          const newFavoriteStatus = !currentFavorite;
          
          return { ...workout, favorite: newFavoriteStatus };
        }
        return workout;
      });
      
      // Update state first - IMPORTANT: Force a new array reference
      setWorkoutPrograms([...updatedPrograms]);
      
      // Then persist to storage
      try {
        await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
      } catch (storageError) {
        throw storageError; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      setError('Failed to update favorite status');
      throw err; // Re-throw so the calling component knows there was an error
    }
  };

  // Add a completed workout session
  const addWorkoutSession = async (session: WorkoutSession): Promise<void> => {
    try {
      const updatedHistory = [session, ...workoutHistory];
      setWorkoutHistory(updatedHistory);
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      // Update workout's lastUsed
      const updatedPrograms = workoutPrograms.map(workout => {
        if (workout.id === session.workoutId) {
          return { ...workout, lastUsed: session.date };
        }
        return workout;
      });
      
      setWorkoutPrograms(updatedPrograms);
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
      
      // Update stats
      await updateStats();
    } catch (err) {
      setError('Failed to save workout session');
      console.error('Error saving workout session:', err);
    }
  };

  // Update stats based on current history
  const updateStats = async (): Promise<void> => {
    try {
      // Clone current stats
      const newStats: Stats = JSON.parse(JSON.stringify(stats));
      newStats.lastUpdated = new Date().toISOString();
      
      // Calculate new stats
      const updatedStats: WorkoutStats = {
        totalWorkouts: workoutHistory.length,
        totalDuration: workoutHistory.reduce((sum, session) => sum + session.duration, 0),
        totalSegmentsCompleted: workoutHistory.reduce((sum, session) => 
          sum + session.segments.filter(segment => !segment.skipped).length, 0),
        workoutsByCategory: {
          'Easy \ud83d\udc23': 0,
          'Trad HIIT \ud83c\udfc3\ud83c\udffc': 0,
          'Hills \u26f0': 0,
          'Endurance \ud83d\udcaa\ud83c\udffd': 0,
          'Death \ud83d\udc80': 0,
        },
        workoutsByFocus: {
          endurance: 0,
          hiit: 0,
          fat_burn: 0,
        },
        lastWorkoutDate: workoutHistory.length > 0 ? workoutHistory[0].date : null,
        longestWorkout: {
          duration: 0,
          date: '',
        },
      };
      
      // Find longest workout
      let longestDuration = 0;
      let longestDate = '';
      
      workoutHistory.forEach(session => {
        if (session.duration > longestDuration) {
          longestDuration = session.duration;
          longestDate = session.date;
        }
        
        // Count by category and focus
        const workout = getWorkoutById(session.workoutId);
        if (workout) {
          updatedStats.workoutsByCategory[workout.category]++;
          updatedStats.workoutsByFocus[workout.focus]++;
        }
      });
      
      updatedStats.longestWorkout = {
        duration: longestDuration,
        date: longestDate,
      };
      
      // Update achievements (to be implemented)
      // TODO: Calculate achievements
      
      // Save updated stats
      newStats.stats = updatedStats;
      setStats(newStats);
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch (err) {
      setError('Failed to update stats');
      console.error('Error updating stats:', err);
    }
  };

  // Context value
  const value = {
    workoutPrograms,
    workoutHistory,
    stats,
    isLoading,
    error,
    getWorkoutById,
    getSessionById,
    toggleFavorite,
    addWorkoutSession,
    updateStats,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};