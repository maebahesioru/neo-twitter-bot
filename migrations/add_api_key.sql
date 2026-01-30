-- Migration to add api_key column to scheduled_tweets table
-- Run this in Supabase SQL Editor

-- Add api_key column if it doesn't exist
ALTER TABLE scheduled_tweets ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Create index on api_key for filtering by user
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_api_key ON scheduled_tweets(api_key);

-- Drop and recreate policies
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Allow all operations on scheduled_tweets" ON scheduled_tweets;
  DROP POLICY IF EXISTS "Allow read operations" ON scheduled_tweets;

  -- Create policy to allow all operations with API key
  CREATE POLICY "Allow all operations with API key" ON scheduled_tweets
    FOR ALL
    USING (api_key IS NOT NULL)
    WITH CHECK (api_key IS NOT NULL);

  -- Create policy to allow read operations for all (for development)
  CREATE POLICY "Allow read operations" ON scheduled_tweets
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN others THEN
    -- If policy already exists, continue
    NULL;
END $$;
