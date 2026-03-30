import { storage } from "../storage";
import { AthenaAgent } from "./athena-agent";
import { ScribeAgent } from "./scribe-agent";
import { VizAgent } from "./viz-agent";
import { SQLAgent } from "./sql-agent";
import { PrivacySecurityAgent } from "./privacy-security-agent";
import { ExecutionSandbox } from "./execution-sandbox";
import { AgentSession } from "@shared/schema";

export class AgentOrchestrator {
    private static instance: AgentOrchestrator;
    private athenaAgent: AthenaAgent;
    private scribeAgent: ScribeAgent;
    private vizAgent: VizAgent;
    private sqlAgent: SQLAgent;
    private privacyAgent: PrivacySecurityAgent;
    private sandbox: ExecutionSandbox;

    private constructor() {
        this.athenaAgent = new AthenaAgent();
        this.scribeAgent = new ScribeAgent();
        this.vizAgent = new VizAgent();
        this.sqlAgent = new SQLAgent();
        this.privacyAgent = new PrivacySecurityAgent();
        this.sandbox = ExecutionSandbox.getInstance();
    }

    public static getInstance(): AgentOrchestrator {
        if (!AgentOrchestrator.instance) {
            AgentOrchestrator.instance = new AgentOrchestrator();
        }
        return AgentOrchestrator.instance;
    }

    async createSession(userId: string, fileId: string, agentType: string): Promise<AgentSession> {
        return await storage.createAgentSession({
            userId,
            fileId,
            agentType,
            status: 'running',
            metadata: {},
            results: {}
        });
    }

    /**
     * Nexus Routing Logic
     * Analyzes the user's message and routes to the appropriate agent.
     */
    async routeRequest(userId: string, fileId: string, message: string, apiKey: string): Promise<any> {
        // Simple keyword-based routing for now, can be enhanced with LLM classification
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('visualize') || lowerMsg.includes('chart') || lowerMsg.includes('plot') || lowerMsg.includes('graph')) {
            const session = await this.createSession(userId, fileId, 'viz');
            return await this.runVizGeneration(session.id, fileId, message, userId, apiKey);
        } else if (lowerMsg.includes('sql') || lowerMsg.includes('query') || lowerMsg.includes('select')) {
            const session = await this.createSession(userId, fileId, 'sql');
            return await this.runSQLGeneration(session.id, fileId, message, userId, apiKey);
        } else if (lowerMsg.includes('report') || lowerMsg.includes('summary') || lowerMsg.includes('scribe')) {
            // Scribe usually needs a previous analysis, but we can trigger a fresh one or handle it
            // For now, let's assume it wants a report on the file
            const session = await this.createSession(userId, fileId, 'scribe');
            // We need an analysis session ID for Scribe. 
            // In a real flow, we'd look up the last analysis.
            // For this "Nexus" demo, we might trigger Athena first then Scribe, or just fail gracefully.
            // Let's trigger Athena first if no context.
            const athenaSession = await this.createSession(userId, fileId, 'athena');
            await this.runAthenaAnalysis(athenaSession.id, fileId, userId, apiKey);
            return await this.generateReport(session.id, athenaSession.id, userId, apiKey);
        } else {
            // Default to Athena for general analysis
            const session = await this.createSession(userId, fileId, 'athena');
            return await this.runAthenaAnalysis(session.id, fileId, userId, apiKey);
        }
    }

    async runAthenaAnalysis(sessionId: string, fileId: string, userId: string, apiKey: string): Promise<any> {
        try {
            await storage.updateAgentSession(sessionId, { status: 'running' });
            const file = await storage.getDataFile(fileId);
            if (!file) throw new Error("File not found");

            const previewData = (file.schema as any)?.previewData || [];
            const { findings } = await this.privacyAgent.scanAndRedact(previewData);

            if (Object.values(findings).some((count: any) => count > 0)) {
                await storage.createAuditLog({
                    userId,
                    action: 'pii_detected',
                    agentType: 'privacy_security',
                    details: { sessionId, fileId, findings }
                });
            }

            const results = await this.athenaAgent.analyze(file, apiKey, async (steps) => {
                await storage.updateAgentSession(sessionId, {
                    results: { thinkingSteps: steps }
                });
            });

            const updatedSession = await storage.updateAgentSession(sessionId, {
                status: 'completed',
                results: { ...results, piiFindings: findings },
                completedAt: new Date()
            });

            await storage.createAuditLog({
                userId,
                action: 'athena_analysis',
                agentType: 'athena',
                details: { sessionId, fileId }
            });

            return updatedSession;
        } catch (error: any) {
            await storage.updateAgentSession(sessionId, {
                status: 'failed',
                results: { error: error.message }
            });
            throw error;
        }
    }

    async runVizGeneration(sessionId: string, fileId: string, query: string, userId: string, apiKey: string): Promise<any> {
        try {
            await storage.updateAgentSession(sessionId, { status: 'running' });
            const file = await storage.getDataFile(fileId);
            if (!file) throw new Error("File not found");

            const result = await this.vizAgent.createChart(query, file, apiKey);

            const updatedSession = await storage.updateAgentSession(sessionId, {
                status: 'completed',
                results: result,
                completedAt: new Date()
            });

            return updatedSession;
        } catch (error: any) {
            await storage.updateAgentSession(sessionId, {
                status: 'failed',
                results: { error: error.message }
            });
            throw error;
        }
    }

    async runSQLGeneration(sessionId: string, fileId: string, query: string, userId: string, apiKey: string): Promise<any> {
        try {
            await storage.updateAgentSession(sessionId, { status: 'running' });
            const file = await storage.getDataFile(fileId);
            if (!file) throw new Error("File not found");

            const result = await this.sqlAgent.generateQuery(query, file, apiKey);

            const updatedSession = await storage.updateAgentSession(sessionId, {
                status: 'completed',
                results: result,
                completedAt: new Date()
            });

            return updatedSession;
        } catch (error: any) {
            await storage.updateAgentSession(sessionId, {
                status: 'failed',
                results: { error: error.message }
            });
            throw error;
        }
    }

    async generateReport(sessionId: string, analysisSessionId: string, userId: string, apiKey: string): Promise<any> {
        try {
            await storage.updateAgentSession(sessionId, { status: 'running' });
            const analysisSession = await storage.getAgentSession(analysisSessionId);
            if (!analysisSession || !analysisSession.results) {
                throw new Error("Analysis results not found");
            }

            const reportContent = await this.scribeAgent.generate(analysisSession.results, apiKey);

            const report = await storage.createReport({
                sessionId,
                title: `Report - ${new Date().toISOString()}`,
                format: 'json',
                content: reportContent,
                fileUrl: ''
            });

            const updatedSession = await storage.updateAgentSession(sessionId, {
                status: 'completed',
                results: { reportId: report.id, reportContent },
                completedAt: new Date()
            });

            return updatedSession;
        } catch (error: any) {
            await storage.updateAgentSession(sessionId, {
                status: 'failed',
                results: { error: error.message }
            });
            throw error;
        }
    }

    async executeCode(sessionId: string, code: string, userId: string): Promise<any> {
        try {
            await storage.createAuditLog({
                userId,
                action: 'code_execution_start',
                agentType: 'sandbox',
                details: { sessionId }
            });

            const result = await this.sandbox.execute(code);

            await storage.createCodeExecution({
                sessionId,
                code,
                language: 'python',
                status: result.success ? 'success' : 'error',
                output: result,
                executionTime: 0
            });

            return result;
        } catch (error: any) {
            console.error("Code execution failed:", error);
            throw error;
        }
    }
}

export const agentOrchestrator = AgentOrchestrator.getInstance();
