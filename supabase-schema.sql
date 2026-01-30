-- Create scheduled_tweets table
CREATE TABLE IF NOT EXISTS scheduled_tweets (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  media JSONB DEFAULT '[]'::jsonb,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  tweet_type TEXT NOT NULL CHECK (tweet_type IN ('tweet', 'quote', 'retweet', 'reply')),
  retweet_id TEXT DEFAULT '',
  quote_tweet_id TEXT DEFAULT '',
  reply_tweet_id TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  api_key TEXT DEFAULT NULL
);

-- Create index on scheduled_time for faster queries
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_scheduled_time ON scheduled_tweets(scheduled_time);

-- Create index on status for filtering pending tweets
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_status ON scheduled_tweets(status);

-- Create index on api_key for filtering by user
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_api_key ON scheduled_tweets(api_key);

-- Enable Row Level Security
ALTER TABLE scheduled_tweets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on scheduled_tweets" ON scheduled_tweets;

-- Create policy to allow all operations with API key
CREATE POLICY "Allow all operations with API key" ON scheduled_tweets
  FOR ALL
  USING (api_key IS NOT NULL)
  WITH CHECK (api_key IS NOT NULL);

-- Create policy to allow read operations for all (for development)
-- In production, remove this or restrict it
CREATE POLICY "Allow read operations" ON scheduled_tweets
  FOR SELECT
  USING (true);
