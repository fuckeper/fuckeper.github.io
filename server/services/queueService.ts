import { ProcessingStatus } from "@shared/types";

class QueueService {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing: boolean = false;
  private delayMs: number = 1500; // Delay between API requests (1.5 seconds)
  private status: ProcessingStatus = {
    processed: 0,
    total: 0,
    valid: 0,
    invalid: 0,
    complete: false,
  };
  private logEntries: string[] = [];

  /**
   * Add a task to the queue
   * @param task Function to execute
   */
  enqueue(task: () => Promise<void>): void {
    this.queue.push(task);
  }

  /**
   * Start processing the queue
   */
  startProcessing(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processNext();
  }

  /**
   * Process the next item in the queue
   */
  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.status.complete = true;
      return;
    }

    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("Error processing queue task:", error);
      }

      // Add delay before processing next item
      setTimeout(() => {
        this.processNext();
      }, this.delayMs);
    }
  }

  /**
   * Reset the queue status
   * @param total Total number of items to process
   */
  resetStatus(total: number): void {
    this.status = {
      processed: 0,
      total,
      valid: 0,
      invalid: 0,
      complete: false,
    };
    this.logEntries = [];
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Update status when processing is complete for an item
   * @param isValid Whether the processed item is valid
   */
  processingComplete(isValid: boolean): void {
    this.status.processed++;
    if (isValid) {
      this.status.valid++;
    } else {
      this.status.invalid++;
    }
  }

  /**
   * Add a log entry
   * @param entry Log entry text
   */
  addLogEntry(entry: string): void {
    this.logEntries.unshift(entry);
    if (this.logEntries.length > 50) {
      this.logEntries.pop();
    }
    this.status.latestLog = entry;
  }

  /**
   * Get the current status
   * @returns Current processing status
   */
  getStatus(): ProcessingStatus {
    return {
      ...this.status,
      complete: this.status.processed >= this.status.total,
    };
  }

  /**
   * Get all log entries
   * @returns Array of log entries
   */
  getLogs(): string[] {
    return [...this.logEntries];
  }

  /**
   * Set the delay between API requests
   * @param delayMs Delay in milliseconds
   */
  setDelay(delayMs: number): void {
    this.delayMs = delayMs;
  }
}

// Export a singleton instance
export const queueService = new QueueService();
