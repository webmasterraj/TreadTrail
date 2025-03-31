-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  name TEXT,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policy for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own data" ON public.users
  FOR ALL USING (auth.uid() = id);

-- User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY REFERENCES public.users,
  weight NUMERIC,
  pace_settings JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policy for User Settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = id);

-- Workout Programs Table
CREATE TABLE IF NOT EXISTS public.workout_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policy for Workout Programs
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view workouts" ON public.workout_programs
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert workouts" ON public.workout_programs
  FOR INSERT WITH CHECK (true);

-- Workout Segments Table
CREATE TABLE IF NOT EXISTS public.workout_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  incline NUMERIC,
  audio_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workout_id, sequence_number)
);

-- RLS Policy for Workout Segments
ALTER TABLE public.workout_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view segments" ON public.workout_segments
  FOR SELECT USING (true);

-- User Favorite Workouts Table
CREATE TABLE IF NOT EXISTS public.user_favorite_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, workout_id)
);

-- RLS Policy for User Favorite Workouts
ALTER TABLE public.user_favorite_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only manage their own favorites" ON public.user_favorite_workouts
  FOR ALL USING (auth.uid() = user_id);

-- Workout History Table
CREATE TABLE IF NOT EXISTS public.workout_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workout_programs(id),
  date DATE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  completed BOOLEAN,
  distance NUMERIC,
  calories_burned NUMERIC,
  user_weight NUMERIC,
  pauses JSONB,
  pace_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policy for Workout History
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view and insert their own workout history" ON public.workout_history
  FOR ALL USING (auth.uid() = user_id);

-- Premium Subscriptions Table
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  receipt_data TEXT,
  is_active BOOLEAN DEFAULT true,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policy for Premium Subscriptions
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own subscriptions" ON public.premium_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Create storage bucket for workout audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('workout_audio', 'Workout Audio Files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for workout audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'workout_audio');

-- Allow only authenticated users to upload
CREATE POLICY "Authenticated users can upload workout audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'workout_audio' AND auth.role() = 'authenticated'
  );
