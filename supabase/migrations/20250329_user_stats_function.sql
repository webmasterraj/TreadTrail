-- Create or replace the calculate_user_stats function
CREATE OR REPLACE FUNCTION calculate_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats_data JSONB;
  longest_duration INTEGER := 0;
  longest_date TEXT := '';
BEGIN
  WITH workout_stats AS (
    SELECT
      COUNT(*) AS total_workouts,
      SUM(duration) AS total_duration,
      SUM(distance) AS total_distance,
      SUM(calories_burned) AS total_calories_burned,
      MAX(date) AS last_workout_date
    FROM
      workout_history
    WHERE
      user_id = p_user_id
  ),
  longest_workout AS (
    SELECT 
      duration, 
      date::text
    FROM 
      workout_history
    WHERE 
      user_id = p_user_id
      AND duration IS NOT NULL
    ORDER BY 
      duration DESC
    LIMIT 1
  )
  SELECT
    jsonb_build_object(
      'totalWorkouts', COALESCE((SELECT total_workouts FROM workout_stats), 0),
      'totalDuration', COALESCE((SELECT total_duration FROM workout_stats), 0),
      'totalDistance', COALESCE((SELECT total_distance FROM workout_stats), 0),
      'totalCaloriesBurned', COALESCE((SELECT total_calories_burned FROM workout_stats), 0),
      'lastWorkoutDate', (SELECT last_workout_date FROM workout_stats),
      'longestWorkout', COALESCE(
        (SELECT jsonb_build_object(
          'duration', duration, 
          'date', date
        ) FROM longest_workout),
        jsonb_build_object('duration', 0, 'date', '')
      )
    ) INTO stats_data;
    
  RETURN stats_data;
END;
$$ LANGUAGE plpgsql;
