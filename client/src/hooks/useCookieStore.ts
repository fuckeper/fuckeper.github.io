import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RobloxAccount } from "@shared/types";

interface CookieStore {
  // Uploaded cookies
  cookies: string[];
  cookiesCount: number;
  
  // Processing status
  validCount: number;
  invalidCount: number;
  
  // Results
  results: RobloxAccount[];
  
  // Actions
  setCookies: (cookies: string[]) => void;
  setProcessingStatus: (status: { validCount: number; invalidCount: number }) => void;
  setResults: (results: RobloxAccount[]) => void;
  clearAllData: () => void;
}

export const useCookieStore = create<CookieStore>()(
  persist(
    (set) => ({
      // Initial state
      cookies: [],
      cookiesCount: 0,
      validCount: 0,
      invalidCount: 0,
      results: [],
      
      // Actions
      setCookies: (cookies) => set({
        cookies,
        cookiesCount: cookies.length,
        validCount: 0,
        invalidCount: 0,
      }),
      
      setProcessingStatus: (status) => set({
        validCount: status.validCount,
        invalidCount: status.invalidCount,
      }),
      
      setResults: (results) => {
        // Убедимся, что results - это массив перед использованием filter
        if (Array.isArray(results)) {
          set({
            results,
            validCount: results.filter(r => r.isValid).length,
            invalidCount: results.filter(r => !r.isValid).length,
          });
        } else {
          // Если results не массив, установим пустой массив
          set({
            results: [],
            validCount: 0,
            invalidCount: 0,
          });
          console.error("Results is not an array:", results);
        }
      },
      
      clearAllData: () => set({
        cookies: [],
        cookiesCount: 0,
        validCount: 0,
        invalidCount: 0,
        results: [],
      }),
    }),
    {
      name: "roblox-cookie-store",
    }
  )
);
