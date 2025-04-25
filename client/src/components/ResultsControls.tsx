import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { exportToJSON, exportToTXT } from "@/lib/exportUtils";
import { RobloxAccount } from "@shared/types";

interface ResultsControlsProps {
  viewType: "cards" | "table";
  setViewType: (view: "cards" | "table") => void;
  filters: {
    premium: boolean;
    headless: boolean;
    korblox: boolean;
    minRobux: number;
  };
  onFilterChange: (name: string, value: boolean | number) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (option: any) => void;
  accounts: RobloxAccount[];
}

export default function ResultsControls({
  viewType,
  setViewType,
  filters,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  accounts,
}: ResultsControlsProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const handleExportJSON = () => {
    exportToJSON(accounts);
  };
  
  const handleExportTXT = () => {
    exportToTXT(accounts);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
      <div className="flex items-center space-x-4 mb-4 md:mb-0">
        {/* View toggle */}
        <div className="flex items-center rounded-lg shadow-sm">
          <button
            className={`flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-l-lg focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
              viewType === "table"
                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-700"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() => setViewType("table")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            List
          </button>
          <button
            className={`flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-r-lg focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
              viewType === "cards"
                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-700"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() => setViewType("cards")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Cards
          </button>
        </div>

        {/* Filter dropdown */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
            >
              Filter
              <svg
                className="-mr-1 ml-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filter by Attributes</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="premium"
                  checked={filters.premium}
                  onCheckedChange={(checked) => 
                    onFilterChange("premium", checked === true)
                  }
                />
                <Label htmlFor="premium">Premium accounts only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="headless" 
                  checked={filters.headless}
                  onCheckedChange={(checked) => 
                    onFilterChange("headless", checked === true)
                  }
                />
                <Label htmlFor="headless">Has Headless</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="korblox"
                  checked={filters.korblox}
                  onCheckedChange={(checked) => 
                    onFilterChange("korblox", checked === true)
                  }
                />
                <Label htmlFor="korblox">Has Korblox</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minRobux">Minimum Robux: {filters.minRobux}</Label>
                <Slider
                  id="minRobux"
                  min={0}
                  max={10000}
                  step={100}
                  value={[filters.minRobux]}
                  onValueChange={(value) => onFilterChange("minRobux", value[0])}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort dropdown */}
        <Select
          value={sortBy}
          onValueChange={onSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="username">Username</SelectItem>
              <SelectItem value="robuxBalance">Robux Balance</SelectItem>
              <SelectItem value="pendingRobux">Pending Robux</SelectItem>
              <SelectItem value="rap">RAP</SelectItem>
              <SelectItem value="premium">Premium Status</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Export buttons */}
      <div className="flex space-x-2">
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
          onClick={handleExportTXT}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          TXT
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
          onClick={handleExportJSON}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          JSON
        </button>
      </div>
    </div>
  );
}
