import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCookieStore } from "@/hooks/useCookieStore";
import { exportToTXT } from "@/lib/exportUtils";
import { RobloxAccount } from "@shared/types";

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { results } = useCookieStore();

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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">Valid Cookies</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-500">{validCookies.length}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">Invalid Cookies</p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-500">{invalidCookies.length}</p>
          </div>
        </div>

        {/* Export button */}
        {validCookies.length > 0 && (
          <button
            onClick={downloadValidCookies}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
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
            Download Valid Cookies
          </button>
        )}
      </div>

      {/* Valid cookies section */}
      {validCookies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Valid Cookies ({validCookies.length})</h2>
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {validCookies.map((account) => (
                <li key={account.cookie} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start">
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Valid</p>
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
