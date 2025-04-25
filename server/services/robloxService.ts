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

// Хранилище для проверки уникальности куков
const processedCookies = new Set<string>();

/**
 * Валидирует куки, обрабатывает результаты и сохраняет их
 * @param cookies Массив куков для валидации
 * @returns Promise<void>
 */
export async function validateCookies(cookies: string[]): Promise<void> {
  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("Invalid or empty cookies array provided");
  }

  // Удаляем дубликаты куков из массива (преобразуя в массив и обратно)
  const uniqueCookies = Array.from(new Set(cookies));
  
  // Фильтруем куки, которые уже обрабатывались
  const newCookies = uniqueCookies.filter(cookie => !processedCookies.has(cookie));
  
  // Логируем информацию о дубликатах
  if (uniqueCookies.length < cookies.length) {
    logger.info('Duplicate cookies removed', { 
      initialCount: cookies.length, 
      uniqueCount: uniqueCookies.length 
    });
  }
  
  // Логируем информацию о ранее обработанных куках
  if (newCookies.length < uniqueCookies.length) {
    logger.info('Previously processed cookies skipped', { 
      uniqueCount: uniqueCookies.length, 
      newCount: newCookies.length 
    });
  }
  
  // Если все куки уже обработаны, возвращаем сообщение
  if (newCookies.length === 0) {
    logger.info('All cookies have been already processed');
    return;
  }
  
  // Добавляем все новые куки в список обработанных
  newCookies.forEach(cookie => processedCookies.add(cookie));
  
  // Сбрасываем статус очереди с правильным количеством
  queueService.resetStatus(newCookies.length);
  
  // Хранилище уже проверенных userId чтобы избежать дублей при сохранении
  const processedUserIds = new Set<string>();
  
  // Добавляем задачи для проверки каждого куки
  for (const cookie of newCookies) {
    queueService.enqueue(async () => {
      try {
        // Получаем информацию об аккаунте
        const accountInfo = await accountValidator.getAccountDetails(cookie);
        
        if (!accountInfo) {
          // Создаем и сохраняем невалидный аккаунт
          const invalidAccount = accountValidator.createInvalidAccount(cookie);
          const isNew = await storage.storeCookie(invalidAccount);
          
          // Обновляем статус очереди только если это новый куки
          if (isNew) {
            queueService.processingComplete(false);
            
            // Добавляем запись в лог
            queueService.addLogEntry(`✗ Невалидный куки`);
          } else {
            // Если куки уже был обработан, просто логируем это
            logger.debug('Duplicate invalid cookie skipped');
          }
          return;
        }
        
        // Проверяем, не обрабатывали ли мы уже этот userId
        if (accountInfo.userId && processedUserIds.has(accountInfo.userId)) {
          logger.info('Duplicate userId found', { 
            userId: accountInfo.userId,
            username: accountInfo.username
          });
          
          // Обновляем статус очереди, но не сохраняем дубликат
          queueService.processingComplete(true);
          
          // Добавляем запись в лог с пометкой о дубликате
          queueService.addLogEntry(
            `✓ Дубликат: ${accountInfo.username} | R$: ${accountInfo.robuxBalance} | Premium: ${accountInfo.premium ? 'Да' : 'Нет'}`
          );
          return;
        }
        
        // Добавляем userId в список обработанных
        if (accountInfo.userId) {
          processedUserIds.add(accountInfo.userId);
        }
        
        // Сохраняем результат и проверяем, был ли куки новым
        const isNew = await storage.storeCookie(accountInfo);
        
        // Обновляем статус очереди только если это новый куки
        if (isNew) {
          queueService.processingComplete(true);
          
          // Добавляем запись в лог
          queueService.addLogEntry(
            `✓ Валидный: ${accountInfo.username} | R$: ${accountInfo.robuxBalance} | Premium: ${accountInfo.premium ? 'Да' : 'Нет'}`
          );
        } else {
          // Если куки уже был обработан, просто логируем это
          logger.debug('Duplicate valid cookie skipped', {
            username: accountInfo.username
          });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error validating cookie", { error: errorMessage });
        
        // Создаем и сохраняем невалидный аккаунт при ошибке
        const invalidAccount = accountValidator.createInvalidAccount(cookie);
        const isNew = await storage.storeCookie(invalidAccount);
        
        // Обновляем статус очереди только если это новый куки
        if (isNew) {
          queueService.processingComplete(false);
          
          // Добавляем запись в лог
          queueService.addLogEntry(`✗ Ошибка проверки куки - ${errorMessage}`);
        } else {
          // Если куки уже был обработан, просто логируем это
          logger.debug('Duplicate invalid cookie with error skipped');
        }
      }
    });
  }
  
  // Начинаем обработку очереди
  queueService.startProcessing();
}