-- Migration: Create trigger for automatically creating user records
-- Date: 2025-03-31

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table with default values from schema
  INSERT INTO public.users (
    id, 
    email, 
    name,
    is_premium,
    premium_expires_at,
    created_at,
    last_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    DEFAULT, -- is_premium default (false)
    DEFAULT, -- premium_expires_at default (null)
    DEFAULT, -- created_at default (now())
    DEFAULT  -- last_active default (now())
  );
  
  -- Also create initial user settings record with defaults
  INSERT INTO public.user_settings (
    id, 
    weight, 
    pace_settings, 
    preferences,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    NULL,    -- weight starts as null
    jsonb_build_object(
      'recovery', jsonb_build_object('speed', 3.0, 'incline', 1.0),
      'base', jsonb_build_object('speed', 5.0, 'incline', 1.0),
      'run', jsonb_build_object('speed', 7.0, 'incline', 1.0),
      'sprint', jsonb_build_object('speed', 9.0, 'incline', 1.0)
    ),    -- default pace_settings
    jsonb_build_object(
      'units', 'metric',
      'darkMode', true,
      'enableAudioCues', true
    ),    -- default preferences
    DEFAULT, -- created_at default (now())
    DEFAULT  -- updated_at default (now())
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call this function after a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment explaining the trigger
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Automatically creates records in public.users and public.user_settings when a new user signs up';
