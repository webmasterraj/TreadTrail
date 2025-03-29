// Import necessary libraries
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../../api/supabaseClient';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Import types
import { WorkoutProgram, WorkoutSession, Stats, WorkoutPause, CompletedSegment, PaceSettings } from '../../types';
import { calculateTotalDistance } from '../../utils/helpers';

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
    totalSegmentsCompleted: 0,
    totalDistance: 0,
    totalCaloriesBurned: 0,
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

// Define the state interface
interface WorkoutProgramsState {
  workoutPrograms: WorkoutProgram[];
  workoutHistory: WorkoutSession[];
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
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      let workoutPrograms: WorkoutProgram[] = [];
      let favoriteIds: string[] = [];
      
      // If online, fetch from Supabase
      if (isConnected) {
        // Fetch workout programs from Supabase
        const { data: supabaseWorkouts, error: workoutsError } = await supabase
          .from('workout_programs')
          .select('*')
          .eq('is_active', true);
        
        if (workoutsError) {
          console.error('Error fetching workouts from Supabase:', workoutsError);
        } else if (supabaseWorkouts && supabaseWorkouts.length > 0) {
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
              const formattedSegments = segments.map(segment => ({
                type: segment.type,
                duration: segment.duration,
                incline: segment.incline,
                audio: segment.audio_file_url ? { file: segment.audio_file_url } : undefined,
              }));
              
              return {
                id: workout.id,
                name: workout.name,
                description: workout.description,
                duration: workout.duration,
                category: workout.category,
                segments: formattedSegments,
                focus: workout.focus || 'endurance', // Default focus if not specified
                premium: workout.is_premium || false,
                intensity: workout.intensity || 1,
                favorite: false,
                lastUsed: null
              };
            })
          );
          
          workoutPrograms = workoutsWithSegments;
          
          // Fetch user's favorite workouts
          const { data: favorites, error: favoritesError } = await supabase
            .from('user_favorite_workouts')
            .select('workout_id')
            .eq('user_id', userId);
          
          if (favoritesError) {
            console.error('Error fetching favorites from Supabase:', favoritesError);
          } else if (favorites) {
            favoriteIds = favorites.map(fav => fav.workout_id);
          }
        }
      }
      
      // Apply favorite status to workout programs
      return workoutPrograms.map(workout => ({
        ...workout,
        favorite: favoriteIds.includes(workout.id)
      }));
    } catch (error) {
      console.error('Error in fetchWorkoutPrograms:', error);
      return rejectWithValue('Failed to fetch workout programs');
    }
  }
);

const fetchWorkoutHistory = createAsyncThunk(
  'workoutPrograms/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      // First try to get from Supabase if online
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      if (isConnected) {
        // Check if user is authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        
        if (userId) {
          // Fetch from Supabase
          const { data: historyData, error } = await supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Error fetching history from Supabase:', error);
          } else if (historyData && historyData.length > 0) {
            // Transform the data to match our app's structure
            const transformedHistory: WorkoutSession[] = historyData.map((session: any) => ({
              id: session.id,
              workoutId: session.workout_id,
              workoutName: session.workout_name,
              date: session.created_at,
              duration: session.duration,
              distance: session.distance,
              calories: session.calories,
              avgPace: session.avg_pace,
              weight: session.user_weight,
              notes: session.notes,
              startTime: session.start_time || session.created_at,
              endTime: session.end_time || new Date(new Date(session.created_at).getTime() + session.duration * 1000).toISOString(),
              completed: true,
              pauses: session.pauses || [],
              segments: session.segments || [],
              paceSettings: session.pace_settings || null,
            }));
            
            // Save to AsyncStorage for offline use
            await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(transformedHistory));
            
            return transformedHistory;
          }
        }
      }
      
      // Fallback to local storage if offline or Supabase fetch failed
      const historyJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      
      if (historyJson) {
        return JSON.parse(historyJson);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching workout history:', error);
      return rejectWithValue('Failed to fetch workout history');
    }
  }
);

const fetchStats = createAsyncThunk(
  'workoutPrograms/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Load stats from storage
      const storedStats = await AsyncStorage.getItem(STATS_KEY);
      
      let stats: Stats;
      if (storedStats) {
        // Use stored stats if available
        stats = JSON.parse(storedStats);
      } else {
        // Use initial stats if none stored
        stats = INITIAL_STATS;
      }
      
      // Get current state
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms } = state.workoutPrograms;
      
      // Recalculate stats based on current workout history
      const updatedStats = calculateStats(workoutHistory, workoutPrograms);
      
      // Save stats to AsyncStorage
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      
      return updatedStats;
    } catch (error) {
      return rejectWithValue('Failed to fetch stats');
    }
  }
);

const addWorkoutSession = createAsyncThunk(
  'workoutPrograms/addWorkoutSession',
  async (session: WorkoutSession, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms } = state.workoutPrograms;
      
      // Get user's pace settings to calculate distance
      const userSettings = await AsyncStorage.getItem('@treadtrail:user_settings');
      let paceSettings: PaceSettings | null = null;
      
      if (userSettings) {
        const settings = JSON.parse(userSettings);
        paceSettings = settings.paceSettings;
      }
      
      // Calculate distance if pace settings are available
      let sessionWithDistance = { ...session };
      if (paceSettings && session.segments) {
        const distance = calculateTotalDistance(session.segments, paceSettings);
        sessionWithDistance = {
          ...session,
          distance,
          paceSettings
        };
      }
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      // Get user session
      const { data: { session: userSession } } = await supabase.auth.getSession();
      const userId = userSession?.user?.id;
      
      // If online and authenticated, save to Supabase
      if (isConnected && userId) {
        // Insert workout session to Supabase
        const { error: insertError } = await supabase
          .from('workout_history')
          .insert({
            id: sessionWithDistance.id,
            user_id: userId,
            workout_id: sessionWithDistance.workoutId,
            date: sessionWithDistance.date,
            start_time: sessionWithDistance.startTime,
            end_time: sessionWithDistance.endTime,
            duration: sessionWithDistance.duration,
            completed: sessionWithDistance.completed || true,
            distance: sessionWithDistance.distance,
            calories_burned: sessionWithDistance.caloriesBurned,
            user_weight: sessionWithDistance.weight,
            pauses: sessionWithDistance.pauses,
            pace_settings: sessionWithDistance.paceSettings,
          });
        
        if (insertError) {
          console.error('Error saving workout session to Supabase:', insertError);
          
          // Store in pending sync if there was an error
          const pendingSyncData = await AsyncStorage.getItem(PENDING_SYNC_KEY);
          const pendingSync = pendingSyncData ? JSON.parse(pendingSyncData) : { workoutHistory: [], favoriteWorkouts: [] };
          
          pendingSync.workoutHistory.push(sessionWithDistance);
          await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingSync));
        } else {
          // Update user stats in Supabase
          const { data: existingStats, error: statsError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is "row not found"
            console.error('Error fetching user stats:', statsError);
          }
          
          // Calculate updated stats
          const totalWorkouts = (existingStats?.total_workouts || 0) + 1;
          const totalDuration = (existingStats?.total_duration || 0) + (sessionWithDistance.duration || 0);
          const totalDistance = (existingStats?.total_distance || 0) + (sessionWithDistance.distance || 0);
          const totalCaloriesBurned = (existingStats?.total_calories_burned || 0) + (sessionWithDistance.caloriesBurned || 0);
          
          // Determine if this is the longest workout
          let longestWorkout = existingStats?.longest_workout || { duration: 0, date: '' };
          if (sessionWithDistance.duration && sessionWithDistance.duration > (longestWorkout.duration || 0)) {
            longestWorkout = {
              duration: sessionWithDistance.duration,
              date: sessionWithDistance.date || '',
            };
          }
          
          // Upsert user stats
          const { error: upsertError } = await supabase
            .from('user_stats')
            .upsert({
              id: userId,
              total_workouts: totalWorkouts,
              total_duration: totalDuration,
              total_distance: totalDistance,
              total_calories_burned: totalCaloriesBurned,
              last_workout_date: sessionWithDistance.date,
              longest_workout: longestWorkout,
              updated_at: new Date().toISOString(),
            });
          
          if (upsertError) {
            console.error('Error updating user stats:', upsertError);
          }
        }
      } else {
        // Offline or not authenticated, store in pending sync
        const pendingSyncData = await AsyncStorage.getItem(PENDING_SYNC_KEY);
        const pendingSync = pendingSyncData ? JSON.parse(pendingSyncData) : { workoutHistory: [], favoriteWorkouts: [] };
        
        pendingSync.workoutHistory.push(sessionWithDistance);
        await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingSync));
      }
      
      // Add session to local history
      const updatedHistory = [sessionWithDistance, ...workoutHistory];
      
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
      
      // Update local stats after adding a new workout session
      const updatedStats = calculateStats(updatedHistory, state.workoutPrograms.workoutPrograms);
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      
      return {
        session: sessionWithDistance,
        updatedPrograms,
      };
    } catch (error) {
      console.error('Error in addWorkoutSession:', error);
      return rejectWithValue('Failed to save workout session');
    }
  }
);

const updateStats = createAsyncThunk(
  'workoutPrograms/updateStats',
  async (newStats: Partial<Stats>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      const { workoutHistory, workoutPrograms, stats } = state.workoutPrograms;
      
      // Clone current stats
      const updatedStats: Stats = {
        ...state.workoutPrograms.stats,
        ...newStats,
        lastUpdated: new Date().toISOString(),
      };
      
      // Helper function to find workout by ID
      const getWorkoutById = (id: string): WorkoutProgram | undefined => {
        return workoutPrograms.find(workout => workout.id === id);
      };
      
      // Calculate new stats
      const calculatedStats = {
        totalWorkouts: workoutHistory.length,
        totalDuration: workoutHistory.reduce((sum, session) => sum + (session.duration || 0), 0),
        totalSegmentsCompleted: workoutHistory.reduce((sum, session) => {
          // Add safety check for sessions that might have undefined segments
          if (!session.segments) {
            return sum;
          }
          return sum + session.segments.filter(segment => segment && !segment.skipped).length;
        }, 0),
        totalDistance: 0,
        totalCaloriesBurned: 0,
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
        if (session.duration && session.duration > longestDuration) {
          longestDuration = session.duration;
          longestDate = session.date || '';
        }
        
        // Skip invalid sessions
        if (!session.workoutId) {
          return;
        }
        
        // Count by category and focus
        const workout = getWorkoutById(session.workoutId);
        if (workout) {
          // Make sure the values exist in our enum objects
          if (workout.category && calculatedStats.workoutsByCategory[workout.category] !== undefined) {
            calculatedStats.workoutsByCategory[workout.category]++;
          }
          
          if (workout.focus && calculatedStats.workoutsByFocus[workout.focus] !== undefined) {
            calculatedStats.workoutsByFocus[workout.focus]++;
          }
        }
      });
      
      calculatedStats.longestWorkout = {
        duration: longestDuration,
        date: longestDate,
      };
      
      // Calculate total distance across all workout sessions
      let totalDistance = 0;
      
      workoutHistory.forEach(session => {
        console.log('Processing session for distance:', session.id, 'Has distance:', !!session.distance);
        if (session.distance) {
          console.log('Adding pre-calculated distance:', session.distance);
          totalDistance += session.distance;
        }
        // If distance is not pre-calculated but we have segments and paceSettings, calculate it
        else if (session.segments && session.paceSettings) {
          console.log('Calculating distance from segments:', session.segments.length, 'segments');
          const sessionDistance = calculateTotalDistance(session.segments, session.paceSettings);
          console.log('Calculated session distance:', sessionDistance);
          totalDistance += sessionDistance;
        }
        
        // Add calories burned to total if available
        if (session.caloriesBurned) {
          calculatedStats.totalCaloriesBurned += session.caloriesBurned;
        }
      });
      
      calculatedStats.totalDistance = totalDistance;
      
      // Save updated stats
      updatedStats.stats = calculatedStats;
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      
      return updatedStats;
    } catch (error) {
      return rejectWithValue('Failed to update stats');
    }
  }
);

const initializeFavoriteWorkouts = createAsyncThunk(
  'workoutPrograms/initializeFavorites',
  async (_, { dispatch, getState }) => {
    try {
      const state = getState() as { workoutPrograms: WorkoutProgramsState };
      
      // Get all favorite workout IDs from current state
      const favoriteIds = state.workoutPrograms.workoutPrograms
        .filter(workout => Boolean(workout.favorite))
        .map(workout => workout.id);
      
      // Store them in AsyncStorage
      await AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(favoriteIds));
      console.log('[workoutProgramsSlice] Initialized favorite workouts:', favoriteIds);
      
      return favoriteIds;
    } catch (error) {
      return [];
    }
  }
);

const syncOfflineData = createAsyncThunk(
  'workoutPrograms/syncOfflineData',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      if (!isConnected) {
        return { synced: false, message: 'No internet connection available', lastSyncedAt: null };
      }
      
      // Get user session
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (!userId) {
        return { synced: false, message: 'User not authenticated', lastSyncedAt: null };
      }
      
      // Get pending sync data
      const pendingSyncData = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      
      if (!pendingSyncData) {
        return { synced: true, message: 'No data to sync', lastSyncedAt: new Date().toISOString() };
      }
      
      const pendingSync = JSON.parse(pendingSyncData) as {
        workoutHistory: WorkoutSession[],
        favoriteWorkouts: string[]
      };
      
      let syncResults = {
        workoutHistory: { success: 0, failed: 0 },
        favoriteWorkouts: { success: 0, failed: 0 }
      };
      
      // Sync workout history
      if (pendingSync.workoutHistory && pendingSync.workoutHistory.length > 0) {
        for (const session of pendingSync.workoutHistory) {
          const { error } = await supabase
            .from('workout_history')
            .insert({
              id: session.id,
              user_id: userId,
              workout_id: session.workoutId,
              date: session.date,
              start_time: session.startTime,
              end_time: session.endTime,
              duration: session.duration,
              completed: session.completed || true,
              distance: session.distance,
              calories_burned: session.caloriesBurned,
              user_weight: session.weight,
              pauses: session.pauses,
              pace_settings: session.paceSettings,
            });
          
          if (error) {
            console.error('Error syncing workout session:', error);
            syncResults.workoutHistory.failed++;
          } else {
            syncResults.workoutHistory.success++;
          }
        }
      }
      
      // Sync favorite workouts
      if (pendingSync.favoriteWorkouts && pendingSync.favoriteWorkouts.length > 0) {
        // First, delete all existing favorites
        const { error: deleteError } = await supabase
          .from('user_favorite_workouts')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          console.error('Error deleting existing favorites:', deleteError);
        }
        
        // Then insert all current favorites
        for (const workoutId of pendingSync.favoriteWorkouts) {
          const { error } = await supabase
            .from('user_favorite_workouts')
            .insert({
              user_id: userId,
              workout_id: workoutId,
              created_at: new Date().toISOString()
            });
          
          if (error) {
            console.error('Error syncing favorite workout:', error);
            syncResults.favoriteWorkouts.failed++;
          } else {
            syncResults.favoriteWorkouts.success++;
          }
        }
      }
      
      // Clear pending sync after successful sync
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({
        workoutHistory: [],
        favoriteWorkouts: []
      }));
      
      const lastSyncedAt = new Date().toISOString();
      
      return { 
        synced: true, 
        results: syncResults,
        lastSyncedAt 
      };
    } catch (error) {
      console.error('Error in syncOfflineData:', error);
      return rejectWithValue({ message: 'Failed to sync offline data', lastSyncedAt: null });
    }
  }
);

const fetchFavoriteWorkoutsFromSupabase = createAsyncThunk(
  'workoutPrograms/fetchFavoriteWorkoutsFromSupabase',
  async (_, { rejectWithValue }) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      if (!isConnected) {
        return { success: false, message: 'No internet connection available' };
      }
      
      // Get user session
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }
      
      // Fetch favorite workouts from Supabase
      const { data: favoriteWorkouts, error } = await supabase
        .from('user_favorite_workouts')
        .select('workout_id')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching favorite workouts:', error);
        return rejectWithValue('Failed to fetch favorite workouts');
      }
      
      // Extract workout IDs
      const favoriteWorkoutIds = favoriteWorkouts.map(fav => fav.workout_id);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(favoriteWorkoutIds));
      
      return { success: true, favoriteWorkoutIds };
    } catch (error) {
      console.error('Error in fetchFavoriteWorkoutsFromSupabase:', error);
      return rejectWithValue('Failed to fetch favorite workouts');
    }
  }
);

const checkAndSyncData = createAsyncThunk(
  'workoutPrograms/checkAndSyncData',
  async (_, { dispatch }) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      if (!isConnected) {
        return { synced: false, message: 'No internet connection available', lastSyncedAt: null };
      }
      
      // Check if user is authenticated
      const { data } = await supabase.auth.getSession();
      const isAuthenticated = !!data.session?.user?.id;
      
      if (!isAuthenticated) {
        return { synced: false, message: 'User not authenticated', lastSyncedAt: null };
      }
      
      // Check if there's pending data to sync
      const pendingSyncData = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const hasPendingData = pendingSyncData && JSON.parse(pendingSyncData).workoutHistory?.length > 0 || 
                             pendingSyncData && JSON.parse(pendingSyncData).favoriteWorkouts?.length > 0;
      
      if (hasPendingData) {
        // Sync offline data
        await dispatch(syncOfflineData());
      }
      
      // Fetch latest workout programs
      await dispatch(fetchWorkoutPrograms());
      
      // Fetch favorite workouts
      await dispatch(fetchFavoriteWorkoutsFromSupabase());
      
      // Fetch workout history
      await dispatch(fetchWorkoutHistory());
      
      const lastSyncedAt = new Date().toISOString();
      
      return { synced: true, message: 'Data synchronized successfully', lastSyncedAt };
    } catch (error) {
      console.error('Error in checkAndSyncData:', error);
      return { synced: false, message: 'Failed to sync data', lastSyncedAt: null };
    }
  }
);

const handleNetworkChange = createAsyncThunk(
  'workoutPrograms/handleNetworkChange',
  async (netInfo: NetInfoState, { dispatch, getState }) => {
    try {
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      if (isConnected) {
        // We're online, check if we need to sync data
        await dispatch(checkAndSyncData());
      }
      
      return { isConnected };
    } catch (error) {
      console.error('Error handling network change:', error);
      return { isConnected: false };
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
        AsyncStorage.setItem(FAVORITE_WORKOUTS_KEY, JSON.stringify(favoriteIds))
          .catch(err => console.error('AsyncStorage error:', err));
        
        // Add to pending sync for Supabase update when online
        AsyncStorage.getItem(PENDING_SYNC_KEY)
          .then(data => {
            const pendingSync = data ? JSON.parse(data) : { workoutHistory: [], favoriteWorkouts: [] };
            pendingSync.favoriteWorkouts = favoriteIds;
            return AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingSync));
          })
          .catch(err => console.error('AsyncStorage error:', err));
        
        // Try to update Supabase if possible (fire and forget)
        supabase.auth.getSession().then(({ data }) => {
          const userId = data.session?.user?.id;
          if (userId) {
            // Check network status
            NetInfo.fetch().then(netInfo => {
              const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
              
              if (isConnected) {
                if (newFavoriteStatus) {
                  // Add to favorites
                  supabase
                    .from('user_favorite_workouts')
                    .upsert({ 
                      user_id: userId, 
                      workout_id: id,
                      created_at: new Date().toISOString()
                    })
                    .then(({ error }) => {
                      if (error) console.error('Error adding favorite to Supabase:', error);
                    });
                } else {
                  // Remove from favorites
                  supabase
                    .from('user_favorite_workouts')
                    .delete()
                    .eq('user_id', userId)
                    .eq('workout_id', id)
                    .then(({ error }) => {
                      if (error) console.error('Error removing favorite from Supabase:', error);
                    });
                }
              }
            });
          }
        });
      }
    }
  },

  extraReducers: (builder) => {
    // Handle fetchWorkoutPrograms
    builder.addCase(fetchWorkoutPrograms.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkoutPrograms.fulfilled, (state, action) => {
      state.workoutPrograms = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchWorkoutPrograms.rejected, (state, action) => {
      state.error = action.payload as string;
      state.isLoading = false;
    });
    
    // Handle fetchWorkoutHistory
    builder.addCase(fetchWorkoutHistory.pending, (state) => {
      // Processing
    });
    builder.addCase(fetchWorkoutHistory.fulfilled, (state, action) => {
      state.workoutHistory = action.payload;
    });
    builder.addCase(fetchWorkoutHistory.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle fetchStats
    builder.addCase(fetchStats.pending, (state) => {
      // Processing
    });
    builder.addCase(fetchStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });
    builder.addCase(fetchStats.rejected, (state, action) => {
      // Handle error
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
    
    // Handle updateStats
    builder.addCase(updateStats.pending, (state) => {
      // Processing
    });
    builder.addCase(updateStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });
    builder.addCase(updateStats.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle initializeFavoriteWorkouts
    builder.addCase(initializeFavoriteWorkouts.pending, (state) => {
      // Processing
    });
    builder.addCase(initializeFavoriteWorkouts.fulfilled, (state, action) => {
      // No state update needed
    });
    builder.addCase(initializeFavoriteWorkouts.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle syncOfflineData
    builder.addCase(syncOfflineData.pending, (state) => {
      state.isSyncing = true;
    });
    builder.addCase(syncOfflineData.fulfilled, (state, action) => {
      state.isSyncing = false;
      state.lastSyncedAt = action.payload.lastSyncedAt;
    });
    builder.addCase(syncOfflineData.rejected, (state, action) => {
      state.isSyncing = false;
    });
    
    // Handle fetchFavoriteWorkoutsFromSupabase
    builder.addCase(fetchFavoriteWorkoutsFromSupabase.pending, (state) => {
      // Processing
    });
    builder.addCase(fetchFavoriteWorkoutsFromSupabase.fulfilled, (state, action) => {
      if (action.payload.success) {
        // Update favorite workouts
        const favoriteIds = action.payload.favoriteWorkoutIds || [];
        state.workoutPrograms = state.workoutPrograms.map(workout => ({
          ...workout,
          favorite: favoriteIds.includes(workout.id)
        }));
      }
    });
    builder.addCase(fetchFavoriteWorkoutsFromSupabase.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle checkAndSyncData
    builder.addCase(checkAndSyncData.pending, (state) => {
      // Processing
    });
    builder.addCase(checkAndSyncData.fulfilled, (state, action) => {
      state.lastSyncedAt = action.payload.lastSyncedAt;
    });
    builder.addCase(checkAndSyncData.rejected, (state, action) => {
      // Handle error
    });
    
    // Handle handleNetworkChange
    builder.addCase(handleNetworkChange.pending, (state) => {
      // Processing
    });
    builder.addCase(handleNetworkChange.fulfilled, (state, action) => {
      // No state update needed
    });
    builder.addCase(handleNetworkChange.rejected, (state, action) => {
      // Handle error
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

// Export reducer
export default workoutProgramsSlice.reducer;

// Export async thunks
export {
  fetchWorkoutPrograms,
  fetchWorkoutHistory,
  fetchStats,
  addWorkoutSession,
  updateStats,
  initializeFavoriteWorkouts,
  syncOfflineData,
  fetchFavoriteWorkoutsFromSupabase,
  checkAndSyncData,
  handleNetworkChange
};

// Helper selectors
export const selectWorkoutById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutPrograms.find(workout => workout.id === id);

export const selectSessionById = (id: string) => 
  (state: { workoutPrograms: WorkoutProgramsState }) => 
    state.workoutPrograms.workoutHistory.find(session => session.id === id);

function calculateStats(workoutHistory: WorkoutSession[], workoutPrograms: WorkoutProgram[]): Stats {
  const statsData = {
    totalWorkouts: workoutHistory.length,
    totalDuration: workoutHistory.reduce((sum, session) => sum + (session.duration || 0), 0),
    totalSegmentsCompleted: workoutHistory.reduce((sum, session) => {
      // Add safety check for sessions that might have undefined segments
      if (!session.segments) {
        return sum;
      }
      return sum + session.segments.filter(segment => segment && !segment.skipped).length;
    }, 0),
    totalDistance: 0,
    totalCaloriesBurned: 0,
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

  // Calculate total distance across all workout sessions
  let totalDistance = 0;

  workoutHistory.forEach(session => {
    if (session.duration && session.duration > longestDuration) {
      longestDuration = session.duration;
      longestDate = session.date || '';
    }

    // Skip invalid sessions
    if (!session.workoutId) {
      return;
    }

    // Count by category and focus
    const workout = workoutPrograms.find(workout => workout.id === session.workoutId);
    if (workout) {
      // Make sure the values exist in our enum objects
      if (workout.category && statsData.workoutsByCategory[workout.category] !== undefined) {
        statsData.workoutsByCategory[workout.category]++;
      }

      if (workout.focus && statsData.workoutsByFocus[workout.focus] !== undefined) {
        statsData.workoutsByFocus[workout.focus]++;
      }
    }

    console.log('Processing session for distance:', session.id, 'Has distance:', !!session.distance);
    if (session.distance) {
      console.log('Adding pre-calculated distance:', session.distance);
      totalDistance += session.distance;
    }
    // If distance is not pre-calculated but we have segments and paceSettings, calculate it
    else if (session.segments && session.paceSettings) {
      console.log('Calculating distance from segments:', session.segments.length, 'segments');
      const sessionDistance = calculateTotalDistance(session.segments, session.paceSettings);
      console.log('Calculated session distance:', sessionDistance);
      totalDistance += sessionDistance;
    }
    
    // Add calories burned to total if available
    if (session.caloriesBurned) {
      statsData.totalCaloriesBurned += session.caloriesBurned;
    }
  });

  statsData.longestWorkout = {
    duration: longestDuration,
    date: longestDate,
  };

  console.log('Final total distance:', totalDistance);
  statsData.totalDistance = totalDistance;

  // Create the full Stats object
  return {
    stats: statsData,
    lastUpdated: new Date().toISOString(),
    achievements: []
  };
}