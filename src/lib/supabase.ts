import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ScheduledTweet {
  id: string;
  text: string;
  media: Array<{
    file: string;
    type: 'image' | 'video' | 'gif';
  }>;
  scheduled_time: string;
  tweet_type: 'tweet' | 'quote' | 'retweet' | 'reply';
  retweet_id: string;
  quote_tweet_id: string;
  reply_tweet_id: string;
  status: 'pending' | 'posted' | 'failed';
  created_at: string;
}

export const SCHEDULED_TWEETS_TABLE = 'scheduled_tweets';
