import fetch from "node-fetch";
import { queueService } from "./queueService";
import { storage } from "../storage";
import { RobloxAccount } from "@shared/types";

// Constants for Roblox API
const ROBLOX_API_BASE = "https://www.roblox.com";
// Simpler authentication check endpoint
const ROBLOX_AUTH_ENDPOINT = "/login/navigation-menu-data";

/**
 * Format a cookie for use in requests
 * @param cookie Raw Roblox cookie
 * @returns Properly formatted cookie string
 */
function formatCookie(cookie: string): string {
  // If the cookie already starts with _|WARNING, it's in the proper format
  if (cookie.startsWith('_|WARNING')) {
    return `.ROBLOSECURITY=${cookie}`;
  }
  // If it doesn't, it might be missing the leading dot
  return `.ROBLOSECURITY=.${cookie}`;
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
        // Validate the cookie - simple check if it's valid
        const isValid = await checkCookieValid(cookie);
        
        // Create account info object
        const accountInfo: RobloxAccount = {
          cookie,
          isValid,
          username: isValid ? "Valid Account" : "",
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
        queueService.processingComplete(isValid);
        
        // Add to log
        queueService.addLogEntry(
          isValid
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
 * Simple check if a cookie is valid
 * @param cookie Roblox cookie to validate
 * @returns Promise<boolean> indicating if cookie is valid
 */
async function checkCookieValid(cookie: string): Promise<boolean> {
  try {
    const response = await fetch(`${ROBLOX_API_BASE}${ROBLOX_AUTH_ENDPOINT}`, {
      headers: {
        Cookie: formatCookie(cookie),
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    // Явно типизируем данные как объект с интерфейсом
    interface AuthResponse {
      isAuthenticated?: boolean;
      [key: string]: any;
    }
    
    const data = await response.json() as AuthResponse;
    
    // Проверяем наличие флага isAuthenticated
    return Boolean(data?.isAuthenticated);
  } catch (error: any) {
    console.error(`Cookie validation failed: ${error.message || 'Unknown error'}`);
    return false;
  }
}
