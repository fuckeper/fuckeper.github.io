import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { validateCookies } from "./services/robloxService";
import { queueService } from "./services/queueService";
import { logger, maskCookie } from "./services/logger";
import { RobloxAccount } from "@shared/types";

/**
 * Middleware для обработки ошибок
 */
function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error('API Error', { 
    path: req.path,
    method: req.method,
    status,
    error: message,
    stack: err.stack
  });
  
  res.status(status).json({
    error: {
      message: message,
      status: status
    }
  });
}

/**
 * Схема для валидации запроса на проверку куков
 * Roblox cookies могут достигать 4000+ символов
 */
const cookiesValidationSchema = z.object({
  cookies: z.array(z.string().min(20).max(5000)).min(1).max(1000)
});

/**
 * Возвращает полную информацию об аккаунте, включая полный кук
 * @param account Информация об аккаунте
 * @returns Полная версия объекта для возврата клиенту
 */
function sanitizeAccountForResponse(account: RobloxAccount): RobloxAccount {
  // Возвращаем полный объект аккаунта включая куки
  return {
    ...account
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Создаем HTTP сервер
  const httpServer = createServer(app);

  // Middleware для CORS
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Защита от дублирования запросов на валидацию
  const activeValidationRequests = new Set<string>();
  
  // POST /api/validate - Валидация куков
  app.post("/api/validate", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Логируем информацию о запросе с уникальным requestId для отслеживания
      const requestId = Math.random().toString(36).substring(2, 10);
      logger.info('Validate request received', { 
        ip: req.ip, 
        contentLength: req.headers['content-length'],
        requestId
      });
      
      // Проверка на дублирование запросов - защита на уровне middleware
      const requestSignature = JSON.stringify(req.body);
      if (activeValidationRequests.has(requestSignature)) {
        logger.warn('Duplicate validation request detected', {
          ip: req.ip,
          requestId
        });
        
        return res.status(429).json({
          message: "A validation request with identical cookies is already being processed",
          status: queueService.getStatus()
        });
      }
      
      // Добавляем запрос в активные
      activeValidationRequests.add(requestSignature);
      
      // Автоматическое удаление из списка активных запросов при завершении
      res.on('finish', () => {
        activeValidationRequests.delete(requestSignature);
      });
      
      // Валидируем тело запроса
      const validation = cookiesValidationSchema.safeParse(req.body);
      
      if (!validation.success) {
        logger.warn('Invalid validation request', { 
          errors: validation.error.errors,
          requestId 
        });
        
        return res.status(400).json({ 
          message: "Invalid request format",
          errors: validation.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      const { cookies } = validation.data;
      
      // Логируем количество куков (без самих значений!)
      logger.info('Starting cookie validation', { 
        count: cookies.length
      });
      
      // Начинаем асинхронную валидацию куков
      await validateCookies(cookies);
      
      // Возвращаем текущий статус
      const currentStatus = queueService.getStatus();
      
      res.json({ 
        message: "Validation process started",
        status: currentStatus
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/validate/status - Получение статуса валидации (SSE)
  app.get("/api/validate/status", (req: Request, res: Response) => {
    // Устанавливаем заголовки для SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    
    logger.info('SSE connection established', { 
      ip: req.ip 
    });
    
    // Отправляем начальный статус
    const initialStatus = queueService.getStatus();
    res.write(`data: ${JSON.stringify(initialStatus)}\n\n`);
    
    // Функция для отправки обновлений
    const sendUpdate = () => {
      try {
        const status = queueService.getStatus();
        res.write(`data: ${JSON.stringify(status)}\n\n`);
        
        // Если обработка завершена, закрываем соединение
        if (status.complete) {
          clearInterval(intervalId);
          logger.info('SSE connection completed', { 
            status: 'complete',
            valid: status.valid,
            invalid: status.invalid,
            total: status.total
          });
        }
      } catch (error) {
        logger.error('Error sending SSE update', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        clearInterval(intervalId);
      }
    };
    
    // Устанавливаем интервал для отправки обновлений
    const intervalId = setInterval(sendUpdate, 1000);
    
    // Очищаем при отключении клиента
    req.on("close", () => {
      clearInterval(intervalId);
      logger.info('SSE connection closed by client', { ip: req.ip });
    });
  });

  // GET /api/stats - Получение статистики валидации
  app.get("/api/stats", async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Stats request received', { ip: req.ip });
      
      // Получаем все валидированные куки
      const allAccounts = await storage.getAllCookies();
      
      // Безопасно возвращаем данные, маскируя куки
      const safeAccounts = allAccounts.map(sanitizeAccountForResponse);
      
      res.json({ 
        accounts: safeAccounts,
        stats: {
          total: allAccounts.length,
          valid: allAccounts.filter(a => a.isValid).length,
          invalid: allAccounts.filter(a => !a.isValid).length,
          premium: allAccounts.filter(a => a.isValid && a.premium).length,
          totalRobux: allAccounts.reduce((sum, a) => sum + (a.isValid ? a.robuxBalance : 0), 0),
          // Добавляем информацию о пожертвованиях, ожидающих средствах и билинге
          totalDonations: allAccounts.reduce((sum, a) => sum + (a.isValid && a.donations ? a.donations : 0), 0),
          totalPendingRobux: allAccounts.reduce((sum, a) => sum + (a.isValid && a.pendingRobux ? a.pendingRobux : 0), 0),
          totalBilling: allAccounts.reduce((sum, a) => {
            // В данном случае билинг - это сумма пожертвований и основного баланса робуксов
            const donationsValue = a.isValid && a.donations ? a.donations : 0;
            const robuxValue = a.isValid ? a.robuxBalance : 0;
            return sum + donationsValue + robuxValue;
          }, 0)
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // DELETE /api/clear - Очистить все данные (куки, статусы)
  app.delete("/api/clear", async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Clear request received', { ip: req.ip });
      
      // Очищаем хранилище куков
      await storage.clearAllCookies();
      
      // Очищаем очередь задач
      queueService.clearQueue();
      
      res.json({ 
        message: "All data cleared successfully" 
      });
    } catch (error) {
      next(error);
    }
  });
  
  // GET /api/logs - Получение логов обработки
  app.get("/api/logs", (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Logs request received', { ip: req.ip });
      
      const logs = queueService.getLogs();
      
      res.json({ 
        logs,
        count: logs.length 
      });
    } catch (error) {
      next(error);
    }
  });

  // Middleware для обработки ошибок (должен быть последним)
  app.use(errorHandler);

  return httpServer;
}
