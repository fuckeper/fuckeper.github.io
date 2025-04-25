// Roblox account information from validated cookie
export interface RobloxAccount {
  cookie: string;
  isValid: boolean;
  username: string;
  userId: string;
  robuxBalance: number;   // Текущий баланс Robux
  pendingRobux: number;   // Ожидающие средства (в Robux)
  premium: boolean;
  donations: number;      // Пожертвования (в Robux)
  billingBalance: number; // Баланс в долларах/валюте на кошельке Roblox
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
