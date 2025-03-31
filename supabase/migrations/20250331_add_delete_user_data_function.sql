-- Function to delete all user data
CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS void AS $$
DECLARE
  is_same_user BOOLEAN;
BEGIN
  -- Security check: Ensure the user can only delete their own data
  -- auth.uid() returns the ID of the currently authenticated user
  SELECT auth.uid() = user_id INTO is_same_user;
  IF NOT is_same_user THEN
    RAISE EXCEPTION 'You can only delete your own account data';
  END IF;

  -- Delete user workout history
  DELETE FROM workout_history WHERE user_id = $1;
  
  -- Delete user settings
  DELETE FROM user_settings WHERE user_id = $1;
  
  -- Delete user profile
  DELETE FROM profiles WHERE id = $1;

  -- Delete favorites
  DELETE FROM user_favorite_workouts WHERE user_id = $1;
  
  -- Add any other tables that contain user data
  -- DELETE FROM other_table WHERE user_id = $1;
  
  -- Mark the user as deleted and update last_active timestamp
  UPDATE auth.users 
  SET deleted = TRUE,
      last_active = NOW()
  WHERE id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
