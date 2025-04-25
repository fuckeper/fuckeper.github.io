/**
 * Сервис для валидации и обработки куков Roblox
 */
import { RobloxAccount } from "@shared/types";
import { storage } from "../storage";
import { logger } from "./logger";
import { accountValidator } from "./accountValidator";
import { queueService } from "./queueService";

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
 * Валидирует куки, обрабатывает результаты и сохраняет их
 * @param cookies Массив куков для валидации
 * @returns Promise<void>
 */
export async function validateCookies(cookies: string[]): Promise<void> {
  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("Invalid or empty cookies array provided");
  }

  // Сбрасываем статус очереди
  queueService.resetStatus(cookies.length);
  
  // Добавляем задачи для проверки каждого куки
  for (const cookie of cookies) {
    queueService.enqueue(async () => {
      try {
        // Получаем информацию об аккаунте
        const accountInfo = await accountValidator.getAccountDetails(cookie);
        
        if (!accountInfo) {
          // Создаем и сохраняем невалидный аккаунт
          const invalidAccount = accountValidator.createInvalidAccount(cookie);
          await storage.storeCookie(invalidAccount);
          
          // Обновляем статус очереди
          queueService.processingComplete(false);
          
          // Добавляем запись в лог
          queueService.addLogEntry(`✗ Невалидный куки`);
          return;
        }
        
        // Сохраняем результат
        await storage.storeCookie(accountInfo);
        
        // Обновляем статус очереди
        queueService.processingComplete(true);
        
        // Добавляем запись в лог
        queueService.addLogEntry(
          `✓ Валидный: ${accountInfo.username} | R$: ${accountInfo.robuxBalance} | Premium: ${accountInfo.premium ? 'Да' : 'Нет'}`
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error validating cookie", { error: errorMessage });
        
        // Создаем и сохраняем невалидный аккаунт при ошибке
        const invalidAccount = accountValidator.createInvalidAccount(cookie);
        await storage.storeCookie(invalidAccount);
        
        // Обновляем статус очереди
        queueService.processingComplete(false);
        
        // Добавляем запись в лог
        queueService.addLogEntry(`✗ Ошибка проверки куки - ${errorMessage}`);
      }
    });
  }
  
  // Начинаем обработку очереди
  queueService.startProcessing();
}