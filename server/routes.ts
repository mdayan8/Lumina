import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDataFileSchema, insertAnalysisSchema } from "@shared/schema";
import { FileProcessor } from "./services/file-processor";
import { DeepSeekClient } from "./services/deepseek-client";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // For demo purposes, using a default user ID
      // In production, this would come from authentication
      const userId = "demo-user";

      // Process the file
      const schema = await FileProcessor.processFile(req.file.buffer, req.file.originalname);

      // Create data file record
      const dataFile = await storage.createDataFile({
        userId,
        filename: `upload_${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        schema,
        rowCount: schema.totalRows,
      });

      res.json({
        success: true,
        file: dataFile,
        schema: schema,
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to process file'
      });
    }
  });

  // Get user's files
  app.get("/api/files", async (req, res) => {
    try {
      const userId = "demo-user"; // In production, get from auth
      const files = await storage.getDataFilesByUser(userId);
      res.json(files);
    } catch (error) {
      console.error('Get files error:', error);
      res.status(500).json({ error: 'Failed to retrieve files' });
    }
  });

  // Chat analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { fileId, query, apiKey } = req.body;

      if (!fileId || !query) {
        return res.status(400).json({ error: 'Missing fileId or query' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
      }

      const userId = "demo-user"; // In production, get from auth

      // Get the data file
      const dataFile = await storage.getDataFile(fileId);
      if (!dataFile || dataFile.userId !== userId) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Initialize DeepSeek client
      const deepSeekClient = new DeepSeekClient(apiKey);

      // Analyze the data
      const analysisResult = await deepSeekClient.analyzeData(query, {
        filename: dataFile.originalName,
        schema: dataFile.schema,
        rowCount: dataFile.rowCount || 0,
        previewData: (dataFile.schema as any)?.previewData || [],
      });

      // Save the analysis
      const analysis = await storage.createAnalysis({
        userId,
        fileId,
        query,
        response: analysisResult.response,
        insights: analysisResult.insights,
        chartData: analysisResult.chartData,
      });

      res.json({
        success: true,
        analysis: {
          ...analysis,
          ...analysisResult,
        },
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Analysis failed'
      });
    }
  });

  // Get user's analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const userId = "demo-user"; // In production, get from auth
      const analyses = await storage.getAnalysesByUser(userId);
      res.json(analyses);
    } catch (error) {
      console.error('Get analyses error:', error);
      res.status(500).json({ error: 'Failed to retrieve analyses' });
    }
  });

  // Generate suggestions for a file
  app.post("/api/suggestions", async (req, res) => {
    try {
      const { fileId, apiKey } = req.body;

      if (!fileId) {
        return res.status(400).json({ error: 'Missing fileId' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
      }

      const userId = "demo-user"; // In production, get from auth

      // Get the data file
      const dataFile = await storage.getDataFile(fileId);
      if (!dataFile || dataFile.userId !== userId) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Initialize DeepSeek client
      const deepSeekClient = new DeepSeekClient(apiKey);

      // Generate suggestions
      const suggestions = await deepSeekClient.generateSuggestions({
        filename: dataFile.originalName,
        schema: dataFile.schema,
        rowCount: dataFile.rowCount || 0,
        previewData: (dataFile.schema as any)?.previewData || [],
      });

      res.json({ suggestions });
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate suggestions'
      });
    }
  });

  // API key validation endpoint
  app.post("/api/validate-key", async (req, res) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }

      // Test the API key with a simple request
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        res.json({ valid: true });
      } else {
        res.json({ valid: false, error: 'Invalid API key' });
      }
    } catch (error) {
      console.error('API key validation error:', error);
      res.json({ valid: false, error: 'Failed to validate API key' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
