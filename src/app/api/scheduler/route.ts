import { NextRequest, NextResponse } from 'next/server';
import { isPast, isBefore, addMinutes } from 'date-fns';

const SCHEDULED_TWEETS_FILE = 'scheduled-tweets.json';

interface ScheduledTweet {
  id: string;
  text: string;
  media: Array<{
    file: string;
    type: 'image' | 'video' | 'gif';
  }>;
  scheduledTime: string;
  isRetweet: boolean;
  retweetId: string;
  quoteTweetId: string;
  status: 'pending' | 'posted' | 'failed';
}

function getScheduledTweets(): ScheduledTweet[] {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), SCHEDULED_TWEETS_FILE);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading scheduled tweets:', error);
  }
  return [];
}

function saveScheduledTweets(tweets: ScheduledTweet[]) {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), SCHEDULED_TWEETS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(tweets, null, 2));
  } catch (error) {
    console.error('Error saving scheduled tweets:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const scheduledTweets = getScheduledTweets();
    const now = new Date();
    let postedCount = 0;

    for (const tweet of scheduledTweets) {
      if (tweet.status === 'pending') {
        const scheduledDate = new Date(tweet.scheduledTime);
        
        if (isPast(scheduledDate) || isBefore(scheduledDate, addMinutes(now, 1))) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/post-tweet`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ tweetId: tweet.id }),
            });

            if (response.ok) {
              postedCount++;
            }
          } catch (error) {
            console.error(`Error posting tweet ${tweet.id}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${postedCount}件のツイートを投稿しました`
    });
  } catch (error) {
    console.error('Error in scheduler:', error);
    return NextResponse.json(
      { error: 'スケジューラーの実行に失敗しました' },
      { status: 500 }
    );
  }
}
