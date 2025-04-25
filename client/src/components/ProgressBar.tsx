interface ProgressBarProps {
  current: number;
  total: number;
  valid: number;
  invalid: number;
  percentage: number;
}

export default function ProgressBar({ current, total, valid, invalid, percentage }: ProgressBarProps) {
  const pending = total - valid - invalid;
  
  return (
    <div className="mt-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Processing {current} of {total} cookies
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-primary-600 h-2.5 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
        <div>
          <span className="font-medium text-success-500">{valid}</span> valid
        </div>
        <div>
          <span className="font-medium text-danger-500">{invalid}</span> invalid
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">{pending}</span> pending
        </div>
      </div>
    </div>
  );
}
