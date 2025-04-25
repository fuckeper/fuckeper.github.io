import { Cookie, InsertCookie } from "@shared/schema";
import { RobloxAccount } from "@shared/types";

// Interface for storage operations
export interface IStorage {
  storeCookie(accountInfo: RobloxAccount): Promise<void>;
  getCookie(cookie: string): Promise<RobloxAccount | undefined>;
  getAllCookies(): Promise<RobloxAccount[]>;
  clearAllCookies(): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private cookies: Map<string, RobloxAccount>;

  constructor() {
    this.cookies = new Map();
  }

  async storeCookie(accountInfo: RobloxAccount): Promise<void> {
    this.cookies.set(accountInfo.cookie, accountInfo);
  }

  async getCookie(cookie: string): Promise<RobloxAccount | undefined> {
    return this.cookies.get(cookie);
  }

  async getAllCookies(): Promise<RobloxAccount[]> {
    return Array.from(this.cookies.values());
  }

  async clearAllCookies(): Promise<void> {
    this.cookies.clear();
  }
}

// Export a singleton instance
export const storage = new MemStorage();
