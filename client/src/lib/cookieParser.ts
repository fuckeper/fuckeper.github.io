/**
 * Parse a cookies.txt file and extract valid Roblox cookies
 * @param content Content of the cookies.txt file
 * @returns Array of valid Roblox cookies
 */
export function parseCookies(content: string): string[] {
  // Regular expression to match Roblox cookies
  const regex = /\._\|WARNING:-DO-NOT-SHARE-THIS[^\r\n]+/g;
  
  // Extract all matches
  const matches = content.match(regex) || [];
  
  // Return unique cookies (remove duplicates)
  return Array.from(new Set(matches));
}
