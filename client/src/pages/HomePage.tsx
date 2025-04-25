import { useEffect } from "react";
import { useLocation } from "wouter";
import FileUpload from "@/components/FileUpload";
import { useCookieStore } from "@/hooks/useCookieStore";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { clearAllData } = useCookieStore();
  
  // Clear previous data when returning to the home page
  useEffect(() => {
    clearAllData();
  }, [clearAllData]);

  // Navigation tabs with active state
  return (
    <>
      {/* Tabs for navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <a
            href="#"
            className="border-primary-500 text-primary-600 dark:text-primary-400 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            aria-current="page"
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
              Upload Your Cookies.txt File
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              The file should contain Roblox cookies starting with{" "}
              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                ._|WARNING:-DO-NOT-SHARE-THIS...
              </code>
            </p>
          </div>

          <FileUpload
            onStartProcessing={() => setLocation("/processing")}
          />
        </div>
      </section>
    </>
  );
}
