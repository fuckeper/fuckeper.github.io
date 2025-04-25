import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCookieStore } from "@/hooks/useCookieStore";
import { exportToTXT } from "@/lib/exportUtils";
import { RobloxAccount } from "@shared/types";

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { results } = useCookieStore();
  const [selectedAccount, setSelectedAccount] = useState<RobloxAccount | null>(null);

  // Redirect if no results
  useEffect(() => {
    if (!results.length) {
      setLocation("/");
    }
  }, [results, setLocation]);

  // Split results into valid and invalid (защита от ошибок, если results не определен)
  const validCookies = Array.isArray(results) ? results.filter(account => account.isValid) : [];
  const invalidCookies = Array.isArray(results) ? results.filter(account => !account.isValid) : [];

  // Download valid cookies as TXT
  const downloadValidCookies = () => {
    const cookiesText = validCookies.map(account => account.cookie).join('\n');
    const blob = new Blob([cookiesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'valid_cookies.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download all account info as JSON
  const downloadAccountsJson = () => {
    const accountsJson = JSON.stringify(validCookies, null, 2);
    const blob = new Blob([accountsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roblox_accounts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Handle account selection for details view
  const handleAccountSelect = (account: RobloxAccount) => {
    setSelectedAccount(account);
  };

  // Calculate stats
  const totalRobux = validCookies.reduce((sum, account) => sum + account.robuxBalance, 0);
  const totalPendingRobux = validCookies.reduce((sum, account) => sum + (account.pendingRobux || 0), 0);
  const totalDonations = validCookies.reduce((sum, account) => sum + (account.donations || 0), 0);
  const totalBilling = validCookies.reduce((sum, account) => sum + (account.billingBalance || 0), 0);
  const totalCards = validCookies.reduce((sum, account) => sum + (account.cardsCount || 0), 0);
  const accountsWithCards = validCookies.filter(account => account.hasPaymentCards).length;
  const premiumAccounts = validCookies.filter(account => account.premium).length;

  return (
    <>
      {/* Tabs for navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <a
            href="#"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            onClick={(e) => {
              e.preventDefault();
              setLocation("/");
            }}
          >
            Upload
          </a>
          <a
            href="#"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            onClick={(e) => e.preventDefault()}
          >
            Processing
          </a>
          <a
            href="#"
            className="border-primary-500 text-primary-600 dark:text-primary-400 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            aria-current="page"
          >
            Results
          </a>
        </nav>
      </div>

      {/* Stats summary */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Results Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">Valid Cookies</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-500">{validCookies.length}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">Invalid Cookies</p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-500">{invalidCookies.length}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-400">Total Robux</p>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-500">R$ {totalRobux}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-400">Premium</p>
            <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-500">{premiumAccounts}</p>
          </div>
        </div>
        
        {/* Additional stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Total Donations</p>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-500">R$ {totalDonations}</p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded">
            <p className="text-sm font-medium text-cyan-800 dark:text-cyan-400">Pending Robux</p>
            <p className="mt-2 text-2xl font-bold text-cyan-600 dark:text-cyan-500">R$ {totalPendingRobux}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Total Billing</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-500">$ {totalBilling}</p>
          </div>
        </div>
        
        {/* Cards stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded">
            <p className="text-sm font-medium text-pink-800 dark:text-pink-400">Total Games/Cards</p>
            <p className="mt-2 text-2xl font-bold text-pink-600 dark:text-pink-500">{totalCards}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded">
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-400">Game Developers</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-500">{accountsWithCards}</p>
          </div>
        </div>

        {/* Export buttons */}
        {validCookies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={downloadValidCookies}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
              Download Valid Cookies (.txt)
            </button>
            <button
              onClick={downloadAccountsJson}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 dark:focus:ring-offset-gray-800"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
              Export Account Details (.json)
            </button>
          </div>
        )}
      </div>

      {/* Valid cookies section */}
      {validCookies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Valid Accounts ({validCookies.length})</h2>
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {validCookies.map((account) => (
                <li 
                  key={account.cookie} 
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="flex items-start">
                    {account.avatarUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={account.avatarUrl} 
                          alt={account.username} 
                          className="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://www.roblox.com/headshot-thumbnail/image?userId=1&width=150&height=150';
                          }}
                        />
                      </div>
                    )}
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{account.username || "Unknown User"}</p>
                          {account.displayName && account.displayName !== account.username && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{account.displayName}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Valid
                          </span>
                          {account.premium && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">R$:</span> {account.robuxBalance}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Pending R$:</span> {account.pendingRobux || 0}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Donations:</span> {account.donations || 0}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Billing $:</span> {account.billingBalance || 0}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Friends:</span> {account.friendsCount}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Age:</span> {account.accountAge} years
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">2FA:</span> {account.twoFactor ? 'Yes' : 'No'}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Headless:</span> {account.hasHeadless ? 'Yes' : 'No'}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Korblox:</span> {account.hasKorblox ? 'Yes' : 'No'}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Games:</span> {account.hasPaymentCards ? `${account.cardsCount}` : '0'}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-900 p-2 rounded font-mono">
                          {account.cookie}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Account details modal */}
      {selectedAccount && (
        <div className="fixed inset-0 overflow-y-auto z-50" onClick={() => setSelectedAccount(null)}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <div 
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  {selectedAccount.avatarUrl && (
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full sm:mx-0 sm:h-20 sm:w-20">
                      <img 
                        src={selectedAccount.avatarUrl} 
                        alt={selectedAccount.username} 
                        className="h-full w-full rounded-full border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://www.roblox.com/headshot-thumbnail/image?userId=1&width=150&height=150';
                        }}
                      />
                    </div>
                  )}
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {selectedAccount.username || "Unknown User"}
                      {selectedAccount.premium && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Premium
                        </span>
                      )}
                    </h3>
                    {selectedAccount.displayName && selectedAccount.displayName !== selectedAccount.username && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{selectedAccount.displayName}
                      </p>
                    )}
                    
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <div className="col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAccount.userId || "Unknown"}</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Age</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAccount.accountAge} years</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Robux Balance</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">R$ {selectedAccount.robuxBalance}</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Robux</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">R$ {selectedAccount.pendingRobux}</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Donations</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">R$ {selectedAccount.donations}</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Balance</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">$ {selectedAccount.billingBalance}</dd>
                        </div>
                        <div className="col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Friends</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAccount.friendsCount}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Security Features</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedAccount.twoFactor ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              2FA: {selectedAccount.twoFactor ? 'Enabled' : 'Disabled'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedAccount.hasPin ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              PIN: {selectedAccount.hasPin ? 'Enabled' : 'Disabled'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedAccount.emailVerified ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              Email: {selectedAccount.emailVerified ? 'Verified' : 'Not Verified'}
                            </span>
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Features</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedAccount.premium ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              Premium: {selectedAccount.premium ? 'Yes' : 'No'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedAccount.voiceChat ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              Voice Chat: {selectedAccount.voiceChat ? 'Enabled' : 'Disabled'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedAccount.isAbove13 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              Age: {selectedAccount.isAbove13 ? 'Above 13' : 'Below 13'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedAccount.hasPaymentCards ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              Game Developer: {selectedAccount.hasPaymentCards ? `Yes (${selectedAccount.cardsCount} games)` : 'No'}
                            </span>
                          </dd>
                        </div>
                        {selectedAccount.description && (
                          <div className="col-span-2">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-2 rounded">
                              {selectedAccount.description}
                            </dd>
                          </div>
                        )}
                        <div className="col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cookie</dt>
                          <dd className="mt-1 text-xs text-gray-900 dark:text-white break-all bg-gray-50 dark:bg-gray-900 p-2 rounded font-mono">
                            {selectedAccount.cookie}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    // Copy cookie to clipboard
                    navigator.clipboard.writeText(selectedAccount.cookie);
                    // Close modal
                    setTimeout(() => setSelectedAccount(null), 200);
                  }}
                >
                  Copy Cookie
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedAccount(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invalid cookies section */}
      {invalidCookies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Invalid Cookies ({invalidCookies.length})</h2>
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {invalidCookies.map((account) => (
                <li key={account.cookie} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start">
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Invalid</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(account.processedAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-900 p-2 rounded font-mono">
                        {account.cookie}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
