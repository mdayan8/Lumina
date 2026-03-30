import {
  users, dataFiles, analyses, agentSessions, codeExecutions, reports, auditLogs,
  type User, type InsertUser, type DataFile, type InsertDataFile, type Analysis, type InsertAnalysis,
  type AgentSession, type InsertAgentSession, type CodeExecution, type Report, type AuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserApiKey(userId: string, apiKey: string): Promise<void>;

  createDataFile(dataFile: InsertDataFile): Promise<DataFile>;
  getDataFile(id: string): Promise<DataFile | undefined>;
  getDataFilesByUser(userId: string): Promise<DataFile[]>;

  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysesByUser(userId: string): Promise<Analysis[]>;
  getAnalysesByFile(fileId: string): Promise<Analysis[]>;
  getAnalysisById(id: string): Promise<Analysis | undefined>;
  deleteAnalysis(id: string): Promise<void>;

  // Agent methods
  createAgentSession(session: InsertAgentSession): Promise<AgentSession>;
  getAgentSession(id: string): Promise<AgentSession | undefined>;
  getAgentSessionsByUser(userId: string): Promise<AgentSession[]>;
  getAgentSessionsByFile(fileId: string): Promise<AgentSession[]>;
  updateAgentSession(id: string, updates: Partial<AgentSession>): Promise<AgentSession>;

  createCodeExecution(execution: any): Promise<CodeExecution>;
  getCodeExecutionsBySession(sessionId: string): Promise<CodeExecution[]>;

  createReport(report: any): Promise<Report>;
  getReportsBySession(sessionId: string): Promise<Report[]>;

  createAuditLog(log: any): Promise<AuditLog>;
  deleteAgentSession(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async deleteAgentSession(id: string): Promise<void> {
    await db.delete(agentSessions).where(eq(agentSessions.id, id));
  }
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserApiKey(userId: string, apiKey: string): Promise<void> {
    await db.update(users).set({ apiKey }).where(eq(users.id, userId));
  }

  async createDataFile(insertDataFile: InsertDataFile): Promise<DataFile> {
    const [dataFile] = await db.insert(dataFiles).values(insertDataFile).returning();
    return dataFile;
  }

  async getDataFile(id: string): Promise<DataFile | undefined> {
    const [dataFile] = await db.select().from(dataFiles).where(eq(dataFiles.id, id));
    return dataFile || undefined;
  }

  async getDataFilesByUser(userId: string): Promise<DataFile[]> {
    try {
      return await db.select().from(dataFiles).where(eq(dataFiles.userId, userId)).orderBy(desc(dataFiles.uploadedAt));
    } catch (error) {
      console.error('Error fetching data files:', error);
      return [];
    }
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db.insert(analyses).values(insertAnalysis).returning();
    return analysis;
  }

  async getAnalysesByUser(userId: string): Promise<Analysis[]> {
    return await db.select().from(analyses).where(eq(analyses.userId, userId)).orderBy(desc(analyses.createdAt));
  }

  async getAnalysesByFile(fileId: string): Promise<Analysis[]> {
    return await db.select().from(analyses).where(eq(analyses.fileId, fileId)).orderBy(desc(analyses.createdAt));
  }

  async getAnalysisById(id: string): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis || undefined;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await db.delete(analyses).where(eq(analyses.id, id));
  }

  // Agent methods implementation
  async createAgentSession(session: InsertAgentSession): Promise<AgentSession> {
    const [newSession] = await db.insert(agentSessions).values(session).returning();
    return newSession;
  }

  async getAgentSession(id: string): Promise<AgentSession | undefined> {
    const [session] = await db.select().from(agentSessions).where(eq(agentSessions.id, id));
    return session || undefined;
  }

  async getAgentSessionsByUser(userId: string): Promise<AgentSession[]> {
    return await db.select().from(agentSessions).where(eq(agentSessions.userId, userId)).orderBy(desc(agentSessions.createdAt));
  }

  async updateAgentSession(id: string, updates: Partial<AgentSession>): Promise<AgentSession> {
    const [updatedSession] = await db.update(agentSessions).set(updates).where(eq(agentSessions.id, id)).returning();
    return updatedSession;
  }

  async getAgentSessionsByFile(fileId: string): Promise<AgentSession[]> {
    return await db.select().from(agentSessions).where(eq(agentSessions.fileId, fileId)).orderBy(desc(agentSessions.createdAt));
  }

  async createCodeExecution(execution: any): Promise<CodeExecution> {
    const [newExecution] = await db.insert(codeExecutions).values(execution).returning();
    return newExecution;
  }

  async getCodeExecutionsBySession(sessionId: string): Promise<CodeExecution[]> {
    return await db.select().from(codeExecutions).where(eq(codeExecutions.sessionId, sessionId)).orderBy(desc(codeExecutions.createdAt));
  }

  async createReport(report: any): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReportsBySession(sessionId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.sessionId, sessionId)).orderBy(desc(reports.createdAt));
  }

  async createAuditLog(log: any): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();