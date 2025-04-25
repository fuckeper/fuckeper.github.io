import fetch from "node-fetch";
import { queueService } from "./queueService";
import { storage } from "../storage";
import { RobloxAccount } from "@shared/types";

// Constants for Roblox API
const ROBLOX_API_BASE = "https://www.roblox.com";
const ROBLOX_ROBUX_ENDPOINT = "/mobileapi/userinfo";
const ROBLOX_USER_ENDPOINT = "/users/v1/users/authenticated";
const ROBLOX_PREMIUM_ENDPOINT = "/premiumfeatures/v1/users/{userId}/validate-membership";
const ROBLOX_INVENTORY_ENDPOINT = "/inventory/v1/users/{userId}/items/Asset/{assetId}";

// Special item IDs
const HEADLESS_ASSET_ID = "134082579";
const KORBLOX_ASSET_ID = "139607718";

/**
 * Validate a batch of cookies asynchronously
 * @param cookies Array of cookies to validate
 */
export async function validateCookies(cookies: string[]): Promise<void> {
  // Reset the queue status
  queueService.resetStatus(cookies.length);
  
  // Enqueue each cookie for validation
  for (const cookie of cookies) {
    queueService.enqueue(async () => {
      try {
        // Validate the cookie
        const accountInfo = await validateCookie(cookie);
        
        // Store the result
        await storage.storeCookie(accountInfo);
        
        // Update queue status
        queueService.processingComplete(accountInfo.isValid);
        
        // Add to log
        queueService.addLogEntry(
          accountInfo.isValid
            ? `✓ ${accountInfo.username} (ID: ${accountInfo.userId}) - Valid`
            : `✗ Invalid cookie - Failed to authenticate`
        );
      } catch (error) {
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
        queueService.addLogEntry(`✗ Invalid cookie - ${error.message}`);
      }
    });
  }
  
  // Start processing the queue
  queueService.startProcessing();
}

/**
 * Validate a single cookie against Roblox API
 * @param cookie Roblox cookie to validate
 * @returns Promise with account information
 */
async function validateCookie(cookie: string): Promise<RobloxAccount> {
  try {
    // Get user information
    const userInfo = await fetchUserInfo(cookie);
    
    if (!userInfo || !userInfo.UserID) {
      throw new Error("Failed to authenticate");
    }
    
    // Get Robux balance
    const robuxInfo = await fetchRobuxInfo(cookie);
    
    // Check premium status
    const isPremium = await checkPremiumStatus(cookie, userInfo.UserID);
    
    // Check for special items
    const hasHeadless = await checkForItem(cookie, userInfo.UserID, HEADLESS_ASSET_ID);
    const hasKorblox = await checkForItem(cookie, userInfo.UserID, KORBLOX_ASSET_ID);
    
    // Return the account information
    return {
      cookie,
      isValid: true,
      username: userInfo.DisplayName || "",
      userId: userInfo.UserID.toString(),
      robuxBalance: robuxInfo.RobuxBalance || 0,
      pendingRobux: robuxInfo.RobuxPending || 0,
      premium: isPremium,
      donations: 0, // This information may not be available via API
      rap: 0, // This would require additional API calls to calculate
      hasHeadless,
      hasKorblox,
      avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${userInfo.UserID}&width=150&height=150`,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`);
  }
}

/**
 * Fetch user information from Roblox API
 * @param cookie Roblox cookie
 * @returns User information
 */
async function fetchUserInfo(cookie: string): Promise<any> {
  try {
    const response = await fetch(`${ROBLOX_API_BASE}${ROBLOX_USER_ENDPOINT}`, {
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`User info request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch user info: ${error.message}`);
  }
}

/**
 * Fetch Robux balance from Roblox API
 * @param cookie Roblox cookie
 * @returns Robux information
 */
async function fetchRobuxInfo(cookie: string): Promise<any> {
  try {
    const response = await fetch(`${ROBLOX_API_BASE}${ROBLOX_ROBUX_ENDPOINT}`, {
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Robux info request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch Robux info: ${error.message}`);
  }
}

/**
 * Check if user has premium membership
 * @param cookie Roblox cookie
 * @param userId User ID
 * @returns Whether user has premium
 */
async function checkPremiumStatus(cookie: string, userId: number): Promise<boolean> {
  try {
    const endpoint = ROBLOX_PREMIUM_ENDPOINT.replace("{userId}", userId.toString());
    const response = await fetch(`${ROBLOX_API_BASE}${endpoint}`, {
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.isPremium || false;
  } catch (error) {
    console.error(`Failed to check premium status: ${error.message}`);
    return false;
  }
}

/**
 * Check if user has a specific item in inventory
 * @param cookie Roblox cookie
 * @param userId User ID
 * @param assetId Asset ID to check for
 * @returns Whether user has the item
 */
async function checkForItem(cookie: string, userId: number, assetId: string): Promise<boolean> {
  try {
    const endpoint = ROBLOX_INVENTORY_ENDPOINT
      .replace("{userId}", userId.toString())
      .replace("{assetId}", assetId);
    
    const response = await fetch(`${ROBLOX_API_BASE}${endpoint}`, {
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.data && data.data.length > 0;
  } catch (error) {
    console.error(`Failed to check for item ${assetId}: ${error.message}`);
    return false;
  }
}
