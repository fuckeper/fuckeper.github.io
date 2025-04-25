import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define Cookie schema
export const cookies = pgTable("cookies", {
  id: serial("id").primaryKey(),
  cookie: text("cookie").notNull(),
  isValid: boolean("is_valid").default(false),
  username: text("username"),
  userId: text("user_id"),
  robuxBalance: integer("robux_balance").default(0),
  pendingRobux: integer("pending_robux").default(0),
  premium: boolean("premium").default(false),
  donations: integer("donations").default(0),
  rap: integer("rap").default(0),
  hasHeadless: boolean("has_headless").default(false),
  hasKorblox: boolean("has_korblox").default(false),
  avatarUrl: text("avatar_url"),
  processedAt: text("processed_at"),
});

// Create insert schema
export const insertCookieSchema = createInsertSchema(cookies).pick({
  cookie: true,
  isValid: true,
  username: true,
  userId: true,
  robuxBalance: true,
  pendingRobux: true,
  premium: true,
  donations: true,
  rap: true,
  hasHeadless: true,
  hasKorblox: true,
  avatarUrl: true,
  processedAt: true,
});

// Types
export type InsertCookie = z.infer<typeof insertCookieSchema>;
export type Cookie = typeof cookies.$inferSelect;
