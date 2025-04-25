import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCookieStore } from "@/hooks/useCookieStore";
import StatsPanel from "@/components/StatsPanel";
import ResultsControls from "@/components/ResultsControls";
import ResultsCards from "@/components/ResultsCards";
import ResultsTable from "@/components/ResultsTable";
import { RobloxAccount } from "@shared/types";

// View type for the results display
type ViewType = "cards" | "table";

// Sort options for the results
type SortOption = "username" | "robuxBalance" | "pendingRobux" | "rap" | "premium";

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { results } = useCookieStore();
  const [viewType, setViewType] = useState<ViewType>("cards");
  const [sortBy, setSortBy] = useState<SortOption>("robuxBalance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filteredResults, setFilteredResults] = useState<RobloxAccount[]>([]);
  const [filters, setFilters] = useState({
    premium: false,
    headless: false,
    korblox: false,
    minRobux: 0,
  });
  
  // Apply filters and sorting to the results
  useEffect(() => {
    if (!results.length) {
      setLocation("/");
      return;
    }
    
    let filtered = [...results];
    
    // Apply filters
    if (filters.premium) {
      filtered = filtered.filter(account => account.premium);
    }
    if (filters.headless) {
      filtered = filtered.filter(account => account.hasHeadless);
    }
    if (filters.korblox) {
      filtered = filtered.filter(account => account.hasKorblox);
    }
    if (filters.minRobux > 0) {
      filtered = filtered.filter(account => account.robuxBalance >= filters.minRobux);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "username":
          comparison = a.username.localeCompare(b.username);
          break;
        case "robuxBalance":
          comparison = a.robuxBalance - b.robuxBalance;
          break;
        case "pendingRobux":
          comparison = a.pendingRobux - b.pendingRobux;
          break;
        case "rap":
          comparison = a.rap - b.rap;
          break;
        case "premium":
          comparison = (a.premium ? 1 : 0) - (b.premium ? 1 : 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    setFilteredResults(filtered);
  }, [results, filters, sortBy, sortOrder, setLocation]);

  // Handle filter changes
  const handleFilterChange = (filterName: string, value: boolean | number) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Handle sort changes
  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      // Toggle order if same option is selected
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(option);
      setSortOrder("desc"); // Default to descending for new sort option
    }
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

      {/* Stats Summary Panel */}
      <StatsPanel accounts={results} />

      {/* Results Controls (View toggle, filters, sorting, export) */}
      <ResultsControls
        viewType={viewType}
        setViewType={setViewType}
        filters={filters}
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        accounts={filteredResults}
      />

      {/* Display results based on view type */}
      {viewType === "cards" ? (
        <ResultsCards accounts={filteredResults} />
      ) : (
        <ResultsTable
          accounts={filteredResults}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      )}
    </>
  );
}
