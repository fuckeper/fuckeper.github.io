import { ProcessingStatus } from "@shared/types";
import { logger } from "./logger";

/**
 * Улучшенный сервис очереди с поддержкой параллельной обработки
 */
class QueueService {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing: boolean = false;
  private delayMs: number = 1500; // Задержка между запросами API (1.5 секунды по умолчанию)
  private concurrency: number = 3;  // Количество параллельных обработчиков (по умолчанию 3)
  private status: ProcessingStatus = {
    processed: 0,
    total: 0,
    valid: 0,
    invalid: 0,
    complete: false
  };
  private logEntries: string[] = [];
  private activeWorkers: number = 0;

  /**
   * Добавить задачу в очередь
   * @param task Функция для выполнения
   */
  enqueue(task: () => Promise<void>): void {
    this.queue.push(task);
  }

  /**
   * Начать обработку очереди
   */
  startProcessing(): void {
    if (this.isProcessing) return;
    
    logger.info('Starting queue processing', { 
      queueSize: this.queue.length,
      concurrency: this.concurrency
    });
    
    this.isProcessing = true;
    this.status.complete = false;
    
    // Запускаем несколько обработчиков в зависимости от настройки concurrency
    for (let i = 0; i < this.concurrency; i++) {
      this.startWorker(i);
    }
  }

  /**
   * Запустить воркера для обработки задач
   * @param workerId ID обработчика
   */
  private async startWorker(workerId: number): Promise<void> {
    this.activeWorkers++;
    logger.debug(`Worker ${workerId} started`);
    
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      
      if (task) {
        try {
          await task();
          
          // Добавляем случайную задержку между запросами,
          // чтобы равномерно распределить нагрузку на API и избежать блокировки
          const randomDelay = this.delayMs + Math.floor(Math.random() * 500);
          await new Promise(resolve => setTimeout(resolve, randomDelay));
        } catch (error) {
          logger.error(`Error processing task in worker ${workerId}`, { 
            error: error.message || 'Unknown error'
          });
        }
      }
    }
    
    this.activeWorkers--;
    logger.debug(`Worker ${workerId} finished`);
    
    // Если все обработчики завершили работу, завершаем обработку
    if (this.activeWorkers === 0) {
      this.completeProcessing();
    }
  }

  /**
   * Завершить обработку очереди
   */
  private completeProcessing(): void {
    this.isProcessing = false;
    this.status.complete = true;
    logger.info("All tasks processed", { 
      processed: this.status.processed,
      valid: this.status.valid,
      invalid: this.status.invalid
    });
  }

  /**
   * Сбросить статус очереди
   * @param total Общее количество элементов для обработки
   */
  resetStatus(total: number): void {
    this.status = {
      processed: 0,
      total,
      valid: 0,
      invalid: 0,
      complete: false
    };
    this.logEntries = [];
    logger.info('Queue status reset', { total });
  }

  /**
   * Обновить статус при завершении обработки элемента
   * @param isValid Является ли обработанный элемент валидным
   */
  processingComplete(isValid: boolean): void {
    this.status.processed++;
    isValid ? this.status.valid++ : this.status.invalid++;
    
    // Логируем прогресс каждые 10 обработанных элементов
    if (this.status.processed % 10 === 0 || this.status.processed === this.status.total) {
      logger.info('Processing progress', {
        processed: this.status.processed,
        total: this.status.total,
        valid: this.status.valid,
        invalid: this.status.invalid,
        percent: Math.round((this.status.processed / this.status.total) * 100)
      });
    }
  }

  /**
   * Добавить запись в лог
   * @param entry Текст записи в логе
   */
  addLogEntry(entry: string): void {
    this.logEntries.push(entry);
    this.status.latestLog = entry;
    
    // Ограничиваем размер лога до 1000 записей
    if (this.logEntries.length > 1000) {
      this.logEntries.shift();
    }
  }

  /**
   * Получить текущий статус
   * @returns Текущий статус обработки
   */
  getStatus(): ProcessingStatus {
    return { ...this.status };
  }

  /**
   * Получить все записи лога
   * @returns Массив записей лога
   */
  getLogs(): string[] {
    return [...this.logEntries];
  }

  /**
   * Установить задержку между запросами API
   * @param delayMs Задержка в миллисекундах
   */
  setDelay(delayMs: number): void {
    this.delayMs = Math.max(500, Math.min(delayMs, 5000)); // Минимум 500мс, максимум 5000мс
    logger.info('Queue delay updated', { delayMs: this.delayMs });
  }

  /**
   * Установить количество параллельных обработчиков
   * @param concurrency Количество параллельных обработчиков
   */
  setConcurrency(concurrency: number): void {
    this.concurrency = Math.max(1, Math.min(concurrency, 10)); // Минимум 1, максимум 10
    logger.info('Queue concurrency updated', { concurrency: this.concurrency });
  }
  
  /**
   * Очистить все задачи и сбросить очередь
   */
  clearQueue(): void {
    const taskCount = this.queue.length;
    this.queue = [];
    this.status.complete = true;
    logger.info('Queue cleared', { droppedTasks: taskCount });
  }
}

// Экспортируем единственный экземпляр сервиса очереди
export const queueService = new QueueService();