/**
 * Сервис логирования с безопасной обработкой чувствительных данных
 */

/**
 * Маскирует куки для безопасного логирования
 * @param cookie Roblox cookie
 * @returns Замаскированная версия куки
 */
export function maskCookie(cookie: string): string {
  if (!cookie || typeof cookie !== 'string' || cookie.length < 20) {
    return '[invalid_cookie]';
  }
  
  // Маскируем большую часть куки, оставляя только начало и конец
  return cookie.substring(0, 10) + '...' + cookie.substring(cookie.length - 5);
}

/**
 * Безопасно форматирует данные для логирования, маскируя чувствительную информацию
 * @param data Данные для логирования
 * @returns Безопасная версия данных
 */
function sanitizeData(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'object') {
    const result: Record<string, any> = Array.isArray(data) ? [] : {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (key === 'cookie' && typeof data[key] === 'string') {
          result[key] = maskCookie(data[key]);
        } else if (typeof data[key] === 'object') {
          result[key] = sanitizeData(data[key]);
        } else {
          result[key] = data[key];
        }
      }
    }
    
    return result;
  }
  
  return data;
}

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

/**
 * Логгер с уровнями и форматированием
 */
class Logger {
  private static readonly LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };
  
  private level: number = Logger.LEVELS.INFO;
  
  /**
   * Установить уровень логирования
   * @param level Уровень логирования
   */
  setLevel(level: LogLevel): void {
    this.level = Logger.LEVELS[level] || Logger.LEVELS.INFO;
  }
  
  /**
   * Внутренний метод для логирования
   * @param level Уровень лога
   * @param message Сообщение
   * @param data Дополнительные данные
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (Logger.LEVELS[level] > this.level) return;
    
    const timestamp = new Date().toISOString();
    const safeData = data ? sanitizeData(data) : undefined;
    
    // Форматируем лог
    const logEntry = {
      timestamp,
      level,
      message,
      ...(safeData ? { data: safeData } : {})
    };
    
    // Выводим лог в соответствии с уровнем
    switch(level) {
      case 'ERROR':
        console.error(JSON.stringify(logEntry));
        break;
      case 'WARN':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'DEBUG':
        console.debug(JSON.stringify(logEntry));
        break;
      default:
        console.log(JSON.stringify(logEntry));
    }
  }
  
  /**
   * Логировать ошибку
   * @param message Сообщение об ошибке
   * @param data Дополнительные данные
   */
  error(message: string, data?: any): void {
    this.log('ERROR', message, data);
  }
  
  /**
   * Логировать предупреждение
   * @param message Предупреждающее сообщение
   * @param data Дополнительные данные
   */
  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }
  
  /**
   * Логировать информационное сообщение
   * @param message Информационное сообщение
   * @param data Дополнительные данные
   */
  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }
  
  /**
   * Логировать отладочное сообщение
   * @param message Отладочное сообщение
   * @param data Дополнительные данные
   */
  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
  }
}

// Экспортируем единственный экземпляр логгера
export const logger = new Logger();