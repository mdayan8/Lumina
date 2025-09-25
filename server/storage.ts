import { users, dataFiles, analyses, type User, type InsertUser, type DataFile, type InsertDataFile, type Analysis, type InsertAnalysis } from "@shared/schema";
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
}

export class DatabaseStorage implements IStorage {
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
    return await db.select().from(dataFiles).where(eq(dataFiles.userId, userId)).orderBy(desc(dataFiles.uploadedAt));
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
}

export const storage = new DatabaseStorage();
