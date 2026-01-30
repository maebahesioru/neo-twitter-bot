import { TwitterClient as BirdClient } from '@steipete/bird';

export class TwitterClient {
  private birdClient: BirdClient | null = null;

  private async ensureClient(): Promise<BirdClient> {
    if (!this.birdClient) {
      // Use environment variables directly (Vercel/serverless environment)
      const authToken = process.env.AUTH_TOKEN;
      const ct0 = process.env.CT0;
      
      console.log('Auth token exists:', !!authToken);
      console.log('CT0 exists:', !!ct0);
      
      if (!authToken || !ct0) {
        throw new Error('Twitter credentials not found in environment variables');
      }
      
      this.birdClient = new BirdClient({ 
        cookies: { authToken, ct0 }
      });
    }
    return this.birdClient;
  }

  async postTweet(
    text: string,
    mediaIds?: string[],
    quoteTweetId?: string,
    replyTweetId?: string
  ) {
    const client = await this.ensureClient();
    
    console.log('Posting tweet:', { text: text.substring(0, 50), hasMedia: !!mediaIds?.length, quoteTweetId, replyTweetId });
    
    try {
      const tweet = await client.tweet(text);
      console.log('Tweet posted successfully:', tweet);
      return tweet;
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw error;
    }
  }

  async retweet(tweetId: string) {
    const client = await this.ensureClient();
    
    console.log('Retweeting:', tweetId);
    
    try {
      await client.retweet(tweetId);
      console.log('Retweet successful');
      return { success: true };
    } catch (error) {
      console.error('Error retweeting:', error);
      throw error;
    }
  }

  async uploadMedia(buffer: Buffer, mimeType: string): Promise<string> {
    // Bird library doesn't have direct media upload
    console.error('Media upload requested but not supported');
    throw new Error('Media upload not supported with bird library');
  }
}

export const twitterClient = new TwitterClient();
