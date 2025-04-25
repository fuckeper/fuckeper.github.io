import { RobloxAccount } from "@shared/types";

interface ResultsCardsProps {
  accounts: RobloxAccount[];
}

export default function ResultsCards({ accounts }: ResultsCardsProps) {
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <div
          key={account.userId}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <img
              src={account.avatarUrl}
              className="w-12 h-12 rounded-full"
              alt={`${account.username}'s avatar`}
              onError={(e) => {
                // Replace with default avatar if image fails to load
                (e.target as HTMLImageElement).src = "https://www.roblox.com/headshot-thumbnail/image?userId=0&width=150&height=150";
              }}
            />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {account.username}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID: {account.userId}
              </p>
            </div>
            {account.premium && (
              <div className="ml-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Premium
                </span>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Robux Balance
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(account.robuxBalance)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending Robux
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(account.pendingRobux)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  RAP
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(account.rap)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Donations
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(account.donations)}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                Special Items:
              </span>
              <div className="flex space-x-1">
                {account.hasHeadless && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    Headless
                  </span>
                )}
                {account.hasKorblox && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    Korblox
                  </span>
                )}
                {!account.hasHeadless && !account.hasKorblox && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    None
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {accounts.length === 0 && (
        <div className="col-span-full text-center p-10 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No accounts match the current filters. Try adjusting your filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
