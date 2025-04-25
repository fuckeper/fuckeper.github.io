import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RobloxAccount } from "@shared/types";

interface ResultsTableProps {
  accounts: RobloxAccount[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (option: string) => void;
}

export default function ResultsTable({
  accounts,
  sortBy,
  sortOrder,
  onSortChange,
}: ResultsTableProps) {
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getSortIcon = (columnName: string) => {
    if (sortBy !== columnName) return null;
    
    return sortOrder === "asc" ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  const handleHeaderClick = (columnName: string) => {
    onSortChange(columnName);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleHeaderClick("username")}
              >
                <div className="flex items-center">
                  Username {getSortIcon("username")}
                </div>
              </TableHead>
              <TableHead>User ID</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleHeaderClick("robuxBalance")}
              >
                <div className="flex items-center">
                  Robux Balance {getSortIcon("robuxBalance")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleHeaderClick("pendingRobux")}
              >
                <div className="flex items-center">
                  Pending Robux {getSortIcon("pendingRobux")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleHeaderClick("premium")}
              >
                <div className="flex items-center">
                  Premium {getSortIcon("premium")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleHeaderClick("rap")}
              >
                <div className="flex items-center">
                  RAP {getSortIcon("rap")}
                </div>
              </TableHead>
              <TableHead>Special Items</TableHead>
              <TableHead>Donations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.userId}>
                <TableCell>
                  <img
                    src={account.avatarUrl}
                    className="w-10 h-10 rounded-full"
                    alt={`${account.username}'s avatar`}
                    onError={(e) => {
                      // Replace with default avatar if image fails to load
                      (e.target as HTMLImageElement).src = "https://www.roblox.com/headshot-thumbnail/image?userId=0&width=150&height=150";
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">{account.username}</TableCell>
                <TableCell>{account.userId}</TableCell>
                <TableCell>{formatNumber(account.robuxBalance)}</TableCell>
                <TableCell>{formatNumber(account.pendingRobux)}</TableCell>
                <TableCell>
                  {account.premium ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200">
                      Yes
                    </span>
                  ) : (
                    "No"
                  )}
                </TableCell>
                <TableCell>{formatNumber(account.rap)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
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
                  </div>
                </TableCell>
                <TableCell>{formatNumber(account.donations)}</TableCell>
              </TableRow>
            ))}

            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">
                    No accounts match the current filters. Try adjusting your filter criteria.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
