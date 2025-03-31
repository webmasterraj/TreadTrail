-- Add workout_name column to workout_segments table
ALTER TABLE public.workout_segments 
ADD COLUMN workout_name TEXT;

-- Update existing records with workout names from workout_programs
UPDATE public.workout_segments
SET workout_name = wp.name
FROM public.workout_programs wp
WHERE workout_segments.workout_id = wp.id;
