import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dataFiles = pgTable("data_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  schema: jsonb("schema"),
  rowCount: integer("row_count"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => dataFiles.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  response: text("response").notNull(),
  insights: jsonb("insights"),
  chartData: jsonb("chart_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  dataFiles: many(dataFiles),
  analyses: many(analyses),
}));

export const dataFilesRelations = relations(dataFiles, ({ one, many }) => ({
  user: one(users, {
    fields: [dataFiles.userId],
    references: [users.id],
  }),
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  user: one(users, {
    fields: [analyses.userId],
    references: [users.id],
  }),
  dataFile: one(dataFiles, {
    fields: [analyses.fileId],
    references: [dataFiles.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDataFileSchema = createInsertSchema(dataFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDataFile = z.infer<typeof insertDataFileSchema>;
export type DataFile = typeof dataFiles.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
