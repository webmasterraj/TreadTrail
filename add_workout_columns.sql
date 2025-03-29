-- Add is_premium and intensity columns to workout_programs table
ALTER TABLE public.workout_programs 
ADD COLUMN is_premium BOOLEAN DEFAULT false,
ADD COLUMN intensity INTEGER;

-- Update existing records with premium and intensity values
UPDATE public.workout_programs
SET is_premium = false, intensity = 1
WHERE intensity IS NULL;
