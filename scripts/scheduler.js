const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yrsstrjvnhtkgdtgjlyh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_G0TuV7hWxXGzLFE5aQct1w_lwpEH0_q';
const supabase = createClient(supabaseUrl, supabaseKey);

const SCHEDULED_TWEETS_TABLE = 'scheduled_tweets';

async function postTweet(tweetId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ tweetId });
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL(baseUrl);
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || 'XOvMtaVBEfWKNLgYRJhZpsxPmTjUCwir';
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/post-tweet',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-api-key': apiKey
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      console.log('Response status:', res.statusCode);
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Response data:', data);
        try {
          const response = JSON.parse(data);
          if (!response.success) {
            reject(new Error(response.error || 'Unknown error'));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

function getJSTString() {
  const now = new Date();
  const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');
  const hours = String(jstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(jstDate.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function runScheduler() {
  const jstNow = getJSTString();
  console.log('Running scheduler at JST:', jstNow);
  
  try {
    // Debug: Show all pending tweets
    const { data: allPending, error: pendingError } = await supabase
      .from(SCHEDULED_TWEETS_TABLE)
      .select('*')
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('Error fetching pending tweets:', pendingError);
    } else {
      console.log('All pending tweets:', allPending);
    }
    
    const { data: tweets, error } = await supabase
      .from(SCHEDULED_TWEETS_TABLE)
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', jstNow);

    if (error) {
      console.error('Error fetching tweets:', error);
      return;
    }

    console.log('Tweets to post:', tweets);

    if (!tweets || tweets.length === 0) {
      console.log('No tweets to post');
      return;
    }

    let postedCount = 0;

    for (const tweet of tweets) {
      console.log(`Posting tweet ${tweet.id}...`);
      
      try {
        await postTweet(tweet.id);
        console.log(`Successfully posted tweet ${tweet.id}`);
        postedCount++;
      } catch (error) {
        console.error(`Error posting tweet ${tweet.id}:`, error);
      }
    }

    if (postedCount > 0) {
      console.log(`Posted ${postedCount} tweet(s)`);
    }
  } catch (error) {
    console.error('Error in scheduler:', error);
  }
}

async function forcePostTweet(tweetId) {
  console.log(`Force posting tweet ${tweetId}...`);
  try {
    await postTweet(tweetId);
    console.log(`Successfully posted tweet ${tweetId}`);
  } catch (error) {
    console.error(`Error posting tweet ${tweetId}:`, error);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 0 && args[0] === '--force' && args[1]) {
    forcePostTweet(args[1]);
  } else {
    runScheduler();
  }
}

module.exports = { runScheduler, forcePostTweet };
