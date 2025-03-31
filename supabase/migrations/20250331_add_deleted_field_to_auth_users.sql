-- Add the deleted column to the auth.users table if it doesn't exist
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT NULL;
