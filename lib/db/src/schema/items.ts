import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const itemTypeEnum = pgEnum("item_type", ["lost", "found"]);
export const itemStatusEnum = pgEnum("item_status", ["active", "claimed", "returned"]);

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  type: itemTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  status: itemStatusEnum("status").notNull().default("active"),
  reportedBy: integer("reported_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({ id: true, createdAt: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
