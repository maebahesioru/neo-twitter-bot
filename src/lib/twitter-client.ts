import { TwitterClient as BirdClient, resolveCredentials } from '@steipete/bird';

export class TwitterClient {
  private birdClient: BirdClient | null = null;

  private async ensureClient(): Promise<BirdClient> {
    if (!this.birdClient) {
      // Try to resolve credentials from browser
      const { cookies } = await resolveCredentials({
        cookieSource: ['chrome', 'firefox']
      });
      
      // If browser credentials don't work, use environment variables
      if (!cookies.authToken || !cookies.ct0) {
        cookies.authToken = process.env.AUTH_TOKEN || '';
        cookies.ct0 = process.env.CT0 || '';
      }
      
      if (!cookies.authToken || !cookies.ct0) {
        throw new Error('Twitter credentials not found');
      }
      
      this.birdClient = new BirdClient({ cookies });
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
    
    const tweet = await client.tweet(text);
    return tweet;
  }

  async retweet(tweetId: string) {
    const client = await this.ensureClient();
    await client.retweet(tweetId);
    return { success: true };
  }

  async uploadMedia(buffer: Buffer, mimeType: string): Promise<string> {
    // Bird library doesn't have direct media upload
    // For now, return a placeholder
    throw new Error('Media upload not supported with bird library');
  }
}

export const twitterClient = new TwitterClient();
