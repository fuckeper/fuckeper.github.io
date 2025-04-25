import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./services/logger";

// Инициализация Express приложения
const app = express();

// Безопасность: Настройка защиты заголовков с Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://www.roblox.com"],
      connectSrc: ["'self'", "https://economy.roblox.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Безопасность: Защита от HTTP Parameter Pollution
app.use(hpp());

// Безопасность: Ограничение скорости запросов для предотвращения DDoS/Brute Force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов за 15 минут
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    status: 429, 
    message: "Too many requests, please try again later." 
  }
});

// Применяем лимитер только для API путей
app.use("/api", apiLimiter);

// Парсинг запросов
app.use(express.json({ limit: '2mb' })); // Ограничиваем размер JSON-запросов
app.use(express.urlencoded({ extended: false }));

// Безопасность: Добавляем базовый ID запроса для отслеживания
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = Math.random().toString(36).substring(2, 12);
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Middleware для логирования запросов
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Перехватываем метод json для логирования
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Логируем после завершения запроса
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // В продакшн окружении не логируем содержимое ответов
      if (app.get("env") === "development" && capturedJsonResponse) {
        // Маскируем конфиденциальные данные в логах
        const safeResponse = JSON.stringify(capturedJsonResponse)
          .replace(/"cookie":"[^"]{20,}"/g, '"cookie":"[MASKED]"');
        
        // Ограничиваем длину лога
        if (safeResponse.length < 200) {
          logLine += ` :: ${safeResponse}`;
        } else {
          logLine += ` :: ${safeResponse.substring(0, 100)}... (response truncated)`;
        }
      }
      
      // Используем улучшенное логирование
      logger.info('API Request', {
        method: req.method,
        path: path,
        status: res.statusCode,
        duration: duration,
        ip: req.ip,
        requestId: req.headers['x-request-id']
      });
      
      // Также логируем в консоль для совместимости
      log(logLine);
    }
  });

  next();
});

// Инициализация сервера
(async () => {
  // Регистрация маршрутов API
  const server = await registerRoutes(app);

  // Middleware для обработки 404
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      logger.warn('API endpoint not found', { path: req.path, method: req.method });
      return res.status(404).json({ 
        status: 404,
        message: "API endpoint not found" 
      });
    }
    next();
  });

  // Глобальный обработчик ошибок
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    logger.error('Uncaught server error', {
      status,
      message,
      path: req.path,
      method: req.method,
      error: err.stack || err.toString()
    });

    res.status(status).json({ 
      status,
      message,
      timestamp: new Date().toISOString()
    });
  });

  // Настройка Vite для клиентской части
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Запуск сервера
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Server started successfully`, { port, env: app.get("env") });
    log(`serving on port ${port}`);
  });
})();
