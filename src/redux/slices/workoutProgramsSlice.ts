// Import necessary libraries
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutProgram, WorkoutSession, Stats } from '../../types';
import { calculateTotalDistance } from '../../utils/helpers';
import { fetchUserFavorites, addFavoriteWorkout, removeFavoriteWorkout } from '../../api/favoritesApi';
import supabase from '../../api/supabaseClient';
import NetInfo from '@react-native-community/netinfo';
import { queueWorkoutAudioDownloads } from '../../utils/audioUtils';

// Helper functions for date handling
const getMonthKey = (date: string): string => {
  return date.substring(0, 7); // Returns 'YYYY-MM' from an ISO date string
};

const getCurrentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getRecentMonthKeys = (monthsToKeep: number = 3): string[] => {
  const keys: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < monthsToKeep; i++) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1 - i;
    
    // Handle previous year
    if (month <= 0) {
      const adjustedMonth = 12 + month;
      const adjustedYear = year - 1;
      keys.push(`${adjustedYear}-${String(adjustedMonth).padStart(2, '0')}`);
    } else {
      keys.push(`${year}-${String(month).padStart(2, '0')}`);
    }
  }
  
  return keys;
};

// Storage keys
const WORKOUT_PROGRAMS_KEY = '@treadtrail:workout_programs';
const WORKOUT_HISTORY_KEY = '@treadtrail:workout_history';
const STATS_KEY = '@treadtrail:stats';
const FAVORITE_WORKOUTS_KEY = '@treadtrail:favorite_workouts';
const PENDING_SYNC_KEY = '@treadtrail:pending_sync';

// Initial stats
const INITIAL_STATS: Stats = {
  lastUpdated: new Date().toISOString(),
  stats: {
    totalWorkouts: 0,
    totalDuration: 0,
    totalDistance: 0,
    totalCaloriesBurned: 0,
    lastWorkoutDate: null,
    longestWorkout: {
      duration: 0,
      date: '',
    }
  },
  achievements: [],
};

// Define the state interface
interface WorkoutProgramsState {
  workoutPrograms: WorkoutProgram[];
  workoutHistory: WorkoutSession[];
  cachedMonths: {
    [key: string]: boolean; // Format: 'YYYY-MM'
  };
  stats: Stats;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  pendingSync: {
    workoutHistory: WorkoutSession[];
    favoriteWorkouts: string[];
  };
  lastSyncedAt: string | null;
}

// Define initial state
const initialState: WorkoutProgramsState = {
  workoutPrograms: [],
  workoutHistory: [],
  cachedMonths: {},
  stats: INITIAL_STATS,
  isLoading: true,
  error: null,
  isSyncing: false,
  pendingSync: {
    workoutHistory: [],
    favoriteWorkouts: []
  },
  lastSyncedAt: null
};

// Async thunks
const fetchWorkoutPrograms = createAsyncThunk(
  'workoutPrograms/fetch',
  async (_, { rejectWithValue }) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      let workoutPrograms: WorkoutProgram[] = [];
      let favoriteIds: string[] = [];
      
      // Get user session
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      // If offline, try to load from cache
      if (!isConnected) {
        console.log('Offline, trying to load workouts from cache');
        const cachedPrograms = await AsyncStorage.getItem('workoutPrograms');
        if (cachedPrograms) {
          workoutPrograms = JSON.parse(cachedPrograms);
          console.log(`Loaded ${workoutPrograms.length} workouts from cache`);
        } else {
          console.log('No cached workout programs found');
          return rejectWithValue('No internet connection and no cached data available');
        }
      } else {
        // Online, fetch from Supabase
        console.log('Fetching workout programs from Supabase');
        
        // Fetch workout programs from Supabase
        const { data: supabaseWorkouts, error: workoutsError } = await supabase
          .from('workout_programs')
          .select('*')
          .eq('is_active', true);
        
        if (workoutsError) {
          console.error('Error fetching workouts from Supabase:', workoutsError);
          
          // Try to use cached data as fallback
          const cachedPrograms = await AsyncStorage.getItem('workoutPrograms');
          if (cachedPrograms) {
            workoutPrograms = JSON.parse(cachedPrograms);
            console.log(`Using cached data due to Supabase error (${workoutPrograms.length} workouts)`);
          } else {
            return rejectWithValue('Failed to fetch workout programs and no cache available');
          }
        } else if (supabaseWorkouts && supabaseWorkouts.length > 0) {
          console.log(`Fetched ${supabaseWorkouts.length} workouts from Supabase`);
          
          // Fetch segments for each workout
          const workoutsWithSegments = await Promise.all(
            supabaseWorkouts.map(async (workout) => {
              const { data: segments, error: segmentsError } = await supabase
                .from('workout_segments')
                .select('*')
                .eq('workout_id', workout.id)
                .order('sequence_number', { ascending: true });
              
              if (segmentsError) {
                console.error(`Error fetching segments for workout ${workout.id}:`, segmentsError);
                return {
                  ...workout,
                  segments: [],
                };
              }
              
              // Transform segments to match app format
              const formattedSegments = segments.map(segment => {
                // Create proper audio object if URL exists
                let audioObj = undefined;
                if (segment.audio_file_url) {
                  audioObj = { file: segment.audio_file_url };
                }
                
                return {
                  type: segment.type,
                  duration: segment.duration,
                  incline: segment.incline,
                  audio: audioObj,
                };
              });
              
              return {
                id: workout.id,
                name: workout.name,
                description: workout.description,
                duration: workout.duration,
                category: workout.category,
                segments: formattedSegments,
                focus: workout.focus || 'endurance', // Default focus if not provided
                premium: workout.is_premium || false, // Default to non-premium
                intensity: workout.intensity || 1, // Default intensity
                favorite: false, // Will be set later
                lastUsed: null
              };
            })
          );
          
          workoutPrograms = workoutsWithSegments;
          console.log(`Processed ${workoutPrograms.length} workouts with segments`);
          
          // Cache the results for offline use
          await AsyncStorage.setItem('workoutPrograms', JSON.stringify(workoutPrograms));
        } else {
          console.log('No workouts found in Supabase');
          
          // Try to use cached data if no workouts found
          const cachedPrograms = await AsyncStorage.getItem('workoutPrograms');
          if (cachedPrograms) {
            workoutPrograms = JSON.parse(cachedPrograms);
            console.log(`Using cached data as no workouts found in Supabase (${workoutPrograms.length} workouts)`);
          } else {
            return rejectWithValue('No workout programs found in database and no cache available');
          }
        }
      }
      
      // Fetch user's favorite workouts
      if (userId) {
        // User is authenticated, fetch favorites from Supabase
        favoriteIds = await fetchUserFavorites();
      } else {
        // User is not authenticated, use local storage as fallback
        const storedFavorites = await AsyncStorage.getItem(FAVORITE_WORKOUTS_KEY);
        if (storedFavorites) {
          favoriteIds = JSON.parse(storedFavorites);
        }
      }
      
      // Apply favorite status to workout programs
      const result = workoutPrograms.map(workout => ({
        ...workout,
        favorite: favoriteIds.includes(workout.id)
      }));
      
      return result;
    } catch (error: any) {
      console.error('Error in fetchWorkoutPrograms:', error);
      return rejectWithValue('Failed to fetch workout programs');
    }
  }
);

// Add fetchWorkoutHistory thunk
const fetchWorkoutHistory = createAsyncThunk(
  'workoutPrograms/fetchWorkoutHistory',
  async (options: { forceRefresh?: boolean, monthKey?: string } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { forceRefresh = false, monthKey } = options;
      
      // If a specific month is requested and it's not one of the recent months to cache
      const recentMonthKeys = getRecentMonthKeys();
      const isRequestedMonthRecent = !monthKey || recentMonthKeys.includes(monthKey);
      
      // Check if we need to fetch from the server
      // 1. If forceRefresh is true
      // 2. If a specific month is requested that we don't have cached
      // 3. If we're fetching recent months and don't have them all cached
      const shouldFetchFromServer = 
        forceRefresh || 
        (monthKey && !state.workoutPrograms.cachedMonths[monthKey]) ||
        (!monthKey && !recentMonthKeys.every(key => state.workoutPrograms.cachedMonths[key]));
      
      // If we don't need to fetch and we have the requested data, return the filtered history
      if (!shouldFetchFromServer) {
        if (monthKey) {
          // Return only the requested month
          return state.workoutPrograms.workoutHistory.filter(
            session => getMonthKey(session.date) === monthKey
          );
        } else {
          // Return all cached history (which should be the recent months)
          return state.workoutPrograms.workoutHistory;
        }
      }
      
      // First check if we have cached workout history
      const cachedHistoryJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      let history: WorkoutSession[] = cachedHistoryJson ? JSON.parse(cachedHistoryJson) : [];
      
      // Try to fetch from Supabase if user is logged in
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (userId) {
          // Build the query
          let query = supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId);
          
          // If fetching a specific month
          if (monthKey) {
            const startDate = `${monthKey}-01`;
            const nextMonth = monthKey.substring(0, 5) + String(Number(monthKey.substring(5, 7)) + 1).padStart(2, '0');
            const endDate = Number(monthKey.substring(5, 7)) === 12 
              ? `${Number(monthKey.substring(0, 4)) + 1}-01-01` 
              : `${nextMonth}-01`;
            
            query = query
              .gte('date', startDate)
              .lt('date', endDate);
          } else {
            // If fetching recent months, get data for the last 3 months
            const oldestMonth = recentMonthKeys[recentMonthKeys.length - 1];
            const startDate = `${oldestMonth}-01`;
            
            query = query.gte('date', startDate);
          }
          
          // Order by date, most recent first
          query = query.order('date', { ascending: false });
          
          const { data: workoutHistory, error } = await query;
          
          if (error) throw new Error(error.message || 'Error fetching workout history');
          
          if (workoutHistory && workoutHistory.length > 0) {
            // Map database fields to app model
            const fetchedSessions = workoutHistory.map(session => {
              // Find workout name from programs
              const workoutName = getWorkoutNameFromPrograms(session.workout_id, state.workoutPrograms.workoutPrograms);
              
              return {
                id: session.id,
                workoutId: session.workout_id,
                workoutName: workoutName,
                date: session.date,
                startTime: session.start_time,
                endTime: session.end_time,
                duration: session.duration,
                completed: session.completed,
                pauses: session.pauses || [],
                segments: [], // We don't store segments in the database
                caloriesBurned: session.calories_burned,
                distance: session.distance,
                weight: session.user_weight,
                paceSettings: session.pace_settings
              };
            });
            
            if (monthKey) {
              // If fetching a specific month, return only that month's data
              return fetchedSessions;
            } else {
              // If fetching recent months, merge with existing history
              // First, remove any existing sessions from the months we're refreshing
              const existingSessionsFromOtherMonths = state.workoutPrograms.workoutHistory.filter(
                session => !recentMonthKeys.includes(getMonthKey(session.date))
              );
              
              // Combine with newly fetched sessions
              history = [...fetchedSessions, ...existingSessionsFromOtherMonths];
              
              // Save to AsyncStorage for offline use
              await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(history));
              
              return {
                sessions: history,
                cachedMonths: recentMonthKeys.reduce((acc, key) => {
                  acc[key] = true;
                  return acc;
                }, {} as {[key: string]: boolean})
              };
            }
          }
        }
      } catch (supabaseError) {
        console.error('Error fetching history from Supabase:', supabaseError);
        // Continue with cached data if available
      }
      
      // If we're here, we either have no user ID, or the fetch failed
      if (monthKey) {
        // Return filtered history for the requested month
        return history.filter(session => getMonthKey(session.date) === monthKey);
      }
      
      return {
        sessions: history,
        cachedMonths: state.workoutPrograms.cachedMonths
      };
    } catch (error: any) {
      console.error('Error in fetchWorkoutHistory:', error);
      return rejectWithValue('Failed to fetch workout history');
    }
  }
);

// Helper function to get workout name by ID
const getWorkoutNameFromPrograms = (workoutId: string, workoutPrograms: WorkoutProgram[]): string => {
  const workout = workoutPrograms.find(program => program.id === workoutId);
  return workout?.name || "Unknown Workout";
};

// Add fetchStats thunk
const fetchStats = createAsyncThunk(
  'workoutPrograms/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { pendingSync } = state.workoutPrograms;
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      let stats: Stats;
      
      if (isConnected) {
        try {
          // Get the current user ID
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          
          if (!userId) {
            throw new Error('User not authenticated');
          }
          
          // Fetch stats directly from Supabase database function with user_id parameter
          const { data, error } = await supabase.rpc('calculate_user_stats', {
            p_user_id: userId
          });
          
          if (error) throw new Error(error.message);
          
          // Use the server-calculated stats
          stats = {
            stats: data,
            lastUpdated: new Date().toISOString(),
            achievements: []
          };
          
          // Add any pending workouts to the stats
          if (pendingSync.workoutHistory.length > 0) {
            // Add pending workout stats to the server stats
            stats = addPendingWorkoutStats(stats, pendingSync.workoutHistory);
          }
          
          // Cache the stats
          await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch (error) {
          console.error('Error fetching stats from server:', error);
          // Fall back to cached stats
          const cachedStatsJson = await AsyncStorage.getItem(STATS_KEY);
          stats = cachedStatsJson ? JSON.parse(cachedStatsJson) : createEmptyStats();
        }
      } else {
        // Offline mode: use cached stats
        const cachedStatsJson = await AsyncStorage.getItem(STATS_KEY);
        stats = cachedStatsJson ? JSON.parse(cachedStatsJson) : createEmptyStats();
        
        // Add pending workouts to cached stats
        if (pendingSync.workoutHistory.length > 0) {
          stats = addPendingWorkoutStats(stats, pendingSync.workoutHistory);
        }
      }
      
      return stats;
    } catch (error: any) {
      console.error('Error in fetchStats:', error);
      return rejectWithValue('Failed to calculate stats');
    }
  }
);

// Helper function to create empty stats object
function createEmptyStats(): Stats {
  return {
    stats: {
      totalWorkouts: 0,
      totalDuration: 0,
      totalDistance: 0,
      totalCaloriesBurned: 0,
      lastWorkoutDate: null,
      longestWorkout: {
        duration: 0,
        date: '',
      }
    },
    lastUpdated: new Date().toISOString(),
    achievements: []
  };
}

// Helper function to add pending workout stats to server stats
function addPendingWorkoutStats(serverStats: Stats, pendingWorkouts: WorkoutSession[]): Stats {
  // Create a copy of the server stats
  const updatedStats = {
    ...serverStats,
    stats: { ...serverStats.stats }
  };
  
  // Add pending workout stats to the server stats
  pendingWorkouts.forEach(workout => {
    // Update total workouts count
    updatedStats.stats.totalWorkouts += 1;
    
    // Add duration
    if (workout.duration) {
      updatedStats.stats.totalDuration += workout.duration;
      
      // Check if this is the longest workout
      if (workout.duration > updatedStats.stats.longestWorkout.duration) {
        updatedStats.stats.longestWorkout = {
          duration: workout.duration,
          date: workout.date || ''
        };
      }
    }
    
    // Add distance
    if (workout.distance) {
      updatedStats.stats.totalDistance += workout.distance;
    }
    
    // Add calories burned
    if (workout.caloriesBurned) {
      updatedStats.stats.totalCaloriesBurned += workout.caloriesBurned;
    }
    
    // Update last workout date if this workout is more recent
    if (workout.date && (!updatedStats.stats.lastWorkoutDate || 
        new Date(workout.date) > new Date(updatedStats.stats.lastWorkoutDate))) {
      updatedStats.stats.lastWorkoutDate = workout.date;
    }
  });
  
  // Update the last updated timestamp
  updatedStats.lastUpdated = new Date().toISOString();
  
  return updatedStats;
}

const fetchWorkoutProgramsFromCache = createAsyncThunk(
  'workoutPrograms/fetchWorkoutProgramsFromCache',
  async (_, { rejectWithValue }) => {
    try {
      // First check if we have cached workout programs
      const cachedWorkoutsJson = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      let workouts: WorkoutProgram[] = cachedWorkoutsJson ? JSON.parse(cachedWorkoutsJson) : [];
      
      // Get favorite workout IDs
      const favoriteWorkoutIdsJson = await AsyncStorage.getItem(FAVORITE_WORKOUTS_KEY);
      const favoriteWorkoutIds: string[] = favoriteWorkoutIdsJson 
        ? JSON.parse(favoriteWorkoutIdsJson) 
        : [];
      
      try {
        // Try to fetch from Supabase
        const { data: workoutData, error } = await supabase
          .from('workout_programs')
          .select(`
            id, 
            name, 
            description, 
            duration, 
            focus, 
            category, 
            intensity,
            is_premium,
            segments (
              id,
              type,
              duration,
              incline,
              audio_file
            )
          `)
          .order('name');
        
        if (error) throw new Error(error.message || 'Error fetching workout programs');
        
        if (workoutData && workoutData.length > 0) {
          // Transform the data to match our app's data model
          workouts = workoutData.map(workout => {
            // Map segments and add audio information
            const segments = workout.segments.map(segment => ({
              type: segment.type,
              duration: segment.duration,
              incline: segment.incline,
              audio: segment.audio_file ? {
                file: segment.audio_file,
                duration: 0 // We don't know the duration from the API
              } : undefined
            }));
            
            // Check if this workout is in favorites
            const isFavorite = favoriteWorkoutIds.includes(workout.id);
            
            return {
              id: workout.id,
              name: workout.name,
              description: workout.description,
              duration: workout.duration,
              focus: workout.focus,
              category: workout.category,
              intensity: workout.intensity,
              premium: workout.is_premium,
              favorite: isFavorite,
              lastUsed: null,
              segments
            };
          });
          
          // Save to AsyncStorage for offline use
          await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(workouts));
          
          // Queue audio downloads for all workouts in the background
          workouts.forEach(workout => {
            queueWorkoutAudioDownloads(workout).catch((error: any) => {
              console.error(`Error queuing audio downloads for workout ${workout.id}:`, error);
            });
          });
        }
      } catch (supabaseError) {
        console.error('Error fetching from Supabase:', supabaseError);
        // Continue with cached data if available
      }
      
      return workouts;
    } catch (error: any) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Add workout session thunk
const addWorkoutSession = createAsyncThunk(
  'workoutPrograms/addWorkoutSession',
  async (session: WorkoutSession, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms } = state.workoutPrograms;
      
      // Add session to local history
      const updatedHistory = [session, ...workoutHistory];
      
      // Persist updated history to local storage
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      // Update workout's lastUsed
      const updatedPrograms = workoutPrograms.map(workout => {
        if (workout.id === session.workoutId) {
          return { ...workout, lastUsed: session.date };
        }
        return workout;
      });
      
      // Persist updated programs to local storage
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
      
      // Refresh stats after adding a new workout
      dispatch(fetchStats());
      
      return {
        session,
        updatedPrograms,
      };
    } catch (error: any) {
      console.error('Error in addWorkoutSession:', error);
      return rejectWithValue('Failed to save workout session');
    }
  }
);

// New thunk for toggling workout favorites with backend integration
const toggleFavoriteWorkout = createAsyncThunk(
  'workoutPrograms/toggleFavorite',
  async (workoutId: string, { getState, dispatch }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const workout = state.workoutPrograms.workoutPrograms.find(w => w.id === workoutId);
      
      if (!workout) {
        throw new Error('Workout not found');
      }
      
      // Get current favorite status
      const currentFavorite = Boolean(workout.favorite);
      const newFavoriteStatus = !currentFavorite;
      
      // First update local state for immediate UI feedback
      dispatch(toggleWorkoutFavorite(workoutId));
      
      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session?.user) {
        // User is authenticated, update in Supabase
        if (newFavoriteStatus) {
          await addFavoriteWorkout(workoutId);
        } else {
          await removeFavoriteWorkout(workoutId);
        }
      }
      
      return { workoutId, favorite: newFavoriteStatus };
    } catch (error: any) {
      console.error('Error toggling favorite workout:', error);
      // If there was an error, toggle back to original state
      dispatch(toggleWorkoutFavorite(workoutId));
      throw error;
    }
  }
);

// Add workout session to pending queue thunk
const addWorkoutSessionToPendingQueue = createAsyncThunk(
  'workoutPrograms/addWorkoutSessionToPendingQueue',
  async (session: WorkoutSession, { getState, dispatch }) => {
    try {
      console.log('[QUEUE] Adding workout session to pending queue:', session.id);
      console.log('[QUEUE] Workout details:', JSON.stringify({
        id: session.id,
        workoutId: session.workoutId,
        workoutName: session.workoutName,
        date: session.date,
        duration: session.duration,
        completed: session.completed
      }));
      
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      
      // Ensure workout name is set
      let workoutToAdd = session;
      if (!session.workoutName) {
        console.log('[QUEUE] Workout name missing, retrieving from workout programs');
        const workoutName = getWorkoutNameFromPrograms(session.workoutId, state.workoutPrograms.workoutPrograms);
        workoutToAdd = {
          ...session,
          workoutName
        };
        console.log('[QUEUE] Added workout name:', workoutName);
      }
      
      // Add to pending queue
      const updatedPendingQueue = [...state.workoutPrograms.pendingSync.workoutHistory, workoutToAdd];
      console.log(`[QUEUE] Updated pending queue size: ${updatedPendingQueue.length}`);
      
      // Save to AsyncStorage
      console.log('[QUEUE] Saving pending queue to AsyncStorage');
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({
        ...state.workoutPrograms.pendingSync,
        workoutHistory: updatedPendingQueue
      }));
      
      // Update workout's lastUsed in memory
      console.log('[QUEUE] Updating workout lastUsed timestamp');
      const updatedPrograms = state.workoutPrograms.workoutPrograms.map(workout => {
        if (workout.id === session.workoutId) {
          return { ...workout, lastUsed: session.date };
        }
        return workout;
      });
      
      // Persist updated programs to local storage
      console.log('[QUEUE] Saving updated workout programs to AsyncStorage');
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
      
      // Return the data first to update Redux state
      const result = {
        session: workoutToAdd,
        updatedPrograms,
      };
      
      // Wait a moment to ensure state is updated before processing queue
      setTimeout(() => {
        console.log('[QUEUE] Attempting to process pending queue after delay');
        dispatch(processPendingQueue());
      }, 1000);
      
      console.log('[QUEUE] Successfully added workout to pending queue');
      return result;
    } catch (error: any) {
      console.error('[QUEUE] Error in addWorkoutSessionToPendingQueue:', error);
      throw error;
    }
  }
);

// Process pending queue thunk
const processPendingQueue = createAsyncThunk(
  'workoutPrograms/processPendingQueue',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      
      // Get a fresh copy of the pending queue from AsyncStorage to avoid race conditions
      let pendingWorkouts: WorkoutSession[] = [];
      try {
        const pendingQueueJson = await AsyncStorage.getItem(PENDING_SYNC_KEY);
        if (pendingQueueJson) {
          const pendingQueue = JSON.parse(pendingQueueJson);
          pendingWorkouts = pendingQueue.workoutHistory || [];
        }
        console.log(`[SYNC] Found ${pendingWorkouts.length} pending workouts in AsyncStorage`);
      } catch (error) {
        console.error('[SYNC] Error reading pending queue from AsyncStorage:', error);
        // Fall back to Redux state if AsyncStorage read fails
        pendingWorkouts = state.workoutPrograms.pendingSync.workoutHistory;
        console.log(`[SYNC] Falling back to Redux state, found ${pendingWorkouts.length} pending workouts`);
      }
      
      // If nothing to process, return early
      if (pendingWorkouts.length === 0) {
        return { processed: 0 };
      }
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      if (!isConnected) {
        console.log('[SYNC] No internet connection available, skipping sync');
        return rejectWithValue('No internet connection available to process pending queue');
      }
      
      // Get user session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[SYNC] Session error:', sessionError);
        return rejectWithValue('Authentication error: ' + sessionError.message);
      }
      
      const userId = session?.session?.user?.id;      
      if (!userId) {
        console.log('[SYNC] User not authenticated, skipping sync');
        return rejectWithValue('User not authenticated');
      }
      
      // Process each pending workout
      let successCount = 0;
      let failureCount = 0;
      
      for (const workout of pendingWorkouts) {
        try {
          // Get user settings for weight if not provided in workout
          let userWeight = workout.weight;
          if (!userWeight) {
            try {
              const { data: userSettings } = await supabase
                .from('user_settings')
                .select('weight')
                .eq('id', userId)
                .single();
                
              if (userSettings?.weight) {
                userWeight = userSettings.weight;
              }
            } catch (error) {
              console.error('[SYNC] Error fetching user weight:', error);
            }
          }
          // Insert workout to Supabase          
          const { data, error } = await supabase
            .from('workout_history')
            .upsert({
              id: workout.id,
              user_id: userId,
              workout_id: workout.workoutId,
              date: workout.date,
              start_time: workout.startTime,
              end_time: workout.endTime,
              duration: workout.duration,
              user_weight: userWeight, // Use fetched user weight if available
              calories_burned: workout.caloriesBurned,
              distance: workout.distance,
              completed: workout.completed,
              pauses: workout.pauses,
              pace_settings: workout.paceSettings || {} // Include pace settings
            })
            .select();
          
          if (error) {
            console.error('[SYNC] Error syncing workout:', error);
            console.error('[SYNC] Error details:', JSON.stringify(error));
            console.error('[SYNC] Failed workout data:', JSON.stringify(workout));
            failureCount++;
            continue;
          }
          
          successCount++;
        } catch (error) {
          console.error('[SYNC] Error processing workout in queue:', error);
          console.error('[SYNC] Failed workout data:', JSON.stringify(workout));
          failureCount++;
          // Continue with next workout
        }
      }
      
      console.log(`[SYNC] Processed ${successCount} out of ${pendingWorkouts.length} workouts successfully, ${failureCount} failures`);
      
      // Update user's last_active timestamp
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', userId);
          
        if (updateError) {
          console.error('[SYNC] Error updating last_active timestamp:', updateError);
        }
      } catch (error) {
        console.error('[SYNC] Error updating last_active timestamp:', error);
      }
      
      // If we processed any workouts successfully, clear the queue and refresh data
      if (successCount > 0) {
        // Only remove successfully processed workouts
        const remainingWorkouts = pendingWorkouts.filter((_, index) => {
          // This is a simplification - in a real implementation we'd track which specific workouts failed
          return index >= successCount;
        });
        
        // Clear the pending queue
        await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({
          ...state.workoutPrograms.pendingSync,
          workoutHistory: remainingWorkouts
        }));
        
        // Refresh workout history and stats
        await dispatch(fetchWorkoutHistory({ forceRefresh: true })).unwrap();
        await dispatch(fetchStats()).unwrap();
      } else {
        console.log('[SYNC] No workouts were processed successfully, keeping queue intact');
      }
      
      console.log('[SYNC] Queue processing complete');
      return { 
        processed: successCount,
        total: pendingWorkouts.length,
        failed: failureCount
      };
    } catch (error: any) {
      console.error('[SYNC] Error processing pending queue:', error);
      return rejectWithValue('Failed to process pending queue');
    }
  }
);

// Initialize pending queue thunk
const initializePendingQueue = createAsyncThunk(
  'workoutPrograms/initializePendingQueue',
  async (_, { dispatch }) => {
    try {
      // Load pending queue from AsyncStorage
      const pendingQueueJson = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const pendingQueue = pendingQueueJson ? JSON.parse(pendingQueueJson) : { workoutHistory: [], favoriteWorkouts: [] };
      
      if (pendingQueue.workoutHistory.length > 0) {
        // Try to process the queue after a short delay to ensure app is fully initialized
        setTimeout(() => {
          console.log('[SYNC-INIT] Attempting to process pending queue after app initialization');
          dispatch(processPendingQueue());
        }, 3000);
      }
      
      return pendingQueue;
    } catch (error: any) {
      console.error('[SYNC-INIT] Error initializing pending queue:', error);
      return { workoutHistory: [], favoriteWorkouts: [] };
    }
  }
);

// Function to check and process pending queue - can be called from any component
const checkAndProcessPendingQueue = createAsyncThunk(
  'workoutPrograms/checkAndProcessPendingQueue',
  async (_, { dispatch, getState }) => {
    try {
      // Read directly from AsyncStorage to avoid race conditions
      let pendingCount = 0;
      try {
        const pendingQueueJson = await AsyncStorage.getItem(PENDING_SYNC_KEY);
        if (pendingQueueJson) {
          const pendingQueue = JSON.parse(pendingQueueJson);
          pendingCount = pendingQueue.workoutHistory?.length || 0;
        }
      } catch (error) {
        console.error('[SYNC-CHECK] Error reading from AsyncStorage:', error);
        // Fall back to Redux state
        const state = getState() as { workoutPrograms: WorkoutProgramsState };
        pendingCount = state.workoutPrograms.pendingSync.workoutHistory.length;
        console.log(`[SYNC-CHECK] Falling back to Redux state, found ${pendingCount} pending workouts`);
      }
      
      if (pendingCount > 0) {
        await dispatch(processPendingQueue()).unwrap();
        return { triggered: true, pendingCount };
      } else {
        return { triggered: false, pendingCount: 0 };
      }
    } catch (error) {
      console.error('[SYNC-CHECK] Error checking pending queue:', error);
      return { triggered: false, error: true };
    }
  }
);

// Create slice
const workoutProgramsSlice = createSlice({
  name: 'workoutPrograms',
  initialState,
  reducers: {
    // Reducer to toggle a workout's favorite status
    toggleWorkoutFavorite: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      
      // Find the workout
      const workoutIndex = state.workoutPrograms.findIndex(w => w.id === id);
      
      if (workoutIndex !== -1) {
        // Get current favorite status and toggle it
        const currentFavorite = Boolean(state.workoutPrograms[workoutIndex].favorite);
        const newFavoriteStatus = !currentFavorite;
        
        // Update the workout object with the new favorite status
        state.workoutPrograms[workoutIndex] = {
          ...state.workoutPrograms[workoutIndex],
          favorite: newFavoriteStatus
        };
        
        // Get all favorite workout IDs
        const favoriteIds = state.workoutPrograms
          .filter(workout => Boolean(workout.favorite))
          .map(workout => workout.id);
        
        // Persist only the favorite IDs to storage asynchronously
        // This is kept for offline fallback
        AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(favoriteIds))
          .catch((err: any) => console.error('AsyncStorage error:', err));
      }
    },
  },

  extraReducers: (builder) => {
    // Handle fetchWorkoutPrograms
    builder.addCase(fetchWorkoutPrograms.pending, (state) => {
      console.log('[DEBUG-REDUX] fetchWorkoutPrograms.pending - Setting isLoading to true');
      // Only set isLoading to true if we don't already have workout programs
      if (state.workoutPrograms.length === 0) {
        state.isLoading = true;
      } else {
        console.log('[DEBUG-REDUX] fetchWorkoutPrograms.pending - Already have data, not setting loading state');
      }
      state.error = null;
    });
    builder.addCase(fetchWorkoutPrograms.fulfilled, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchWorkoutPrograms.fulfilled - Received ${action.payload.length} workouts`);
      state.workoutPrograms = action.payload;
      state.isLoading = false;
      console.log('[DEBUG-REDUX] fetchWorkoutPrograms.fulfilled - Set isLoading to false');
    });
    builder.addCase(fetchWorkoutPrograms.rejected, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchWorkoutPrograms.rejected - Error: ${action.payload}`);
      state.error = action.payload as string;
      state.isLoading = false;
      console.log('[DEBUG-REDUX] fetchWorkoutPrograms.rejected - Set isLoading to false');
    });
    
    // Handle fetchWorkoutHistory
    builder.addCase(fetchWorkoutHistory.pending, (state) => {
      console.log('[DEBUG-REDUX] fetchWorkoutHistory.pending');
      state.error = null;
      // Don't set isLoading to true here to avoid blocking UI
    });
    builder.addCase(fetchWorkoutHistory.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        console.log(`[DEBUG-REDUX] fetchWorkoutHistory.fulfilled - Received ${action.payload.length} history items`);
        state.workoutHistory = action.payload;
      } else {
        console.log(`[DEBUG-REDUX] fetchWorkoutHistory.fulfilled - Received ${action.payload.sessions.length} history items`);
        state.workoutHistory = action.payload.sessions;
        state.cachedMonths = action.payload.cachedMonths;
      }
      // Don't modify isLoading here
    });
    builder.addCase(fetchWorkoutHistory.rejected, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchWorkoutHistory.rejected - Error: ${action.payload}`);
      state.error = action.payload as string;
      // Don't modify isLoading here
    });
    
    // Handle fetchStats
    builder.addCase(fetchStats.pending, (state) => {
      console.log('[DEBUG-REDUX] fetchStats.pending');
      state.error = null;
      // Don't set isLoading to true here to avoid blocking UI
    });
    builder.addCase(fetchStats.fulfilled, (state, action) => {
      console.log('[DEBUG-REDUX] fetchStats.fulfilled - Received stats data');
      state.stats = action.payload;
      // Don't modify isLoading here
    });
    builder.addCase(fetchStats.rejected, (state, action) => {
      console.log(`[DEBUG-REDUX] fetchStats.rejected - Error: ${action.payload}`);
      state.error = action.payload as string;
      // Don't modify isLoading here
    });
    
    // Handle addWorkoutSession
    builder.addCase(addWorkoutSession.pending, (state) => {
      // Processing
    });
    builder.addCase(addWorkoutSession.fulfilled, (state, action) => {
      const { session, updatedPrograms } = action.payload;
      state.workoutHistory = [session, ...state.workoutHistory];
      state.workoutPrograms = updatedPrograms;
    });
    builder.addCase(addWorkoutSession.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle addWorkoutSessionToPendingQueue
    builder.addCase(addWorkoutSessionToPendingQueue.pending, (state) => {
      // Processing
    });
    builder.addCase(addWorkoutSessionToPendingQueue.fulfilled, (state, action) => {
      const { session, updatedPrograms } = action.payload;
      state.workoutHistory = [session, ...state.workoutHistory];
      state.workoutPrograms = updatedPrograms;
    });
    builder.addCase(addWorkoutSessionToPendingQueue.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle processPendingQueue
    builder.addCase(processPendingQueue.pending, (state) => {
      state.isSyncing = true;
    });
    builder.addCase(processPendingQueue.fulfilled, (state, action) => {
      state.isSyncing = false;
      state.pendingSync.workoutHistory = [];
    });
    builder.addCase(processPendingQueue.rejected, (state, action) => {
      state.isSyncing = false;
      state.error = action.payload as string;
    });
    
    // Handle initializePendingQueue
    builder.addCase(initializePendingQueue.fulfilled, (state, action) => {
      state.pendingSync = action.payload;
    });
  },
});

// Export actions and selectors
export const { toggleWorkoutFavorite } = workoutProgramsSlice.actions;

// Export selectors
export const selectWorkoutPrograms = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.workoutPrograms;
export const selectWorkoutHistory = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.workoutHistory;
export const selectStats = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.stats;
export const selectIsLoading = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.isLoading;
export const selectError = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.error;
export const selectIsSyncing = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.isSyncing;
export const selectLastSyncedAt = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.lastSyncedAt;
export const selectPendingSync = (state: { workoutPrograms: WorkoutProgramsState }) => state.workoutPrograms.pendingSync;

// Helper selectors
export const selectWorkoutById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutPrograms.find(workout => workout.id === id);

export const selectSessionById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutHistory.find(session => session.id === id);

// Export reducer
export default workoutProgramsSlice.reducer;

// Export async thunks
export {
  fetchWorkoutPrograms,
  fetchWorkoutHistory,
  fetchStats,
  addWorkoutSession,
  toggleFavoriteWorkout,
  addWorkoutSessionToPendingQueue,
  processPendingQueue,
  initializePendingQueue,
  checkAndProcessPendingQueue
};