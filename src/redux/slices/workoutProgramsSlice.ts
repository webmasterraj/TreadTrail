// Import necessary libraries
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutProgram, WorkoutSession, Stats } from '../../types';
import { fetchUserFavorites, addFavoriteWorkout, removeFavoriteWorkout } from '../../api/favoritesApi';
import supabase from '../../api/supabaseClient';
import NetInfo from '@react-native-community/netinfo';
import { queueWorkoutAudioDownloads } from '../../utils/audioUtils';

// Debug flags
const DEBUG_STATS = false;
const DEBUG_SYNC = false;
const DEBUG_REDUX = false;
const DEBUG_QUEUE = false;
const DEBUG_FAVORITES = false; 
const DEBUG_PREMIUM = true;

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
  favoriteWorkouts: string[];
  hasPendingFavoriteChanges: boolean;
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
  favoriteWorkouts: [],
  hasPendingFavoriteChanges: false,
  lastSyncedAt: null
};

// Async thunks
const fetchWorkoutPrograms = createAsyncThunk(
  'workoutPrograms/fetch',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      // First check if we have cached workout programs
      const cachedWorkoutsJson = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      let workouts: WorkoutProgram[] = cachedWorkoutsJson ? JSON.parse(cachedWorkoutsJson) : [];
      
      // Get favorite workout IDs from AsyncStorage
      const favoriteWorkoutIdsJson = await AsyncStorage.getItem(FAVORITE_WORKOUTS_KEY);
      const localFavoriteIds: string[] = favoriteWorkoutIdsJson 
        ? JSON.parse(favoriteWorkoutIdsJson) 
        : [];
      
      // Initialize favoriteIds with local favorites
      let favoriteIds = [...localFavoriteIds];
      
      if (!isConnected) {
        console.log('No internet connection, using cached workouts and local favorites');
        
        // Apply favorite status to cached workouts
        workouts = workouts.map(workout => ({
          ...workout,
          favorite: localFavoriteIds.includes(workout.id)
        }));
        
        return { workouts, favoriteIds: localFavoriteIds };
      }
      
      // Get the current state to check if we have pending favorite changes
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const hasPendingFavoriteChanges = state.workoutPrograms.hasPendingFavoriteChanges;
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      // If we have pending favorite changes and user is authenticated, sync them first
      if (hasPendingFavoriteChanges && userId) {
        if (DEBUG_FAVORITES) console.log('[FAVORITES] Syncing pending favorite changes with backend');
        
        try {
          // Fetch current server favorites
          const serverFavoriteIds = await fetchUserFavorites();
          
          // Find favorites to add (in local but not in server)
          const favoritesToAdd = localFavoriteIds.filter(id => !serverFavoriteIds.includes(id));
          
          // Find favorites to remove (in server but not in local)
          const favoritesToRemove = serverFavoriteIds.filter(id => !localFavoriteIds.includes(id));
          
          if (DEBUG_FAVORITES) console.log(`[FAVORITES] Found ${favoritesToAdd.length} favorites to add and ${favoritesToRemove.length} to remove`);
          
          // Process additions
          for (const workoutId of favoritesToAdd) {
            await addFavoriteWorkout(workoutId);
          }
          
          // Process removals
          for (const workoutId of favoritesToRemove) {
            await removeFavoriteWorkout(workoutId);
          }
          
          // Reset the pending changes flag
          dispatch(setPendingFavoriteChanges(false));
          
          // Use local favorites as the source of truth
          favoriteIds = localFavoriteIds;
          
        } catch (error) {
          if (DEBUG_FAVORITES) console.error('[FAVORITES] Error syncing favorites:', error);
          // Continue with fetching workouts even if favorite sync fails
        }
      } else if (userId) {
        // User is authenticated, fetch favorites from Supabase
        favoriteIds = await fetchUserFavorites();
        
        // Update local storage with server favorites if no pending changes
        if (!hasPendingFavoriteChanges) {
          await AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(favoriteIds));
        }
      }
      
      // If offline, try to load from cache
      if (!isConnected) {
        console.log('Offline, trying to load workouts from cache');
        const cachedPrograms = await AsyncStorage.getItem('workoutPrograms');
        if (cachedPrograms) {
          workouts = JSON.parse(cachedPrograms);
          console.log(`Loaded ${workouts.length} workouts from cache`);
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
            workouts = JSON.parse(cachedPrograms);
            console.log(`Using cached data due to Supabase error (${workouts.length} workouts)`);
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
          
          workouts = workoutsWithSegments;
          console.log(`Processed ${workouts.length} workouts with segments`);
          
          // Cache the results for offline use
          await AsyncStorage.setItem('workoutPrograms', JSON.stringify(workouts));
          
          // Queue audio downloads for all workouts in the background
          workouts.forEach(workout => {
            queueWorkoutAudioDownloads(workout).catch((error: any) => {
              if (DEBUG_QUEUE) console.error(`Error queuing audio downloads for workout ${workout.id}:`, error);
            });
          });
        } else {
          console.log('No workouts found in Supabase');
          
          // Try to use cached data if no workouts found
          const cachedPrograms = await AsyncStorage.getItem('workoutPrograms');
          if (cachedPrograms) {
            workouts = JSON.parse(cachedPrograms);
            console.log(`Using cached data as no workouts found in Supabase (${workouts.length} workouts)`);
          } else {
            return rejectWithValue('No workout programs found in database and no cache available');
          }
        }
      }
      
      // Apply favorite status to workout programs
      workouts = workouts.map(workout => ({
        ...workout,
        favorite: favoriteIds.includes(workout.id)
      }));
      
      return { workouts, favoriteIds };
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
      
      if (DEBUG_STATS) console.log('[STATS DEBUG] Starting fetchStats, pendingSync workouts:', pendingSync.workoutHistory.length);
      
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
            achievements: [],
            source: 'server',
            pendingWorkoutsIncluded: false
          };
          
          if (DEBUG_STATS) console.log('[STATS DEBUG] Received stats from server:', {
            totalWorkouts: stats.stats.totalWorkouts,
            totalDistance: stats.stats.totalDistance,
            totalDuration: stats.stats.totalDuration,
            totalCaloriesBurned: stats.stats.totalCaloriesBurned
          });
          
          // Get the latest pendingSync state from Redux
          const latestState = getState() as { workoutPrograms: WorkoutProgramsState };
          const latestPendingWorkouts = latestState.workoutPrograms.pendingSync.workoutHistory;
          
          // If there are pending workouts, add them to the stats
          if (latestPendingWorkouts.length > 0) {
            if (DEBUG_STATS) console.log(`[STATS DEBUG] Adding ${latestPendingWorkouts.length} pending workouts to server stats`);
            stats = addPendingWorkoutStats(stats, latestPendingWorkouts);
            stats.pendingWorkoutsIncluded = true;
            
            if (DEBUG_STATS) console.log('[STATS DEBUG] Stats after adding pending workouts:', {
              totalWorkouts: stats.stats.totalWorkouts,
              totalDistance: stats.stats.totalDistance,
              totalDuration: stats.stats.totalDuration,
              totalCaloriesBurned: stats.stats.totalCaloriesBurned
            });
            
            // Cache the updated stats
            await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
            if (DEBUG_STATS) console.log('[STATS DEBUG] Updated server stats saved to AsyncStorage');
          }
        } catch (error) {
          console.error('Error fetching stats from server:', error);
          // Fall back to cached stats
          const cachedStatsJson = await AsyncStorage.getItem(STATS_KEY);
          stats = cachedStatsJson ? JSON.parse(cachedStatsJson) : createEmptyStats();
          stats.source = 'cache';
          if (DEBUG_STATS) console.log('[STATS DEBUG] Falling back to cached stats due to server error');
        }
      } else {
        // Offline mode: use cached stats
        if (DEBUG_STATS) console.log('[STATS DEBUG] Offline mode: Using cached stats');
        const cachedStatsJson = await AsyncStorage.getItem(STATS_KEY);
        
        if (cachedStatsJson) {
          if (DEBUG_STATS) console.log('[STATS DEBUG] Found cached stats in AsyncStorage');
          stats = JSON.parse(cachedStatsJson);
          stats.source = 'cache';
          stats.pendingWorkoutsIncluded = false; // Will be set to true after adding pending workouts
          
          if (DEBUG_STATS) console.log('[STATS DEBUG] Cached stats before adding pending workouts:', {
            totalWorkouts: stats.stats.totalWorkouts,
            totalDistance: stats.stats.totalDistance,
            totalDuration: stats.stats.totalDuration,
            totalCaloriesBurned: stats.stats.totalCaloriesBurned
          });
        } else {
          if (DEBUG_STATS) console.log('[STATS DEBUG] No cached stats found, creating empty stats');
          stats = createEmptyStats();
          stats.source = 'local';
        }
        
        // Add pending workouts to cached stats
        if (pendingSync.workoutHistory.length > 0) {
          if (DEBUG_STATS) console.log(`[STATS DEBUG] Adding ${pendingSync.workoutHistory.length} pending workouts to stats`);
          if (DEBUG_STATS) console.log('[STATS DEBUG] Pending workouts details:', pendingSync.workoutHistory.map(w => ({
            id: w.id,
            workoutId: w.workoutId,
            duration: w.duration,
            distance: w.distance,
            caloriesBurned: w.caloriesBurned
          })));
          
          stats = addPendingWorkoutStats(stats, pendingSync.workoutHistory);
          stats.pendingWorkoutsIncluded = true;
          
          if (DEBUG_STATS) console.log('[STATS DEBUG] Stats after adding pending workouts:', {
            totalWorkouts: stats.stats.totalWorkouts,
            totalDistance: stats.stats.totalDistance,
            totalDuration: stats.stats.totalDuration,
            totalCaloriesBurned: stats.stats.totalCaloriesBurned,
            lastUpdated: stats.lastUpdated
          });
          
          // Cache the updated stats
          await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
          if (DEBUG_STATS) console.log('[STATS DEBUG] Updated stats saved to AsyncStorage');
        } else {
          if (DEBUG_STATS) console.log('[STATS DEBUG] No pending workouts to add to stats');
        }
      }
      
      if (DEBUG_STATS) console.log('[STATS DEBUG] Final stats being returned:', {
        totalWorkouts: stats.stats.totalWorkouts,
        totalDistance: stats.stats.totalDistance,
        totalDuration: stats.stats.totalDuration,
        totalCaloriesBurned: stats.stats.totalCaloriesBurned,
        source: stats.source,
        pendingWorkoutsIncluded: stats.pendingWorkoutsIncluded
      });
      
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
    achievements: [],
    source: 'local',
    pendingWorkoutsIncluded: false
  };
}

// Helper function to add pending workout stats to server stats
function addPendingWorkoutStats(serverStats: Stats, pendingWorkouts: WorkoutSession[]): Stats {
  if (DEBUG_STATS) console.log('[STATS DEBUG] addPendingWorkoutStats called with', pendingWorkouts.length, 'pending workouts');
  if (DEBUG_STATS) console.log('[STATS DEBUG] Initial stats:', {
    totalWorkouts: serverStats.stats.totalWorkouts,
    totalDistance: serverStats.stats.totalDistance,
    totalDuration: serverStats.stats.totalDuration,
    totalCaloriesBurned: serverStats.stats.totalCaloriesBurned
  });

  // Create a copy of the server stats
  const updatedStats = {
    ...serverStats,
    stats: { ...serverStats.stats }
  };
  
  // Add pending workout stats to the server stats
  pendingWorkouts.forEach((workout, index) => {
    if (DEBUG_STATS) console.log(`[STATS DEBUG] Processing pending workout ${index + 1}/${pendingWorkouts.length}:`, {
      id: workout.id,
      workoutId: workout.workoutId,
      duration: workout.duration,
      distance: workout.distance,
      caloriesBurned: workout.caloriesBurned,
      date: workout.date
    });
    
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
        if (DEBUG_STATS) console.log('[STATS DEBUG] New longest workout:', {
          duration: workout.duration,
          date: workout.date
        });
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
      if (DEBUG_STATS) console.log('[STATS DEBUG] Updated last workout date to:', workout.date);
    }
    
    if (DEBUG_STATS) console.log(`[STATS DEBUG] Stats after processing workout ${index + 1}:`, {
      totalWorkouts: updatedStats.stats.totalWorkouts,
      totalDistance: updatedStats.stats.totalDistance,
      totalDuration: updatedStats.stats.totalDuration,
      totalCaloriesBurned: updatedStats.stats.totalCaloriesBurned
    });
  });
  
  // Update the last updated timestamp
  updatedStats.lastUpdated = new Date().toISOString();
  
  if (DEBUG_STATS) console.log('[STATS DEBUG] Final updated stats:', {
    totalWorkouts: updatedStats.stats.totalWorkouts,
    totalDistance: updatedStats.stats.totalDistance,
    totalDuration: updatedStats.stats.totalDuration,
    totalCaloriesBurned: updatedStats.stats.totalCaloriesBurned,
    lastUpdated: updatedStats.lastUpdated
  });
  
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
              if (DEBUG_QUEUE) console.error(`Error queuing audio downloads for workout ${workout.id}:`, error);
            });
          });
        }
      } catch (supabaseError) {
        if (DEBUG_QUEUE) console.error('Error fetching from Supabase:', supabaseError);
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
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      
      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session?.user && netInfo.isConnected && netInfo.isInternetReachable) {
        // User is authenticated and online, update in Supabase
        if (newFavoriteStatus) {
          await addFavoriteWorkout(workoutId);
        } else {
          await removeFavoriteWorkout(workoutId);
        }
      } else if (session?.session?.user) {
        // User is authenticated but offline, set the pending changes flag
        if (DEBUG_FAVORITES) console.log('[FAVORITES] Offline changes detected, setting pending flag');
        dispatch(setPendingFavoriteChanges(true));
      }
      
      // Save favorite workouts to AsyncStorage
      const updatedFavorites = state.workoutPrograms.workoutPrograms
        .filter(w => w.favorite || (w.id === workoutId && newFavoriteStatus))
        .map(w => w.id);
      
      await AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(updatedFavorites));
      
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
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      
      // Ensure workout name is set
      let workoutToAdd = session;
      if (!session.workoutName) {
        const workoutName = getWorkoutNameFromPrograms(session.workoutId, state.workoutPrograms.workoutPrograms);
        workoutToAdd = {
          ...session,
          workoutName
        };
      }
      
      // Add to pending queue
      const updatedPendingQueue = [...state.workoutPrograms.pendingSync.workoutHistory, workoutToAdd];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({
        ...state.workoutPrograms.pendingSync,
        workoutHistory: updatedPendingQueue
      }));
      
      // Update workout's lastUsed in memory
      const updatedPrograms = state.workoutPrograms.workoutPrograms.map(workout => {
        if (workout.id === session.workoutId) {
          return { ...workout, lastUsed: session.date };
        }
        return workout;
      });
      
      // Persist updated programs to local storage
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
      
      // Return the data first to update Redux state
      const result = {
        session: workoutToAdd,
        updatedPrograms,
      };
      
      // Refresh stats to include the new workout immediately (even when offline)
      dispatch(fetchStats());
      
      // Wait a moment to ensure state is updated before processing queue
      setTimeout(() => {
        dispatch(processPendingQueue());
      }, 1000);
      
      return result;
    } catch (error: any) {
      console.error('Error in addWorkoutSessionToPendingQueue:', error);
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
      } catch (error) {
        console.error('Error reading pending queue from AsyncStorage:', error);
        // Fall back to Redux state
        pendingWorkouts = state.workoutPrograms.pendingSync.workoutHistory;
      }
      
      // Check if we have pending favorite changes
      const hasPendingFavoriteChanges = state.workoutPrograms.hasPendingFavoriteChanges;
      
      // If nothing to process, return early
      if (pendingWorkouts.length === 0 && !hasPendingFavoriteChanges) {
        return { processed: 0 };
      }
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      if (!isConnected) {
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
      
      // Process pending favorite changes if needed
      let favoritesProcessed = false;
      if (hasPendingFavoriteChanges) {
        if (DEBUG_FAVORITES) console.log('[FAVORITES] Processing pending favorite changes');
        
        try {
          // Get local favorites from AsyncStorage
          const favoriteWorkoutsJson = await AsyncStorage.getItem(FAVORITE_WORKOUTS_KEY);
          const localFavoriteIds: string[] = favoriteWorkoutsJson 
            ? JSON.parse(favoriteWorkoutsJson) 
            : [];
          
          if (DEBUG_FAVORITES) console.log(`[FAVORITES] Found ${localFavoriteIds.length} local favorites`);
          
          // Fetch current server favorites
          const serverFavoriteIds = await fetchUserFavorites();
          if (DEBUG_FAVORITES) console.log(`[FAVORITES] Found ${serverFavoriteIds.length} server favorites`);
          
          // Find favorites to add (in local but not in server)
          const favoritesToAdd = localFavoriteIds.filter(id => !serverFavoriteIds.includes(id));
          
          // Find favorites to remove (in server but not in local)
          const favoritesToRemove = serverFavoriteIds.filter(id => !localFavoriteIds.includes(id));
          
          if (DEBUG_FAVORITES) console.log(`[FAVORITES] Found ${favoritesToAdd.length} favorites to add and ${favoritesToRemove.length} to remove`);
          
          // Process additions
          for (const workoutId of favoritesToAdd) {
            await addFavoriteWorkout(workoutId);
          }
          
          // Process removals
          for (const workoutId of favoritesToRemove) {
            await removeFavoriteWorkout(workoutId);
          }
          
          // Reset the pending changes flag
          dispatch(setPendingFavoriteChanges(false));
          favoritesProcessed = true;
          
          if (DEBUG_FAVORITES) console.log('[FAVORITES] Favorite changes processed successfully');
        } catch (error) {
          if (DEBUG_FAVORITES) console.error('[FAVORITES] Error processing favorite changes:', error);
          // Continue with workout history sync even if favorite sync fails
        }
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
              const { data: userSettings, error: settingsError } = await supabase
                .from('user_settings')
                .select('weight')
                .eq('id', userId)
                .single();
                
              if (userSettings?.weight) {
                userWeight = userSettings.weight;
              } else {
                console.log('No weight found in user settings');
              }
            } catch (error) {
              console.error('Error fetching user weight:', error);
            }
          }
          
          // Prepare workout data for Supabase
          const workoutData = {
            id: workout.id,
            user_id: userId,
            workout_id: workout.workoutId,
            date: workout.date,
            start_time: workout.startTime,
            end_time: workout.endTime,
            duration: workout.duration,
            completed: workout.completed,
            distance: workout.distance,
            calories_burned: workout.caloriesBurned,
            user_weight: userWeight,
            pauses: workout.pauses,
            pace_settings: workout.paceSettings
          };
          
          // Insert workout to Supabase          
          const { data, error } = await supabase
            .from('workout_history')
            .upsert(workoutData)
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
      
      if (DEBUG_SYNC) console.log(`[SYNC] Processed ${successCount} out of ${pendingWorkouts.length} workouts successfully, ${failureCount} failures`);
      
      // Update user's last_active timestamp
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', userId);
          
        if (updateError && DEBUG_SYNC) {
          console.error('[SYNC] Error updating last_active timestamp:', updateError);
        }
      } catch (error) {
        if (DEBUG_SYNC) console.error('[SYNC] Error updating last_active timestamp:', error);
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
        
        // Update the Redux state to clear the successfully synced workouts
        dispatch({
          type: 'workoutPrograms/updatePendingQueue',
          payload: {
            workoutHistory: remainingWorkouts
          }
        });
        
        // Refresh workout history and stats
        await dispatch(fetchWorkoutHistory({ forceRefresh: true })).unwrap();
        
        try {
          await dispatch(fetchStats()).unwrap();
        } catch (error) {
          console.error('[SYNC] Error refreshing stats after sync:', error);
        }
      }
      
      if (DEBUG_SYNC) console.log('[SYNC] Queue processing complete');
      return { 
        processed: successCount,
        total: pendingWorkouts.length,
        failed: failureCount,
        favoritesProcessed
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
  async (_, { dispatch, getState }) => {
    try {
      // Load pending queue from AsyncStorage
      const pendingQueueJson = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const pendingQueue = pendingQueueJson ? JSON.parse(pendingQueueJson) : { workoutHistory: [], favoriteWorkouts: [] };
      
      // Check if we have pending favorite changes
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const hasPendingFavoriteChanges = state.workoutPrograms.hasPendingFavoriteChanges;
      
      if (pendingQueue.workoutHistory.length > 0 || hasPendingFavoriteChanges) {
        // Try to process the queue after a short delay to ensure app is fully initialized
        setTimeout(() => {
          if (DEBUG_SYNC) console.log('[SYNC-INIT] Attempting to process pending queue after app initialization');
          if (hasPendingFavoriteChanges) {
            if (DEBUG_FAVORITES) console.log('[SYNC-INIT] Pending favorite changes detected, will attempt to sync');
          }
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
        console.error('[QUEUE] Error reading from AsyncStorage:', error);
        // Fall back to Redux state
        const state = getState() as { workoutPrograms: WorkoutProgramsState };
        pendingCount = state.workoutPrograms.pendingSync.workoutHistory.length;
      }
      
      // Check if we have pending favorite changes
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const hasPendingFavoriteChanges = state.workoutPrograms.hasPendingFavoriteChanges;
      
      if (pendingCount > 0 || hasPendingFavoriteChanges) {
        const result = await dispatch(processPendingQueue()).unwrap();
        return { 
          triggered: true, 
          pendingCount,
          hasPendingFavoriteChanges,
          result
        };
      } else {
        return { 
          triggered: false, 
          pendingCount: 0,
          hasPendingFavoriteChanges: false
        };
      }
    } catch (error) {
      console.error('[QUEUE] Error checking pending queue:', error);
      return { triggered: false, error: true };
    }
  }
);

// Helper function to simulate offline mode for testing
const simulateOfflineMode = createAsyncThunk(
  'workoutPrograms/simulateOfflineMode',
  async (shouldBeOffline: boolean, { dispatch }) => {
    if (DEBUG_SYNC) console.log(`[DEBUG] Simulating ${shouldBeOffline ? 'offline' : 'online'} mode for testing`);
    
    // Store the offline simulation flag in AsyncStorage for persistence
    await AsyncStorage.setItem('DEBUG_FORCE_OFFLINE', JSON.stringify(shouldBeOffline));
    
    // Refresh stats to test offline behavior
    await dispatch(fetchStats());
    
    return { offlineSimulated: shouldBeOffline };
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
    setPendingFavoriteChanges: (state, action: PayloadAction<boolean>) => {
      state.hasPendingFavoriteChanges = action.payload;
    },
    updatePendingQueue: (state, action: PayloadAction<{ workoutHistory: WorkoutSession[] }>) => {
      state.pendingSync.workoutHistory = action.payload.workoutHistory;
    }
  },

  extraReducers: (builder) => {
    // Handle fetchWorkoutPrograms
    builder.addCase(fetchWorkoutPrograms.pending, (state) => {
      if (DEBUG_REDUX) console.log('[REDUX] fetchWorkoutPrograms.pending - Setting isLoading to true');
      // Only set isLoading to true if we don't already have workout programs
      if (state.workoutPrograms.length === 0) {
        state.isLoading = true;
      } else {
        if (DEBUG_REDUX) console.log('[REDUX] fetchWorkoutPrograms.pending - Already have data, not setting loading state');
      }
      state.error = null;
    });
    builder.addCase(fetchWorkoutPrograms.fulfilled, (state, action) => {
      // Safe logging that handles both array and object return types
      if (action.payload && Array.isArray(action.payload)) {
        if (DEBUG_REDUX) console.log(`[REDUX] fetchWorkoutPrograms.fulfilled - Received ${action.payload.length} workouts`);
      } else if (action.payload && 'workouts' in action.payload) {
        if (DEBUG_REDUX) console.log(`[REDUX] fetchWorkoutPrograms.fulfilled - Received ${action.payload.workouts.length} workouts`);
      }
      
      state.isLoading = false;
      
      // Handle both array and object return types
      if (action.payload && Array.isArray(action.payload)) {
        state.workoutPrograms = action.payload;
      } else if (action.payload && 'workouts' in action.payload) {
        state.workoutPrograms = action.payload.workouts;
        state.favoriteWorkouts = action.payload.favoriteIds;
      }
    });
    builder.addCase(fetchWorkoutPrograms.rejected, (state, action) => {
      if (DEBUG_REDUX) console.log(`[REDUX] fetchWorkoutPrograms.rejected - Error: ${action.payload}`);
      state.error = action.payload as string;
      state.isLoading = false;
      if (DEBUG_REDUX) console.log('[REDUX] fetchWorkoutPrograms.rejected - Set isLoading to false');
    });
    
    // Handle fetchWorkoutHistory
    builder.addCase(fetchWorkoutHistory.pending, (state) => {
      if (DEBUG_REDUX) console.log('[REDUX] fetchWorkoutHistory.pending');
      state.error = null;
      // Don't set isLoading to true here to avoid blocking UI
    });
    builder.addCase(fetchWorkoutHistory.fulfilled, (state, action) => {
      if (action.payload && Array.isArray(action.payload)) {
        if (DEBUG_REDUX) console.log(`[REDUX] fetchWorkoutHistory.fulfilled - Received ${action.payload.length} history items`);
      } else {
        if (DEBUG_REDUX) console.log(`[REDUX] fetchWorkoutHistory.fulfilled - Received ${action.payload.sessions.length} history items`);
      }
      
      // Handle both array and object with sessions property
      const sessions = action.payload && Array.isArray(action.payload) 
        ? action.payload 
        : action.payload.sessions || [];
      
      state.workoutHistory = sessions;
      // Don't modify isLoading here
    });
    builder.addCase(fetchWorkoutHistory.rejected, (state, action) => {
      if (DEBUG_REDUX) console.log(`[REDUX] fetchWorkoutHistory.rejected - Error: ${action.payload}`);
      state.error = action.payload as string;
      // Don't modify isLoading here
    });
    
    // Handle fetchStats
    builder.addCase(fetchStats.pending, (state) => {
      if (DEBUG_REDUX) console.log('[REDUX] fetchStats.pending');
      state.error = null;
      // Don't set isLoading to true here to avoid blocking UI
    });
    builder.addCase(fetchStats.fulfilled, (state, action) => {
      if (DEBUG_STATS) console.log('[STATS DEBUG] Stats before update:', {
        totalWorkouts: state.stats?.stats?.totalWorkouts || 0,
        totalDistance: state.stats?.stats?.totalDistance || 0,
        totalDuration: state.stats?.stats?.totalDuration || 0,
        totalCaloriesBurned: state.stats?.stats?.totalCaloriesBurned || 0
      });
      
      if (DEBUG_STATS) console.log('[STATS DEBUG] New stats from action:', {
        totalWorkouts: action.payload?.stats?.totalWorkouts || 0,
        totalDistance: action.payload?.stats?.totalDistance || 0,
        totalDuration: action.payload?.stats?.totalDuration || 0,
        totalCaloriesBurned: action.payload?.stats?.totalCaloriesBurned || 0,
        source: action.payload?.source,
        pendingWorkoutsIncluded: action.payload?.pendingWorkoutsIncluded
      });
      
      state.stats = action.payload;
      
      if (DEBUG_STATS) console.log('[STATS DEBUG] Stats after update in Redux store:', {
        totalWorkouts: state.stats?.stats?.totalWorkouts || 0,
        totalDistance: state.stats?.stats?.totalDistance || 0,
        totalDuration: state.stats?.stats?.totalDuration || 0,
        totalCaloriesBurned: state.stats?.stats?.totalCaloriesBurned || 0
      });
      // Don't modify isLoading here
    });
    builder.addCase(fetchStats.rejected, (state, action) => {
      if (DEBUG_REDUX) console.log(`[REDUX] fetchStats.rejected - Error: ${action.payload}`);
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
      if (DEBUG_REDUX) console.log('[REDUX] addWorkoutSessionToPendingQueue.pending - Adding workout to queue');
    });
    builder.addCase(addWorkoutSessionToPendingQueue.fulfilled, (state, action) => {
      if (DEBUG_REDUX) console.log('[REDUX] addWorkoutSessionToPendingQueue.fulfilled - Adding workout to history and pending queue');
      
      // Add to workout history
      state.workoutHistory = [action.payload.session, ...state.workoutHistory];
      
      // Add to pending queue
      state.pendingSync.workoutHistory = [...state.pendingSync.workoutHistory, action.payload.session];
      
      // Update workout programs with lastUsed date
      state.workoutPrograms = action.payload.updatedPrograms;
      
      if (DEBUG_REDUX) console.log('[REDUX] Updated state:', {
        workoutHistorySize: state.workoutHistory.length,
        pendingQueueSize: state.pendingSync.workoutHistory.length,
        lastAddedWorkout: {
          id: action.payload.session.id,
          workoutId: action.payload.session.workoutId,
          date: action.payload.session.date,
          duration: action.payload.session.duration,
          distance: action.payload.session.distance,
          caloriesBurned: action.payload.session.caloriesBurned
        }
      });
      
      if (DEBUG_REDUX) console.log('[REDUX] addWorkoutSessionToPendingQueue.fulfilled - Added workout to history and pending queue');
    });
    builder.addCase(addWorkoutSessionToPendingQueue.rejected, (state, action) => {
      if (DEBUG_REDUX) console.log('[REDUX] addWorkoutSessionToPendingQueue.rejected - Failed to add workout to queue');
      if (DEBUG_REDUX) console.log('[REDUX] Error:', action.error);
    });
    
    // Handle processPendingQueue
    builder.addCase(processPendingQueue.pending, (state) => {
      if (DEBUG_REDUX) console.log('[REDUX] processPendingQueue.pending - Setting isSyncing to true');
      state.isSyncing = true;
    });
    builder.addCase(processPendingQueue.fulfilled, (state, action) => {
      if (DEBUG_REDUX) console.log('[REDUX] processPendingQueue.fulfilled - Queue processed successfully, cleared pendingSync.workoutHistory');
      state.isSyncing = false;
      state.pendingSync.workoutHistory = [];
    });
    builder.addCase(processPendingQueue.rejected, (state, action) => {
      if (DEBUG_REDUX) console.log('[REDUX] processPendingQueue.rejected - Sync failed, preserving pending workouts');
      if (DEBUG_REDUX) console.log('[REDUX] Error reason:', action.payload);
      if (DEBUG_REDUX) console.log('[REDUX] Current pending queue size:', state.pendingSync.workoutHistory.length);
      
      // If we're offline, make sure to keep the workouts in the queue
      if (action.payload === 'No internet connection available to process pending queue') {
        if (DEBUG_REDUX) console.log('[REDUX] Offline mode detected in reducer, ensuring workouts remain in queue');
        // No need to modify state.pendingSync.workoutHistory as it should already contain the pending workouts
      }
    });
    
    // Handle initializePendingQueue
    builder.addCase(initializePendingQueue.fulfilled, (state, action) => {
      if (DEBUG_REDUX) console.log('[REDUX] initializePendingQueue.fulfilled - Updated pendingSync state');
      if (DEBUG_REDUX) console.log('[REDUX] Pending workouts count:', action.payload.workoutHistory?.length || 0);
      state.pendingSync = action.payload;
    });
  },
});

// Export actions and selectors
export const { toggleWorkoutFavorite, setPendingFavoriteChanges } = workoutProgramsSlice.actions;

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
  checkAndProcessPendingQueue,
  simulateOfflineMode
};