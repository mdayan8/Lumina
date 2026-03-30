import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDataFileSchema, insertAnalysisSchema } from "@shared/schema";
import { agentOrchestrator } from "./services/agent-orchestrator";
import { athenaAgent } from "./services/athena-agent";
import { scribeAgent } from "./services/scribe-agent";
import { vizAgent } from "./services/viz-agent";
import { sqlAgent } from "./services/sql-agent";
import { dbConnector } from "./services/db-connector-agent";
import { googleSheetsConnector } from "./services/google-sheets-connector";
import { apiConnector } from "./services/api-connector";
import { RecommendationEngine } from "./services/recommendation-engine";
import { PythonExecutor } from "./services/python-executor";
import { AuthService } from "./services/auth-service";
import { FileProcessor } from "./services/file-processor";
import { AgentOrchestrator } from "./services/agent-orchestrator";
import { DeepSeekClient } from "./services/deepseek-client";
import { dataCleanAgent } from "./services/data-clean-agent";
import multer from "multer";

import * as fs from 'fs';
import * as path from 'path';

// Configure multer for file uploads
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storageConfig,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    // Also allow files with CSV extension regardless of MIME type
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (allowedTypes.includes(file.mimetype) || fileExtension === 'csv') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
});

// Middleware to authenticate requests
const authenticate = async (req: Request, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const result = await AuthService.verifyToken(token);

    if (!result.success) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    (req as any).user = result.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        console.log('Signup validation failed:', { username, email, password });
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }

      console.log('Attempting to register user:', { username, email });
      const result = await AuthService.register(username, email, password);
      console.log('Registration result:', result);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.login(email, password);
      res.status(result.success ? 200 : 401).json(result);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // File upload endpoint
  app.post("/api/upload", authenticate, upload.single('file'), async (req, res) => {
    try {
      console.log('Upload request received');
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('File uploaded to:', req.file.path);
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const userId = (req as any).user.id;

      // Process the file
      console.log('Processing file...');
      const schema = await FileProcessor.processFile(req.file.path, req.file.originalname);
      console.log('File processed successfully. Schema:', JSON.stringify(schema, null, 2));

      // Create data file record
      console.log('Creating database record...');
      const dataFile = await storage.createDataFile({
        userId,
        filename: req.file.path, // Store full path
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        schema,
        rowCount: schema.totalRows,
      });
      console.log('Database record created:', dataFile.id);

      // Run @DataClean analysis
      console.log('Running @DataClean analysis...');
      const qualityReport = await dataCleanAgent.analyzeDataQuality(schema, schema.previewData || []);
      console.log('Data quality analysis complete:', qualityReport.overallQuality);

      res.json({
        success: true,
        file: dataFile,
        schema: schema,
        dataQuality: qualityReport,
        cleaningRequired: qualityReport.issues.length > 0
      });
    } catch (error) {
      console.error('File upload error details:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to process file'
      });
    }
  });

  // Get user's files
  app.get("/api/files", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const files = await storage.getDataFilesByUser(userId);
      res.json(files);
    } catch (error) {
      console.error('Get files error:', error);
      // Return empty array instead of error for demo purposes
      res.json([]);
    }
  });

  // Connect to Google Sheets
  app.post("/api/connect/google-sheets", authenticate, async (req, res) => {
    try {
      const { url } = req.body;
      const userId = (req as any).user.id;

      if (!url) {
        return res.status(400).json({ error: 'Google Sheets URL is required' });
      }

      console.log('Connecting to Google Sheets:', url);

      // Fetch sheet data
      const { data, columns } = await googleSheetsConnector.fetchPublicSheet(url);

      if (data.length === 0) {
        return res.status(400).json({ error: 'Sheet is empty or could not be read' });
      }

      // Convert to CSV-like format for FileProcessor
      const csvData = [columns.join(','), ...data.map(row => columns.map(col => row[col] || '').join(','))].join('\n');
      const tempFilePath = path.join(process.cwd(), 'uploads', `sheet-${Date.now()}.csv`);

      // Write temporary CSV file
      fs.writeFileSync(tempFilePath, csvData);

      // Process with FileProcessor
      const schema = await FileProcessor.processFile(tempFilePath, `Google Sheet - ${url.split('/').pop()}`);

      console.log('Google Sheet processed successfully. Schema:', JSON.stringify(schema, null, 2));

      // Create data file record
      const dataFile = await storage.createDataFile({
        userId,
        filename: tempFilePath,
        originalName: `Google Sheet - ${new Date().toISOString()}`,
        fileType: 'text/csv',
        fileSize: Buffer.byteLength(csvData),
        schema,
        rowCount: schema.totalRows,
      });

      console.log('Database record created:', dataFile.id);

      // Run @DataClean analysis
      console.log('Running @DataClean analysis...');
      const qualityReport = await dataCleanAgent.analyzeDataQuality(schema, schema.previewData || []);
      console.log('Data quality analysis complete:', qualityReport.overallQuality);

      res.json({
        success: true,
        file: dataFile,
        schema: schema,
        dataQuality: qualityReport,
        cleaningRequired: qualityReport.issues.length > 0,
        source: 'google-sheets'
      });
    } catch (error) {
      console.error('Google Sheets connection error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to connect to Google Sheets'
      });
    }
  });

  // Connect to Database
  app.post("/api/connect/database", authenticate, async (req, res) => {
    try {
      const { connectionString, query, tableName } = req.body;
      const userId = (req as any).user.id;

      if (!connectionString) {
        return res.status(400).json({ error: 'Connection string is required' });
      }

      if (!query && !tableName) {
        return res.status(400).json({ error: 'Either query or tableName is required' });
      }

      console.log('Connecting to database...');

      // Test connection
      const testResult = await dbConnector.testConnection(connectionString);
      if (!testResult.success) {
        return res.status(400).json({ error: `Connection failed: ${testResult.error}` });
      }

      // Execute query or fetch table
      let data: any[];
      if (query) {
        data = await dbConnector.executeQuery(connectionString, query);
      } else {
        // Fetch all data from table
        const selectQuery = `SELECT * FROM ${tableName} LIMIT 10000`;
        data = await dbConnector.executeQuery(connectionString, selectQuery);
      }

      if (data.length === 0) {
        return res.status(400).json({ error: 'Query returned no data' });
      }

      // Convert to CSV format
      const columns = Object.keys(data[0]);
      const csvData = [
        columns.join(','),
        ...data.map(row => columns.map(col => {
          const value = row[col];
          // Escape CSV values
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(','))
      ].join('\n');

      const tempFilePath = path.join(process.cwd(), 'uploads', `db-${Date.now()}.csv`);

      // Write temporary CSV file
      fs.writeFileSync(tempFilePath, csvData);

      // Process with FileProcessor
      const schema = await FileProcessor.processFile(tempFilePath, tableName || 'Query Result');

      console.log('Database query processed successfully');

      // Create data file record
      const dataFile = await storage.createDataFile({
        userId,
        filename: tempFilePath,
        originalName: `Database - ${tableName || 'Query'} - ${new Date().toISOString()}`,
        fileType: 'text/csv',
        fileSize: Buffer.byteLength(csvData),
        schema,
        rowCount: schema.totalRows,
      });

      // Run @DataClean analysis
      const qualityReport = await dataCleanAgent.analyzeDataQuality(schema, schema.previewData || []);

      res.json({
        success: true,
        file: dataFile,
        schema: schema,
        dataQuality: qualityReport,
        cleaningRequired: qualityReport.issues.length > 0,
        source: 'database'
      });
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to connect to database'
      });
    }
  });

  // Generate Python code endpoint (without execution)
  app.post("/api/generate-python-code", authenticate, async (req, res) => {
    try {
      const { fileId, query, apiKey } = req.body;

      if (!fileId || !query) {
        return res.status(400).json({ error: 'Missing fileId or query' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
      }

      const userId = (req as any).user.id;

      // Get the data file
      const dataFile = await storage.getDataFile(fileId);
      if (!dataFile || dataFile.userId !== userId) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Initialize Python executor
      const pythonExecutor = PythonExecutor.getInstance();

      // Generate Python code for the query based on actual data schema using AI
      const pythonCode = await pythonExecutor.generatePythonCodeForQuery(query, dataFile.schema, apiKey);

      res.json({
        success: true,
        pythonCode: pythonCode
      });
    } catch (error) {
      console.error('Python Code Generation error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Python Code Generation failed',
        pythonCode: ''
      });
    }
  });

  // Chat analysis endpoint
  app.post("/api/analyze", authenticate, async (req, res) => {
    try {
      const { fileId, query, apiKey } = req.body;

      if (!fileId || !query) {
        return res.status(400).json({ error: 'Missing fileId or query' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
      }

      const userId = (req as any).user.id;

      // Get the data file
      const dataFile = await storage.getDataFile(fileId);
      if (!dataFile || dataFile.userId !== userId) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Initialize Python executor
      const pythonExecutor = PythonExecutor.getInstance();

      // Generate Python code for the query based on actual data schema using AI
      const pythonCode = await pythonExecutor.generatePythonCodeForQuery(query, dataFile.schema, apiKey);

      // Execute the Python code with the actual data file
      const pythonResult = await pythonExecutor.executePythonCode(pythonCode, dataFile.filename);

      // Initialize DeepSeek client
      const deepSeekClient = new DeepSeekClient(apiKey);

      // Check if the query is asking for a chart
      const chartKeywords = ['chart', 'plot', 'graph', 'visualize', 'show me', 'display', 'bar chart', 'line chart', 'pie chart'];
      const isChartRequest = chartKeywords.some(keyword => query.toLowerCase().includes(keyword));

      // Check if the query is asking for KPIs or single metrics
      const kpiKeywords = ['kpi', 'metric', 'single view', 'key performance', 'total', 'count', 'average', 'sum', 'percentage'];
      const isKPIRequest = kpiKeywords.some(keyword => query.toLowerCase().includes(keyword));

      // Prepare context for AI analysis
      const dataContext = {
        filename: dataFile.originalName,
        schema: dataFile.schema,
        rowCount: dataFile.rowCount || 0,
        previewData: (dataFile.schema as any)?.previewData || [],
      };

      // If Python execution was successful, include the results in the AI context
      let enhancedQuery = query;
      if (pythonResult.success && pythonResult.output) {
        // Add the Python execution results to the query context for AI analysis
        enhancedQuery = `${query}\n\nPython execution results:\n${JSON.stringify(pythonResult.output, null, 2)}`;
      } else if (pythonResult.error) {
        // If there was an error in Python execution, include that in the context
        enhancedQuery = `${query}\n\nPython execution error:\n${pythonResult.error}`;
      }

      // Analyze the data with the Python execution results
      const analysisResult = await deepSeekClient.analyzeData(enhancedQuery, dataContext);

      // If this is not a chart request, remove chart data from the response
      if (!isChartRequest && analysisResult.chartData) {
        delete analysisResult.chartData;
      }

      console.log('Analysis result:', JSON.stringify(analysisResult, null, 2));

      // Save the analysis
      const analysis = await storage.createAnalysis({
        userId,
        fileId,
        query,
        response: analysisResult.response,
        insights: analysisResult.insights,
        chartData: analysisResult.chartData,
      });

      // Generate smart recommendations based on the analysis
      const recommendationEngine = new RecommendationEngine(apiKey);
      const recommendations = await recommendationEngine.generateRecommendations({
        filename: dataFile.originalName,
        schema: dataFile.schema,
        rowCount: dataFile.rowCount || 0,
        previewData: (dataFile.schema as any)?.previewData || [],
      }, query);

      res.json({
        success: true,
        analysis: {
          ...analysis,
          ...analysisResult,
          pythonCode: pythonCode // Include the generated Python code in the response
        },
        recommendations
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Analysis failed',
        // Even in case of error, return a friendly response that can be displayed to the user
        analysis: {
          response: "I encountered an issue while analyzing your data. This might be due to missing dependencies or data access issues. Please try rephrasing your question or check your data file.",
          insights: {
            keyFindings: ["• Analysis failed due to a technical error"],
            recommendations: [
              "• Try rephrasing your question",
              "• Check if your data file is properly formatted",
              "• Ensure all required Python libraries are installed"
            ],
            metrics: {
              "Status": "Error",
              "Next Steps": "Try again with a different query"
            }
          }
        },
        recommendations: []
      });
    }
  });

  // *** NEW AUTO AGENT ENDPOINT ***
  app.post("/api/agents/auto", authenticate, async (req, res) => {
    try {
      const { fileId, apiKey, agentId } = req.body;
      const userId = (req as any).user.id;

      if (!fileId) {
        return res.status(400).json({ error: "fileId is required" });
      }

      // Retrieve the stored DataFile record
      const dataFile = await storage.getDataFile(fileId);
      if (!dataFile) {
        return res.status(404).json({ error: "Data file not found" });
      }

      // Create agent session
      const session = await storage.createAgentSession({
        userId,
        fileId,
        agentType: agentId || 'athena',
        status: 'running',
        metadata: {},
        results: {}
      });

      let result: any;
      const orchestrator = AgentOrchestrator.getInstance();

      // Route to appropriate agent based on agentId
      switch (agentId) {
        case 'scribe':
          // For Scribe, we need to get the latest Athena analysis first
          const athenaSession = await storage.getAgentSessionsByUser(userId);
          const latestAthena = athenaSession.find((s: any) => s.agentType === 'athena' && s.fileId === fileId && s.status === 'completed');

          console.log('Scribe: Latest Athena session found:', !!latestAthena);

          if (!latestAthena) {
            // Run Athena first
            const athenaResult = await athenaAgent.analyze(dataFile, apiKey, async (steps) => {
              console.log('Athena progress:', steps);
            });
            console.log('Scribe: Athena result keys:', Object.keys(athenaResult));
            result = await scribeAgent.generate(athenaResult, apiKey);
          } else {
            console.log('Scribe: Using existing Athena results, keys:', Object.keys(latestAthena.results));
            result = await scribeAgent.generate(latestAthena.results, apiKey);
          }
          console.log('Scribe: Generated report keys:', Object.keys(result));
          break;

        case 'helios':
          // Helios agent generates visualizations
          console.log('Viz: Generating visualizations...');
          result = await vizAgent.createChart("Generate recommended visualizations for this dataset", dataFile, apiKey);
          console.log('Viz: Generated chart:', result.chartType);
          break;

        case 'hermes':
          // Hermes agent generates queries  
          console.log('SQL: Generating SQL queries...');
          result = await sqlAgent.generateQuery("Generate SQL queries for analyzing this dataset", dataFile, apiKey);
          console.log('SQL: Generated queries');
          break;

        case 'aegis':
          // Aegis agent analyzes data quality
          console.log('DataClean: Analyzing data quality...');
          const qualityReport = await dataCleanAgent.analyzeDataQuality(dataFile.schema, []);
          result = await dataCleanAgent.generateCleaningPlan(qualityReport, apiKey);
          result.qualityReport = qualityReport; // Include the quality report
          console.log('DataClean: Analysis complete');
          break;

        case 'athena':
        default:
          // Run Athena analysis with progress callback
          result = await athenaAgent.analyze(dataFile, apiKey, async (steps) => {
            console.log('Athena progress:', steps);
            await storage.updateAgentSession(session.id, {
              results: { thinkingSteps: steps }
            });
          });
          break;
      }

      // Update session with final results
      await storage.updateAgentSession(session.id, {
        status: 'completed',
        results: result
      });

      res.json({ success: true, result, sessionId: session.id });
    } catch (error) {
      console.error('Auto agent error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Auto analysis failed' });
    }
  });

  // Get agent sessions history
  app.get("/api/agent-sessions", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { fileId } = req.query;
      if (!fileId) {
        return res.status(400).json({ error: "fileId is required" });
      }

      const sessions = await storage.getAgentSessionsByFile(String(fileId));
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching agent sessions:', error);
      res.status(500).json({ error: 'Failed to fetch agent sessions' });
    }
  });

  // Delete agent session
  app.delete("/api/agent-sessions/:sessionId", authenticate, async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Delete the session from database
      await storage.deleteAgentSession(sessionId);

      res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting agent session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  // Natural Language to SQL endpoint
  app.post("/api/sql-generate", authenticate, async (req, res) => {
    try {
      const { fileId, query, apiKey } = req.body;

      if (!fileId || !query) {
        return res.status(400).json({ error: 'Missing fileId or query' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
      }

      const userId = (req as any).user.id;

      // Get the data file
      const dataFile = await storage.getDataFile(fileId);
      if (!dataFile || dataFile.userId !== userId) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Initialize SQL generator
      const sqlGenerator = new SQLGenerator(apiKey);

      // Generate SQL query from natural language
      const sqlResult = await sqlGenerator.generateSQLQuery(query, {
        filename: dataFile.originalName,
        schema: dataFile.schema,
        rowCount: dataFile.rowCount || 0,
        previewData: (dataFile.schema as any)?.previewData || [],
      });

      res.json({
        success: true,
        sql: sqlResult
      });
    } catch (error) {
      console.error('SQL Generation error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'SQL Generation failed',
        sql: {
          query: "",
          explanation: error instanceof Error ? error.message : 'SQL Generation failed',
          result: [],
          columns: []
        }
      });
    }
  });

  // Anomaly detection endpoint
  app.post("/api/detect-anomalies", authenticate, async (req, res) => {
    try {
      const { fileId, apiKey } = req.body;

      if (!fileId) {
        return res.status(400).json({ error: 'Missing fileId' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
      }

      const userId = (req as any).user.id;

      // Get the data file
      const dataFile = await storage.getDataFile(fileId);
      if (!dataFile || dataFile.userId !== userId) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Initialize anomaly detector
      const anomalyDetector = new AnomalyDetector(apiKey);

      // Detect anomalies in the data
      const anomalies = await anomalyDetector.detectAnomalies({
        filename: dataFile.originalName,
        schema: dataFile.schema,
        rowCount: dataFile.rowCount || 0,
        previewData: (dataFile.schema as any)?.previewData || [],
      });

      // Generate alerts for high-severity anomalies
      const alerts = await anomalyDetector.generateAlerts(anomalies, {
        filename: dataFile.originalName,
        schema: dataFile.schema,
        rowCount: dataFile.rowCount || 0,
        previewData: (dataFile.schema as any)?.previewData || [],
      });

      res.json({
        success: true,
        anomalies,
        alerts
      });
    } catch (error) {
      console.error('Anomaly Detection error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Anomaly Detection failed',
        anomalies: [],
        alerts: []
      });
    }
  });

  // Workflow generation endpoint
  app.post("/api/generate-workflow", authenticate, async (req, res) => {
    try {
      const { fileId, goal, apiKey } = req.body;

      if (!fileId || !goal) {
        return res.status(400).json({ error: 'Missing fileId or goal' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
      }

      const userId = (req as any).user.id;

      // Get the data file
      const dataFile = await storage.getDataFile(fileId);
      if (!dataFile || dataFile.userId !== userId) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Initialize recommendation engine
      const recommendationEngine = new RecommendationEngine(apiKey);

      // Generate workflow steps
      const workflow = await recommendationEngine.generateWorkflow({
        filename: dataFile.originalName,
        schema: dataFile.schema,
        rowCount: dataFile.rowCount || 0,
        previewData: (dataFile.schema as any)?.previewData || [],
      }, goal);

      res.json({
        success: true,
        workflow
      });
    } catch (error) {
      console.error('Workflow Generation error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Workflow Generation failed',
        workflow: []
      });
    }
  });

  // Get user's analyses
  app.get("/api/analyses", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const analyses = await storage.getAnalysesByUser(userId);
      res.json(analyses);
    } catch (error) {
      console.error('Get analyses error:', error);
      res.status(500).json({ error: 'Failed to retrieve analyses' });
    }
  });

  // Delete analysis
  app.delete("/api/analyses/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // First, verify the analysis belongs to the user
      const analysis = await storage.getAnalysisById(id);
      if (!analysis || analysis.userId !== userId) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      // Delete the analysis
      await storage.deleteAnalysis(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete analysis error:', error);
      res.status(500).json({ error: 'Failed to delete analysis' });
    }
  });

  // Generate suggestions for a file
  app.post("/api/suggestions", authenticate, async (req, res) => {
    try {
      const { fileId, apiKey } = req.body;

      if (!fileId) {
        return res.status(400).json({ error: 'Missing fileId' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
      }

      const userId = (req as any).user.id;

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
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
        suggestions: [
          'What are the top performing products by revenue?',
          'Show me sales trends over time',
          'Which customer segments generate the most value?',
          'Identify any seasonal patterns or anomalies',
          'What are the key factors driving customer satisfaction?'
        ]
      });
    }
  });

  // Agent Routes

  // Create Agent Session
  app.post("/api/agents/session/create", authenticate, async (req, res) => {
    try {
      const { fileId, agentType } = req.body;
      const userId = (req as any).user.id;

      if (!fileId || !agentType) {
        return res.status(400).json({ error: "Missing fileId or agentType" });
      }

      const session = await AgentOrchestrator.getInstance().createSession(userId, fileId, agentType);
      res.json(session);
    } catch (error) {
      console.error("Agent session creation error:", error);
      res.status(500).json({ error: "Failed to create agent session" });
    }
  });

  // Unified Agent Chat Endpoint (handles @ mentions)
  app.post("/api/agents/chat", authenticate, async (req, res) => {
    try {
      const { fileId, message, apiKey } = req.body;
      const userId = (req as any).user.id;

      if (!fileId || !message) {
        return res.status(400).json({ error: "Missing fileId or message" });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "API key required for agent execution" });
      }

      // Import agent registry
      const { detectAgentMentions, getAgentByMention, AGENTS } = await import("@shared/agent-registry");

      // Detect @ mentions
      const mentions = detectAgentMentions(message);

      if (mentions.length === 0) {
        return res.status(400).json({ error: "No agent mentioned. Use @AgentName to invoke an agent." });
      }

      // Use first mentioned agent
      const agentMention = mentions[0];
      const agent = getAgentByMention(agentMention);

      if (!agent) {
        return res.status(400).json({ error: `Unknown agent: @${agentMention}` });
      }

      // Create session
      const session = await AgentOrchestrator.getInstance().createSession(userId, fileId, agent.id);

      // Route to appropriate agent based on ID
      let results;
      const orchestrator = AgentOrchestrator.getInstance();

      switch (agent.id) {
        case 'athena':
          results = await orchestrator.runAthenaAnalysis(session.id, fileId, userId, apiKey);
          break;

        case 'helios':
          results = await orchestrator.runVizGeneration(session.id, fileId, message, userId, apiKey);
          break;

        case 'hermes':
          results = await orchestrator.runSQLGeneration(session.id, fileId, message, userId, apiKey);
          break;

        case 'scribe':
          // For Scribe, we need an analysis session ID
          // For now, create a simple report from file data
          const file = await storage.getDataFile(fileId);
          if (!file) throw new Error("File not found");

          results = await orchestrator.generateReport(session.id, session.id, userId, apiKey);
          break;

        case 'aegis':
          // Run Aegis analysis
          const { dataCleanAgent } = await import("./services/data-clean-agent");
          const dataFile = await storage.getDataFile(fileId);
          if (!dataFile) throw new Error("File not found");

          const schema = dataFile.schema as any;
          const qualityReport = await dataCleanAgent.analyzeDataQuality(schema, schema.previewData || []);

          results = {
            status: 'completed',
            results: {
              qualityReport,
              cleaningPlan: await dataCleanAgent.generateCleaningPlan(qualityReport, apiKey)
            }
          };
          break;

        default:
          return res.status(400).json({ error: "Agent not supported" });
      }

      res.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          displayName: agent.displayName,
          color: agent.color
        },
        session: results,
        message: `${agent.displayName} has completed the analysis`
      });

    } catch (error) {
      console.error("Agent chat error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Agent execution failed"
      });
    }
  });

  // Run Athena Analysis
  app.post("/api/agents/athena/analyze", authenticate, async (req, res) => {
    try {
      const { sessionId, fileId, apiKey } = req.body;
      const userId = (req as any).user.id;

      if (!sessionId || !fileId || !apiKey) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const result = await AgentOrchestrator.getInstance().runAthenaAnalysis(sessionId, fileId, userId, apiKey);
      res.json(result);
    } catch (error) {
      console.error("Athena analysis error:", error);
      res.status(500).json({ error: "Athena analysis failed" });
    }
  });

  // Generate Scribe Report
  app.post("/api/agents/scribe/generate-report", authenticate, async (req, res) => {
    try {
      const { sessionId, analysisSessionId, apiKey } = req.body;
      const userId = (req as any).user.id;

      if (!sessionId || !analysisSessionId || !apiKey) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const result = await AgentOrchestrator.getInstance().generateReport(sessionId, analysisSessionId, userId, apiKey);
      res.json(result);
    } catch (error) {
      console.error("Scribe report generation error:", error);
      res.status(500).json({ error: "Report generation failed" });
    }
  });

  // Get Agent Session
  app.get("/api/agents/session/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getAgentSession(id);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Execute Code in Sandbox
  app.post("/api/agents/execute-code", authenticate, async (req, res) => {
    try {
      const { sessionId, code } = req.body;
      const userId = (req as any).user.id;

      if (!sessionId || !code) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const result = await AgentOrchestrator.getInstance().executeCode(sessionId, code, userId);
      res.json(result);
    } catch (error) {
      console.error("Code execution error:", error);
      res.status(500).json({ error: "Code execution failed" });
    }
  });




  // DB Connection Test
  app.post("/api/agents/db/connect", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    try {
      const { connectionString } = req.body;
      const result = await dbConnector.testConnection(connectionString);

      if (result.success) {
        // Log the connection attempt
        await storage.createAuditLog({
          userId: req.user.id,
          action: "db_connect",
          details: { connectionString: connectionString.replace(/:[^:]*@/, ':***@') }, // Redact password
          ipAddress: req.ip || "unknown"
        });

        res.json({ success: true, ...result });
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Google Sheets Connection Endpoint
  app.post("/api/agents/sheets/connect", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    try {
      const { url } = req.body;

      if (!googleSheetsConnector.isValidUrl(url)) {
        return res.status(400).json({ message: "Invalid Google Sheets URL" });
      }

      const sheetData = await googleSheetsConnector.fetchPublicSheet(url);

      // Log the connection
      await storage.createAuditLog({
        userId: req.user.id,
        action: "sheet_connect",
        details: { url },
        ipAddress: req.ip || "unknown"
      });

      res.json({
        success: true,
        rowCount: sheetData.data.length,
        columns: sheetData.columns,
        preview: sheetData.data.slice(0, 10)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get Audit Logs
  // API Connection Endpoint
  app.post("/api/agents/api/connect", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ message: "Missing API URL" });
      }

      const apiData = await apiConnector.fetchData(url);

      // Log the connection
      await storage.createAuditLog({
        userId: req.user.id,
        action: "api_connect",
        details: { url },
        ipAddress: req.ip || "unknown"
      });

      res.json({
        success: true,
        rowCount: apiData.data.length,
        columns: apiData.columns,
        preview: apiData.data.slice(0, 10)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/agents/audit-logs", async (req, res) => {
    try {
      // This would typically fetch from the audit_logs table
      // For now, return empty array or mock
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // API key validation endpoint
  app.post("/api/validate-key", authenticate, async (req, res) => {
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