import { useMemo } from "react";
import { RobloxAccount } from "@shared/types";

interface StatsPanelProps {
  accounts: RobloxAccount[];
}

export default function StatsPanel({ accounts }: StatsPanelProps) {
  // Calculate statistics from accounts
  const stats = useMemo(() => {
    const validAccounts = accounts.filter(a => a.isValid);
    const invalidAccounts = accounts.filter(a => !a.isValid);
    const premiumAccounts = validAccounts.filter(a => a.premium);
    const headlessAccounts = validAccounts.filter(a => a.hasHeadless);
    const korbloxAccounts = validAccounts.filter(a => a.hasKorblox);
    const accountsWithDonations = validAccounts.filter(a => a.donations > 0);
    
    const totalRobux = validAccounts.reduce((sum, a) => sum + a.robuxBalance, 0);
    const maxRobux = validAccounts.length > 0 ? Math.max(...validAccounts.map(a => a.robuxBalance)) : 0;
    const totalRAP = validAccounts.reduce((sum, a) => sum + a.rap, 0);
    const avgRAP = validAccounts.length > 0 ? Math.round(totalRAP / validAccounts.length) : 0;
    const totalDonations = validAccounts.reduce((sum, a) => sum + a.donations, 0);
    const premiumPercentage = validAccounts.length > 0 
      ? Math.round((premiumAccounts.length / validAccounts.length) * 100) 
      : 0;
    
    return {
      validCount: validAccounts.length,
      invalidCount: invalidAccounts.length,
      premiumCount: premiumAccounts.length,
      headlessCount: headlessAccounts.length,
      korbloxCount: korbloxAccounts.length,
      accountsWithDonationsCount: accountsWithDonations.length,
      totalRobux,
      maxRobux,
      totalRAP,
      avgRAP,
      totalDonations,
      premiumPercentage
    };
  }, [accounts]);
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Results Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Valid/Invalid stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Cookie Status</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.validCount}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              valid of {stats.validCount + stats.invalidCount} total
            </span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-medium text-danger-500">
              {stats.invalidCount}
            </span> invalid
          </div>
        </div>
        
        {/* Premium stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Premium Accounts</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.premiumCount}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              premium
            </span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-medium text-warning-500">
              {stats.premiumPercentage}%
            </span> of valid accounts
          </div>
        </div>
        
        {/* Robux stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Robux Balance</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatNumber(stats.totalRobux)}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              total
            </span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-medium text-success-500">
              {formatNumber(stats.maxRobux)}
            </span> highest balance
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Headless/Korblox stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Special Items</h3>
          <div className="flex items-center space-x-4 mt-2">
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.headlessCount}
              </span>
              <span className="block text-sm text-gray-500 dark:text-gray-400">
                Headless
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.korbloxCount}
              </span>
              <span className="block text-sm text-gray-500 dark:text-gray-400">
                Korblox
              </span>
            </div>
          </div>
        </div>
        
        {/* RAP stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">RAP (Recent Average Price)</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatNumber(stats.totalRAP)}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              total
            </span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-medium text-primary-500">
              {formatNumber(stats.avgRAP)}
            </span> average per account
          </div>
        </div>
        
        {/* Donations stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Donations</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.accountsWithDonationsCount}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              accounts
            </span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-medium text-primary-500">
              {formatNumber(stats.totalDonations)}
            </span> total donations
          </div>
        </div>
      </div>
    </div>
  );
}
