/**
 * Parse a cookies.txt file and extract valid Roblox cookies
 * @param content Content of the cookies.txt file
 * @returns Array of valid Roblox cookies
 */
export function parseCookies(content: string): string[] {
  // Regular expressions to match Roblox cookies (with or without leading dot)
  const regexes = [
    /\._\|WARNING:-DO-NOT-SHARE-THIS[^\r\n]+/g, // Format with leading dot
    /_\|WARNING:-DO-NOT-SHARE-THIS[^\r\n]+/g    // Format without leading dot
  ];
  
  // Collect all matches from all patterns
  let allMatches: string[] = [];
  
  for (const regex of regexes) {
    const matches = content.match(regex) || [];
    allMatches = [...allMatches, ...matches];
  }
  
  // Clean up cookies - remove leading dot if present
  const cleanedCookies = allMatches.map(cookie => {
    if (cookie.startsWith('.')) {
      return cookie.substring(1);
    }
    return cookie;
  });
  
  // Return unique cookies (remove duplicates)
  return Array.from(new Set(cleanedCookies));
}
