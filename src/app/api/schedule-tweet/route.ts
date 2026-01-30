import { NextRequest, NextResponse } from 'next/server';
import { parseISO, isFuture } from 'date-fns';
import { supabase, SCHEDULED_TWEETS_TABLE } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/rate-limit';
import { withCors } from '@/lib/cors';
import { withCsrfOptional } from '@/lib/csrf';
import { validateTweetText, validateTweetId, validateScheduledTime, validateFile, sanitizeInput } from '@/lib/validation';

function roundToNext15Minutes(date: Date): Date {
  const minutes = date.getMinutes();
  const remainder = minutes % 15;
  const roundedMinutes = remainder === 0 ? minutes : minutes + (15 - remainder);
  const roundedDate = new Date(date);
  roundedDate.setMinutes(roundedMinutes);
  roundedDate.setSeconds(0);
  roundedDate.setMilliseconds(0);
  return roundedDate;
}

function toJSTString(date: Date): string {
  const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');
  const hours = String(jstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(jstDate.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function handlePOST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const scheduledTime = formData.get('scheduledTime') as string;
    const tweetType = formData.get('tweetType') as 'tweet' | 'quote' | 'retweet' | 'reply';
    const retweetId = formData.get('retweetId') as string;
    const quoteTweetId = formData.get('quoteTweetId') as string;
    const replyTweetId = formData.get('replyTweetId') as string;

    // Validate inputs
    if (tweetType !== 'retweet') {
      const textValidation = validateTweetText(text);
      if (!textValidation.valid) {
        return NextResponse.json({ error: textValidation.error }, { status: 400 });
      }
    }

    if (tweetType === 'retweet') {
      const idValidation = validateTweetId(retweetId);
      if (!idValidation.valid) {
        return NextResponse.json({ error: idValidation.error }, { status: 400 });
      }
    }

    if (tweetType === 'quote') {
      const idValidation = validateTweetId(quoteTweetId);
      if (!idValidation.valid) {
        return NextResponse.json({ error: idValidation.error }, { status: 400 });
      }
    }

    if (tweetType === 'reply') {
      const idValidation = validateTweetId(replyTweetId);
      if (!idValidation.valid) {
        return NextResponse.json({ error: idValidation.error }, { status: 400 });
      }
    }

    if (scheduledTime) {
      const timeValidation = validateScheduledTime(scheduledTime);
      if (!timeValidation.valid) {
        return NextResponse.json({ error: timeValidation.error }, { status: 400 });
      }
    }

    const mediaFiles: Array<{ file: string; type: 'image' | 'video' | 'gif' }> = [];
    let mediaIndex = 0;
    while (formData.get(`media_${mediaIndex}`)) {
      const file = formData.get(`media_${mediaIndex}`) as File;
      const type = formData.get(`mediaType_${mediaIndex}`) as 'image' | 'video' | 'gif';
      
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) {
        return NextResponse.json({ error: fileValidation.error }, { status: 400 });
      }
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      
      mediaFiles.push({
        file: base64,
        type
      });
      mediaIndex++;
    }

    let scheduledDate: Date;
    let scheduledTimeString: string;
    if (scheduledTime) {
      scheduledDate = parseISO(scheduledTime);
      
      if (!isFuture(scheduledDate)) {
        return NextResponse.json(
          { error: 'スケジュール時間は未来である必要があります' },
          { status: 400 }
        );
      }
      scheduledTimeString = toJSTString(scheduledDate);
    } else {
      scheduledDate = roundToNext15Minutes(new Date());
      scheduledTimeString = toJSTString(scheduledDate);
    }

    const { data: existingTweets } = await supabase
      .from(SCHEDULED_TWEETS_TABLE)
      .select('id')
      .eq('scheduled_time', scheduledTimeString)
      .eq('status', 'pending');
    
    if (existingTweets && existingTweets.length > 0) {
      return NextResponse.json(
        { error: 'この時間には既に予約されたツイートがあります' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from(SCHEDULED_TWEETS_TABLE)
      .insert({
        id: Date.now().toString(),
        text: sanitizeInput(text),
        media: mediaFiles,
        scheduled_time: scheduledTimeString,
        tweet_type: tweetType,
        retweet_id: retweetId,
        quote_tweet_id: quoteTweetId,
        reply_tweet_id: replyTweetId,
        status: 'pending',
        api_key: apiKey
      });

    if (error) {
      console.error('Error inserting tweet:', error);
      return NextResponse.json(
        { error: 'ツイートの予約に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `ツイートを${scheduledTimeString}に予約しました`
    });
  } catch (error) {
    console.error('Error scheduling tweet:', error);
    return NextResponse.json(
      { error: 'ツイートの予約に失敗しました' },
      { status: 500 }
    );
  }
}

export const POST = withCors(withAuth(withRateLimit(withCsrfOptional(handlePOST))));

async function handleGET() {
  const { data, error } = await supabase
    .from(SCHEDULED_TWEETS_TABLE)
    .select('*')
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.error('Error fetching tweets:', error);
    return NextResponse.json(
      { error: 'ツイートの取得に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

export const GET = withCors(handleGET);
