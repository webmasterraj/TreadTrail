// Types for TreadTrail app

// Pace settings
export type PaceType = 'recovery' | 'base' | 'run' | 'sprint';

export interface PaceSetting {
  speed: number;  // Speed in mph or kph based on user preference
  incline: number; // Incline in percentage
}

export interface PaceSettings {
  recovery: PaceSetting;
  base: PaceSetting;
  run: PaceSetting;
  sprint: PaceSetting;
}

// User preferences
export interface UserPreferences {
  units: 'imperial' | 'metric';
  darkMode: boolean;
  enableAudioCues: boolean; // Whether to play audio cues during workouts
}

// User profile
export interface UserProfile {
  name: string;
  dateCreated: string; // ISO date string
  lastActive: string; // ISO date string
}

// User settings
export interface UserSettings {
  profile: UserProfile;
  paceSettings: PaceSettings;
  preferences: UserPreferences;
}

// Workout types
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'easy \ud83d\udc23' | 'trad hiit \ud83c\udfc3\ud83c\udffc' | 'hills \u26f0';
export type WorkoutFocus = 'endurance' | 'hiit' | 'fat_burn';

// Workout segment
export interface WorkoutSegment {
  type: PaceType;
  duration: number; // In seconds
  incline: number; // Percentage incline
  audio?: {
    file: string;     // Path to the audio file
    duration: number; // Duration of the voiceover audio in seconds
  };
}

// Workout program
export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  duration: number; // Total duration in seconds
  difficulty: DifficultyLevel;
  focus: WorkoutFocus;
  favorite: boolean;
  lastUsed: string | null; // ISO date when last used, null if never used
  segments: WorkoutSegment[];
}

// Completed segment
export interface CompletedSegment {
  type: PaceType;
  duration: number; // Actual duration (may differ from plan)
  plannedDuration: number; // Original planned duration
  skipped: boolean; // Whether segment was skipped
}

// Workout pause
export interface WorkoutPause {
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  duration: number; // Pause duration in seconds
}

// Workout session
export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string; // ISO date string
  startTime: string; // ISO datetime when started
  endTime: string; // ISO datetime when ended
  duration: number; // Actual duration in seconds
  completed: boolean;
  pauses: WorkoutPause[];
  segments: CompletedSegment[];
}

// Workout stats
export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number; // In seconds
  totalSegmentsCompleted: number;
  workoutsByDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  workoutsByFocus: {
    endurance: number;
    hiit: number;
    fat_burn: number;
  };
  lastWorkoutDate: string | null; // ISO date string
  longestWorkout: {
    duration: number; // In seconds
    date: string; // ISO date string
  };
}

// Achievement progress
export interface AchievementProgress {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  completed: boolean;
  dateCompleted: string | null; // ISO date string
}

// Stats
export interface Stats {
  lastUpdated: string; // ISO date string
  stats: WorkoutStats;
  achievements: AchievementProgress[];
}

// Authentication types
export type AuthMethod = 'email' | 'apple' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  authMethod: AuthMethod;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Navigation types
export type RootStackParamList = {
  Landing: undefined;
  Welcome: { name: string };
  EditPace: undefined;
  WorkoutLibrary: undefined;
  WorkoutDetails: { workoutId: string };
  WorkoutInProgress: { workoutId: string };
  WorkoutComplete: { sessionId: string };
  Profile: undefined;
  Settings: undefined;
};