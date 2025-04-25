import { RobloxAccount } from "@shared/types";

/**
 * Export account data to a JSON file
 * @param accounts Array of Roblox accounts
 */
export function exportToJSON(accounts: RobloxAccount[]): void {
  const validAccounts = accounts.filter(a => a.isValid);
  
  // Convert accounts to JSON string
  const json = JSON.stringify(validAccounts, null, 2);
  
  // Create a Blob from the JSON string
  const blob = new Blob([json], { type: 'application/json' });
  
  // Create a download link
  downloadFile(blob, 'roblox_accounts.json');
}

/**
 * Export account data to a TXT file
 * @param accounts Array of Roblox accounts
 */
export function exportToTXT(accounts: RobloxAccount[]): void {
  const validAccounts = accounts.filter(a => a.isValid);
  
  // Create a text representation of the accounts
  let text = '';
  
  for (const account of validAccounts) {
    text += `Username: ${account.username}\n`;
    text += `User ID: ${account.userId}\n`;
    text += `Robux Balance: ${account.robuxBalance}\n`;
    text += `Pending Robux: ${account.pendingRobux}\n`;
    text += `Premium: ${account.premium ? 'Yes' : 'No'}\n`;
    text += `RAP: ${account.rap}\n`;
    text += `Donations: ${account.donations}\n`;
    text += `Special Items: ${[
      ...(account.hasHeadless ? ['Headless'] : []),
      ...(account.hasKorblox ? ['Korblox'] : []),
    ].join(', ') || 'None'}\n`;
    text += `Cookie: ${account.cookie}\n`;
    text += '------------------------\n\n';
  }
  
  // Create a Blob from the text
  const blob = new Blob([text], { type: 'text/plain' });
  
  // Create a download link
  downloadFile(blob, 'roblox_accounts.txt');
}

/**
 * Helper function to download a file
 * @param blob Blob to download
 * @param fileName Name of the file
 */
function downloadFile(blob: Blob, fileName: string): void {
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Append the link to the document
  document.body.appendChild(link);
  
  // Click the link to download the file
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
