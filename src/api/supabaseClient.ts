import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// IMPORTANT: Replace these placeholder values with your actual Supabase credentials
// These will be used if environment variables are not available (e.g., in preview builds)
const FALLBACK_SUPABASE_URL = "https://jaijjtmhatbkrnqdtrla.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaWpqdG1oYXRia3JucWR0cmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMzUwNDgsImV4cCI6MjA1ODcxMTA0OH0.Id1R3HTdsDi0XuN2befUOavxvU5h8EYd_nBAMaiTGvQ";

// Log Supabase configuration for debugging
console.log('[SUPABASE] Initializing with URL:', SUPABASE_URL ? 'URL exists' : 'Using fallback URL');
console.log('[SUPABASE] Anon key status:', SUPABASE_ANON_KEY ? 'Key exists' : 'Using fallback key');

// Create a custom storage implementation using AsyncStorage
const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

// Initialize the Supabase client with fallback values if environment variables are not available
const supabase = createClient(SUPABASE_URL || FALLBACK_SUPABASE_URL, SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Test Supabase connection
const testConnection = async () => {
  try {
    console.log('[SUPABASE] Testing connection...');
    const { data, error } = await supabase.from('workout_history').select('count').limit(1);
    
    if (error) {
      console.error('[SUPABASE] Connection test failed:', error);
    } else {
      console.log('[SUPABASE] Connection successful, response:', data);
    }
    
    // Check auth status
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('[SUPABASE] Auth session error:', authError);
    } else {
      console.log('[SUPABASE] Auth session:', authData.session ? 'Active' : 'None');
    }
  } catch (e) {
    console.error('[SUPABASE] Connection test exception:', e);
  }
};

// Run test on import
testConnection();

export default supabase;
