import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { itemsTable } from "./items";

export const claimsTable = pgTable("claims", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => itemsTable.id),
  claimerId: integer("claimer_id").notNull().references(() => usersTable.id),
  message: text("message").notNull(),
  otp: text("otp").notNull(),
  status: text("status").notNull().default("pending"), // pending | verified | rejected
  flagged: boolean("flagged").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({ id: true, createdAt: true });
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;
