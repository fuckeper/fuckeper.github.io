import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ProgressBar from "@/components/ProgressBar";
import { useToast } from "@/hooks/use-toast";
import { useCookieStore } from "@/hooks/useCookieStore";
import { RobloxAccount } from "@shared/types";

export default function ProcessingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    cookies,
    cookiesCount,
    validCount,
    invalidCount,
    setResults,
    setProcessingStatus,
  } = useCookieStore();
  
  const [processedCount, setProcessedCount] = useState(0);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  
  // Calculate the progress percentage
  const progressPercentage = cookiesCount ? Math.round((processedCount / cookiesCount) * 100) : 0;
  
  // Create a mutation for validating cookies
  const validateMutation = useMutation({
    mutationFn: async (cookies: string[]) => {
      const response = await apiRequest("POST", "/api/validate", { cookies });
      return response.json();
    },
    onSuccess: (data: { accounts: RobloxAccount[] }) => {
      setResults(data.accounts);
      setLocation("/results");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to validate cookies: ${error.message}`,
        variant: "destructive",
      });
      setLocation("/");
    },
  });

  // Start the validation process when the component mounts
  useEffect(() => {
    if (!cookies.length) {
      setLocation("/");
      return;
    }

    const statusEventSource = new EventSource("/api/validate/status");
    
    statusEventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProcessedCount(data.processed);
      setProcessingStatus({
        validCount: data.valid,
        invalidCount: data.invalid,
      });
      
      if (data.latestLog) {
        setLogEntries((prev) => [data.latestLog, ...prev.slice(0, 49)]);
      }
      
      if (data.complete) {
        statusEventSource.close();
      }
    };
    
    statusEventSource.onerror = () => {
      statusEventSource.close();
    };
    
    // Start the validation process
    validateMutation.mutate(cookies);
    
    return () => {
      statusEventSource.close();
    };
  }, [cookies, setLocation, validateMutation, setProcessingStatus]);

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
            className="border-primary-500 text-primary-600 dark:text-primary-400 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            aria-current="page"
          >
            Processing
          </a>
          <a
            href="#"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            onClick={(e) => e.preventDefault()}
          >
            Results
          </a>
        </nav>
      </div>

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Processing Cookies
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Checking validity and collecting data for each cookie. This may take some time.
            </p>
          </div>

          <ProgressBar
            current={processedCount}
            total={cookiesCount}
            valid={validCount}
            invalid={invalidCount}
            percentage={progressPercentage}
          />

          {/* Processing details */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Processing Log
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 h-40 overflow-y-auto text-xs font-mono p-2 space-y-1">
              {logEntries.map((entry, index) => (
                <div
                  key={index}
                  className={
                    entry.includes("Valid")
                      ? "text-success-500"
                      : entry.includes("Invalid")
                      ? "text-danger-500"
                      : "text-gray-400 dark:text-gray-500"
                  }
                >
                  {entry}
                </div>
              ))}
              {logEntries.length === 0 && (
                <div className="text-gray-400 dark:text-gray-500">
                  Waiting for processing to begin...
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
              onClick={() => {
                validateMutation.reset();
                setLocation("/");
              }}
              disabled={validateMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
