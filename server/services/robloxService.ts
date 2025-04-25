import fetch from "node-fetch";
import { queueService } from "./queueService";
import { storage } from "../storage";
import { RobloxAccount } from "@shared/types";

/**
 * Format a cookie for use in requests
 * @param cookie Raw Roblox cookie
 * @returns Properly formatted cookie string
 */
function formatCookie(cookie: string): string {
  // If the cookie already starts with _|WARNING, use it as is
  if (cookie.startsWith('_|WARNING')) {
    return cookie;
  }
  return cookie;
}

/**
 * Validate a batch of cookies asynchronously
 * @param cookies Array of cookies to validate
 */
export async function validateCookies(cookies: string[]): Promise<void> {
  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("Invalid or empty cookies array provided");
  }

  // Reset the queue status
  queueService.resetStatus(cookies.length);
  
  // Enqueue each cookie for validation
  for (const cookie of cookies) {
    queueService.enqueue(async () => {
      try {
        // Get account info
        const accountInfo = await getAccountInfo(cookie);
        
        if (!accountInfo) {
          // Store invalid result
          await storage.storeCookie({
            cookie,
            isValid: false,
            username: "",
            userId: "",
            robuxBalance: 0,
            pendingRobux: 0,
            premium: false,
            donations: 0,
            rap: 0,
            hasHeadless: false,
            hasKorblox: false,
            avatarUrl: "",
            displayName: "",
            accountAge: 0,
            emailVerified: false,
            twoFactor: false,
            hasPin: false,
            voiceChat: false,
            friendsCount: 0,
            isAbove13: false,
            description: "",
            processedAt: new Date().toISOString(),
          });
          
          // Update queue status
          queueService.processingComplete(false);
          
          // Add to log
          queueService.addLogEntry(`✗ Invalid cookie`);
          return;
        }
        
        // Store the result
        await storage.storeCookie(accountInfo);
        
        // Update queue status
        queueService.processingComplete(true);
        
        // Add to log
        queueService.addLogEntry(
          `✓ Valid: ${accountInfo.username} | R$: ${accountInfo.robuxBalance} | Premium: ${accountInfo.premium ? 'Да' : 'Нет'}`
        );
      } catch (error: any) {
        console.error("Error validating cookie:", error);
        
        // Store invalid result
        const invalidAccount: RobloxAccount = {
          cookie,
          isValid: false,
          username: "",
          userId: "",
          robuxBalance: 0,
          pendingRobux: 0,
          premium: false,
          donations: 0,
          rap: 0,
          hasHeadless: false,
          hasKorblox: false,
          avatarUrl: "",
          displayName: "",
          accountAge: 0,
          emailVerified: false,
          twoFactor: false,
          hasPin: false,
          voiceChat: false,
          friendsCount: 0,
          isAbove13: false,
          description: "",
          processedAt: new Date().toISOString(),
        };
        
        await storage.storeCookie(invalidAccount);
        
        // Update queue status
        queueService.processingComplete(false);
        
        // Add to log
        queueService.addLogEntry(`✗ Invalid cookie - ${error.message || 'Unknown error'}`);
      }
    });
  }
  
  // Start processing the queue
  queueService.startProcessing();
}

/**
 * Get detailed information about a Roblox account
 * @param cookie Roblox cookie
 * @returns Account information or null if cookie is invalid
 */
async function getAccountInfo(cookie: string): Promise<RobloxAccount | null> {
  try {
    const cleanCookie = formatCookie(cookie);
    const headers = { 'Cookie': `.ROBLOSECURITY=${cleanCookie}`, 'User-Agent': 'Mozilla/5.0' };
    
    // Проверка валидности куки через запрос баланса (как в Python скрипте)
    const validCheck = await fetch('https://economy.roblox.com/v1/user/currency', { headers });
    
    if (validCheck.status !== 200) {
      return null;
    }
    
    // Получаем баланс Robux
    const robuxData = await validCheck.json() as { robux?: number };
    const robux = robuxData.robux || 0;
    
    // Получаем информацию о пользователе
    const userInfoResponse = await fetch('https://users.roblox.com/v1/users/authenticated', { headers });
    if (!userInfoResponse.ok) return null;
    const userInfo = await userInfoResponse.json() as { 
      name?: string; 
      id?: number | string; 
      displayName?: string 
    };
    
    // Получаем настройки пользователя
    const settingsResponse = await fetch('https://www.roblox.com/my/settings/json', { headers });
    if (!settingsResponse.ok) return null;
    const settings = await settingsResponse.json() as { 
      isPremium?: boolean; 
      AccountAgeInDays?: number; 
      IsEmailVerified?: boolean;
      MyAccountSecurityModel?: { IsTwoStepEnabled?: boolean };
      IsAccountPinEnabled?: boolean;
      UserAbove13?: boolean;
    };
    
    // Проверка голосового чата
    const voiceChatResponse = await fetch('https://voice.roblox.com/v1/settings', { headers });
    const voiceChatData = await voiceChatResponse.json() as { isVerifiedForVoice?: boolean };
    
    // Получаем количество друзей
    const friendsResponse = await fetch('https://friends.roblox.com/v1/my/friends/count', { headers });
    const friendsData = await friendsResponse.json() as { count?: number };
    
    // Получаем описание профиля
    const descriptionResponse = await fetch('https://users.roblox.com/v1/description', { headers });
    const descriptionData = await descriptionResponse.json() as { description?: string };
    
    // Получаем информацию о транзакциях
    const transactionsResponse = await fetch(
      `https://economy.roblox.com/v2/users/${userInfo.id}/transaction-totals?timeFrame=Year&transactionType=summary`,
      { headers }
    );
    const transactionsData = await transactionsResponse.json() as { 
      pendingRobuxTotal?: number;
      incomingRobuxTotal?: number; 
    };
    
    // Проверка на наличие предметов Headless и Korblox
    let hasHeadless = false;
    let hasKorblox = false;
    
    try {
      // В идеале здесь должен быть запрос к API для проверки наличия предметов
      // Но для упрощения мы просто ставим false
    } catch (e) {
      console.error("Error checking items:", e);
    }
    
    return {
      cookie,
      isValid: true,
      username: userInfo.name || "",
      userId: (userInfo.id?.toString()) || "",
      robuxBalance: robux,
      pendingRobux: transactionsData?.pendingRobuxTotal || 0,
      premium: Boolean(settings.isPremium),
      donations: transactionsData?.incomingRobuxTotal || 0,
      rap: 0, // Требуется дополнительный запрос для получения RAP
      hasHeadless,
      hasKorblox,
      avatarUrl: `https://www.roblox.com/avatar-thumbnails?userId=${userInfo.id}&size=150x150`,
      displayName: userInfo.displayName || "",
      accountAge: Math.round((settings.AccountAgeInDays || 0) / 365 * 100) / 100,
      emailVerified: Boolean(settings.IsEmailVerified),
      twoFactor: Boolean(settings.MyAccountSecurityModel?.IsTwoStepEnabled),
      hasPin: Boolean(settings.IsAccountPinEnabled),
      voiceChat: Boolean(voiceChatData.isVerifiedForVoice),
      friendsCount: friendsData.count || 0,
      isAbove13: Boolean(settings.UserAbove13),
      description: descriptionData.description || "",
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error getting account info: ${error}`);
    return null;
  }
}

/**
 * Simple check if a cookie is valid using Roblox API
 * @param cookie Roblox cookie to validate
 * @returns Promise<boolean> indicating if cookie is valid
 */
async function checkCookieValid(cookie: string): Promise<boolean> {
  try {
    const cleanCookie = formatCookie(cookie);
    
    // Используем аналогичную проверку из вашего Python кода
    const response = await fetch('https://economy.roblox.com/v1/user/currency', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cleanCookie}`,
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    // Куки валидный, если получили успешный ответ
    return response.status === 200;
  } catch (error: any) {
    console.error(`Cookie validation failed: ${error.message || 'Unknown error'}`);
    return false;
  }
}