// Roblox account information from validated cookie
export interface RobloxAccount {
  cookie: string;
  isValid: boolean;
  username: string;
  userId: string;
  robuxBalance: number;
  pendingRobux: number;
  premium: boolean;
  donations: number;
  rap: number;
  hasHeadless: boolean;
  hasKorblox: boolean;
  avatarUrl: string;
  displayName: string;
  accountAge: number;
  emailVerified: boolean;
  twoFactor: boolean;
  hasPin: boolean;
  voiceChat: boolean;
  friendsCount: number;
  isAbove13: boolean;
  description: string;
  processedAt: string;
}

// Status update for processing
export interface ProcessingStatus {
  processed: number;
  total: number;
  valid: number;
  invalid: number;
  latestLog?: string;
  complete: boolean;
}
