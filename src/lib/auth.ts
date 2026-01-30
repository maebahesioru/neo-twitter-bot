const authenticator = require('otplib/authenticator');

export function generateTOTP(secret: string): string {
  return authenticator.generate(secret);
}

export function verifyTOTP(token: string, secret: string): boolean {
  return authenticator.check(token, secret);
}

export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

export interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  bearerToken: string;
  username: string;
  password: string;
  totpSecret: string;
}

export function getTwitterCredentials(): TwitterCredentials {
  const credentials: TwitterCredentials = {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    username: process.env.TWITTER_USERNAME || '',
    password: process.env.TWITTER_PASSWORD || '',
    totpSecret: process.env.TOTP_SECRET || ''
  };

  if (!credentials.apiKey || !credentials.apiSecret || !credentials.accessToken || !credentials.accessSecret) {
    throw new Error('Twitter API credentials are not properly configured');
  }

  return credentials;
}
