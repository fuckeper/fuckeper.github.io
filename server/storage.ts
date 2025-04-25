import { Cookie, InsertCookie } from "@shared/schema";
import { RobloxAccount } from "@shared/types";
import { logger } from "./services/logger";

// Interface for storage operations
export interface IStorage {
  storeCookie(accountInfo: RobloxAccount): Promise<boolean>; // Boolean indicates if it was a new cookie
  getCookie(cookie: string): Promise<RobloxAccount | undefined>;
  getCookieByUserId(userId: string): Promise<RobloxAccount | undefined>;
  getAllCookies(): Promise<RobloxAccount[]>;
  clearAllCookies(): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private cookies: Map<string, RobloxAccount>; // cookie -> account
  private cookiesByUserId: Map<string, string>; // userId -> cookie

  constructor() {
    this.cookies = new Map();
    this.cookiesByUserId = new Map();
  }

  /**
   * Сохранить информацию о куки
   * @param accountInfo Информация об аккаунте
   * @returns Promise<boolean> true если это новый куки, false если куки уже существовал
   */
  async storeCookie(accountInfo: RobloxAccount): Promise<boolean> {
    // Проверяем, существует ли куки уже в хранилище
    const existingAccount = this.cookies.get(accountInfo.cookie);
    if (existingAccount) {
      logger.debug('Cookie already exists in storage', { 
        cookie: accountInfo.cookie.substring(0, 10) + '...'
      });
      return false;
    }
    
    // Если у аккаунта есть userId, проверяем, не существует ли уже аккаунт с таким userId
    if (accountInfo.userId && accountInfo.isValid) {
      const existingCookie = this.cookiesByUserId.get(accountInfo.userId);
      if (existingCookie) {
        logger.debug('Account with this userId already exists', { 
          userId: accountInfo.userId,
          username: accountInfo.username
        });
        // Мы все равно сохраняем куки, но логируем что это дубликат аккаунта
      }
      
      // Сохраняем маппинг userId -> cookie
      this.cookiesByUserId.set(accountInfo.userId, accountInfo.cookie);
    }
    
    // Сохраняем куки в основное хранилище
    this.cookies.set(accountInfo.cookie, accountInfo);
    return true;
  }

  /**
   * Получить информацию о куки
   * @param cookie Roblox cookie
   * @returns Информация об аккаунте или undefined
   */
  async getCookie(cookie: string): Promise<RobloxAccount | undefined> {
    return this.cookies.get(cookie);
  }
  
  /**
   * Получить аккаунт по userId
   * @param userId ID пользователя
   * @returns Информация об аккаунте или undefined
   */
  async getCookieByUserId(userId: string): Promise<RobloxAccount | undefined> {
    const cookie = this.cookiesByUserId.get(userId);
    if (!cookie) return undefined;
    return this.cookies.get(cookie);
  }

  /**
   * Получить все куки из хранилища
   * @returns Массив информации об аккаунтах
   */
  async getAllCookies(): Promise<RobloxAccount[]> {
    return Array.from(this.cookies.values());
  }

  /**
   * Очистить все куки
   */
  async clearAllCookies(): Promise<void> {
    this.cookies.clear();
    this.cookiesByUserId.clear();
    logger.info('All cookies cleared from storage');
  }
}

// Export a singleton instance
export const storage = new MemStorage();
