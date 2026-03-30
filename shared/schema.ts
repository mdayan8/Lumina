import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key"),
  role: text("role").default("user"),
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

// Agent System Tables

export const agentSessions = pgTable("agent_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").references(() => dataFiles.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull(), // 'athena', 'scribe', 'orchestrator'
  status: text("status").notNull(), // 'running', 'completed', 'failed', 'waiting_user'
  metadata: jsonb("metadata"), // Session context, params
  results: jsonb("results"), // Final outputs
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const codeExecutions = pgTable("code_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => agentSessions.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  language: text("language").notNull().default("python"),
  status: text("status").notNull(), // 'pending', 'running', 'success', 'error'
  output: jsonb("output"), // Stdout, stderr, return values
  error: text("error"),
  executionTime: integer("execution_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => agentSessions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  format: text("format").notNull(), // 'pdf', 'docx', 'slides'
  content: jsonb("content"), // Structured report content
  fileUrl: text("file_url"), // Path to generated file
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  agentType: text("agent_type"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations

export const usersRelations = relations(users, ({ many }) => ({
  dataFiles: many(dataFiles),
  analyses: many(analyses),
  agentSessions: many(agentSessions),
  auditLogs: many(auditLogs),
}));

export const dataFilesRelations = relations(dataFiles, ({ one, many }) => ({
  user: one(users, {
    fields: [dataFiles.userId],
    references: [users.id],
  }),
  analyses: many(analyses),
  agentSessions: many(agentSessions),
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

export const agentSessionsRelations = relations(agentSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [agentSessions.userId],
    references: [users.id],
  }),
  dataFile: one(dataFiles, {
    fields: [agentSessions.fileId],
    references: [dataFiles.id],
  }),
  codeExecutions: many(codeExecutions),
  reports: many(reports),
}));

export const codeExecutionsRelations = relations(codeExecutions, ({ one }) => ({
  session: one(agentSessions, {
    fields: [codeExecutions.sessionId],
    references: [agentSessions.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  session: one(agentSessions, {
    fields: [reports.sessionId],
    references: [agentSessions.id],
  }),
}));

// Schemas for Insert

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

export const insertAgentSessionSchema = createInsertSchema(agentSessions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDataFile = z.infer<typeof insertDataFileSchema>;
export type DataFile = typeof dataFiles.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAgentSession = z.infer<typeof insertAgentSessionSchema>;
export type AgentSession = typeof agentSessions.$inferSelect;
export type CodeExecution = typeof codeExecutions.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
