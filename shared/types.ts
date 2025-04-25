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
