import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { parseCookies } from "@/lib/cookieParser";
import { useCookieStore } from "@/hooks/useCookieStore";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onStartProcessing: () => void;
}

export default function FileUpload({ onStartProcessing }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { setCookies } = useCookieStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState(false);
  const [cookieCount, setCookieCount] = useState(0);
  
  // Handle file drop
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  
  // Process the uploaded file
  const processFile = (file: File) => {
    if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 1024 * 1024) { // 1MB limit
      toast({
        title: "File too large",
        description: "File size must be less than 1MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Read file contents
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const content = e.target.result as string;
        const cookies = parseCookies(content);
        
        if (cookies.length > 0) {
          setFile(file);
          setCookieCount(cookies.length);
          setCookies(cookies);
          setValidationError(false);
        } else {
          setValidationError(true);
          setFile(null);
          setCookieCount(0);
        }
      }
    };
    reader.readAsText(file);
  };
  
  // Handle file removal
  const handleRemoveFile = () => {
    setFile(null);
    setCookieCount(0);
    setValidationError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Start processing the cookies
  const handleStartProcessing = () => {
    if (cookieCount > 0) {
      onStartProcessing();
    }
  };

  return (
    <div className="mt-6">
      {/* Drag and drop area */}
      <div
        className={`border-2 border-dashed ${
          isDragging
            ? "border-primary-500 dark:border-primary-400"
            : "border-gray-300 dark:border-gray-600"
        } rounded-lg p-12 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-200 cursor-pointer`}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="flex text-sm text-gray-600 dark:text-gray-400">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus-within:outline-none"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".txt"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Only .txt files up to 1MB
          </p>
        </div>
      </div>

      {/* File upload status - shown when file is selected */}
      {file && !validationError && (
        <div className="mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between items-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {file.name}
                </p>
                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    {cookieCount}
                  </span>{" "}
                  cookies found
                </p>
              </div>
              <button
                className="ml-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                <span className="sr-only">Remove file</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation error message - shown when file is invalid */}
      {validationError && (
        <div className="mt-6">
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400 dark:text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Invalid file format
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>
                    No valid Roblox cookies found in the uploaded file. Please make sure
                    your file contains cookies starting with{" "}
                    <code className="text-xs bg-red-100 dark:bg-red-800 px-1 py-0.5 rounded">
                      ._|WARNING:-DO-NOT-SHARE-THIS...
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!file || validationError}
          onClick={handleStartProcessing}
        >
          Start Processing
        </button>
      </div>
    </div>
  );
}
