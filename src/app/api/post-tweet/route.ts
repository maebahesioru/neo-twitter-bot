import { NextRequest, NextResponse } from 'next/server';
import { twitterClient } from '@/lib/twitter-client';
import { supabase, SCHEDULED_TWEETS_TABLE } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/rate-limit';
import { withCors } from '@/lib/cors';

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tweetId } = body;

    const { data: tweet, error: fetchError } = await supabase
      .from(SCHEDULED_TWEETS_TABLE)
      .select('*')
      .eq('id', tweetId)
      .single();

    if (fetchError || !tweet) {
      return NextResponse.json(
        { error: 'ツイートが見つかりません' },
        { status: 404 }
      );
    }

    if (tweet.status === 'posted') {
      return NextResponse.json(
        { error: 'このツイートは既に投稿されています' },
        { status: 400 }
      );
    }

    switch (tweet.tweet_type) {
      case 'retweet':
        await twitterClient.retweet(tweet.retweet_id);
        break;
      case 'quote':
        const quoteMediaIds: string[] = [];
        for (const media of tweet.media) {
          const buffer = Buffer.from(media.file, 'base64');
          const mimeType = media.type === 'video' ? 'video/mp4' : 
                           media.type === 'gif' ? 'image/gif' : 'image/jpeg';
          const mediaId = await twitterClient.uploadMedia(buffer, mimeType);
          quoteMediaIds.push(mediaId);
        }
        await twitterClient.postTweet(tweet.text, quoteMediaIds, tweet.quote_tweet_id);
        break;
      case 'reply':
        const replyMediaIds: string[] = [];
        for (const media of tweet.media) {
          const buffer = Buffer.from(media.file, 'base64');
          const mimeType = media.type === 'video' ? 'video/mp4' : 
                           media.type === 'gif' ? 'image/gif' : 'image/jpeg';
          const mediaId = await twitterClient.uploadMedia(buffer, mimeType);
          replyMediaIds.push(mediaId);
        }
        await twitterClient.postTweet(tweet.text, replyMediaIds, undefined, tweet.reply_tweet_id);
        break;
      case 'tweet':
      default:
        const mediaIds: string[] = [];
        for (const media of tweet.media) {
          const buffer = Buffer.from(media.file, 'base64');
          const mimeType = media.type === 'video' ? 'video/mp4' : 
                           media.type === 'gif' ? 'image/gif' : 'image/jpeg';
          const mediaId = await twitterClient.uploadMedia(buffer, mimeType);
          mediaIds.push(mediaId);
        }
        await twitterClient.postTweet(tweet.text, mediaIds);
        break;
    }

    const { error: updateError } = await supabase
      .from(SCHEDULED_TWEETS_TABLE)
      .update({ status: 'posted' })
      .eq('id', tweetId);

    if (updateError) {
      console.error('Error updating tweet status:', updateError);
    }

    // Delete from database to reduce load
    const { error: deleteError } = await supabase
      .from(SCHEDULED_TWEETS_TABLE)
      .delete()
      .eq('id', tweetId);

    if (deleteError) {
      console.error('Error deleting tweet:', deleteError);
    }

    return NextResponse.json({
      success: true,
      message: 'ツイートを投稿しました'
    });
  } catch (error) {
    console.error('Error posting tweet:', error);
    return NextResponse.json(
      { error: 'ツイートの投稿に失敗しました' },
      { status: 500 }
    );
  }
}

export const POST = withCors(withAuth(withRateLimit(handlePOST)));
