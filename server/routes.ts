import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { validateCookies } from "./services/robloxService";
import { queueService } from "./services/queueService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // POST /api/validate - Validate cookies
  app.post("/api/validate", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        cookies: z.array(z.string()),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: validation.error.errors
        });
      }
      
      const { cookies } = validation.data;
      
      // Validate max number of cookies (1000)
      if (cookies.length > 1000) {
        return res.status(400).json({ 
          message: "Too many cookies. Maximum allowed is 1000." 
        });
      }
      
      // Start validating cookies asynchronously
      validateCookies(cookies);
      
      // Return the current status
      res.json({ 
        message: "Validation started",
        status: {
          total: cookies.length,
          processed: 0,
          valid: 0,
          invalid: 0
        }
      });
    } catch (error) {
      console.error("Error validating cookies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/validate/status - Get validation status (SSE)
  app.get("/api/validate/status", (req, res) => {
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    
    // Send initial status
    const initialStatus = queueService.getStatus();
    res.write(`data: ${JSON.stringify(initialStatus)}\n\n`);
    
    // Function to send updates
    const sendUpdate = () => {
      const status = queueService.getStatus();
      res.write(`data: ${JSON.stringify(status)}\n\n`);
      
      // If processing is complete, close the connection
      if (status.complete) {
        clearInterval(intervalId);
      }
    };
    
    // Set up interval to send updates
    const intervalId = setInterval(sendUpdate, 1000);
    
    // Clean up on client disconnect
    req.on("close", () => {
      clearInterval(intervalId);
    });
  });

  // GET /api/stats - Get validation statistics
  app.get("/api/stats", async (req, res) => {
    try {
      // Get all validated cookies
      const allCookies = await storage.getAllCookies();
      
      res.json({ accounts: allCookies });
    } catch (error) {
      console.error("Error getting statistics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
