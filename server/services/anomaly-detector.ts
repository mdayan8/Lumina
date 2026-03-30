import { DeepSeekClient } from "./deepseek-client";

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'outlier' | 'trend';
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  timestamp: Date;
}

export interface Alert {
  id: string;
  anomalyId: string;
  userId: string;
  message: string;
  sentAt: Date;
  channel: 'email' | 'slack' | 'webhook';
  status: 'sent' | 'failed';
}

export class AnomalyDetector {
  private deepSeekClient: DeepSeekClient;

  constructor(apiKey: string) {
    this.deepSeekClient = new DeepSeekClient(apiKey);
  }

  /**
   * Detect anomalies in the provided data
   */
  async detectAnomalies(context: any): Promise<Anomaly[]> {
    const systemPrompt = this.buildAnomalySystemPrompt();
    const userPrompt = this.buildAnomalyUserPrompt(context);

    try {
      const response = await this.deepSeekClient.callDeepSeekAPI(systemPrompt, userPrompt);
      const anomalies = this.parseAnomalyResponse(response);
      
      return anomalies;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      throw new Error(`Failed to detect anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate alerts for detected anomalies
   */
  async generateAlerts(anomalies: Anomaly[], context: any): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    for (const anomaly of anomalies) {
      // Only generate alerts for high severity anomalies
      if (anomaly.severity === 'high') {
        const alertMessage = this.generateAlertMessage(anomaly, context);
        
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          anomalyId: anomaly.id,
          userId: "demo-user", // In production, this would come from context
          message: alertMessage,
          sentAt: new Date(),
          channel: 'email', // In production, this would be configurable
          status: 'sent'
        });
      }
    }
    
    return alerts;
  }

  private buildAnomalySystemPrompt(): string {
    return `You are an expert data analyst specializing in anomaly detection for business data.

Your task is to identify unusual patterns, spikes, drops, or outliers in business metrics that could indicate:
- Unexpected revenue changes
- Customer behavior shifts
- Cost anomalies
- Operational issues
- Seasonal deviations

Format your response as a JSON array with this EXACT structure:
[
  {
    "id": "unique_identifier",
    "type": "spike|drop|outlier|trend",
    "metric": "metric_name",
    "currentValue": 123.45,
    "expectedValue": 67.89,
    "deviation": 81.56,
    "severity": "low|medium|high",
    "description": "Clear, concise description of the anomaly",
    "recommendation": "Actionable recommendation for the business user"
  }
]

CRITICAL RULES:
1. ONLY return valid JSON array
2. NEVER include markdown formatting
3. ALL numeric values must be actual numbers, not strings
4. Include ONLY high-impact anomalies that require attention
5. Keep descriptions and recommendations clear and actionable
6. If no significant anomalies found, return empty array []`;
  }

  private buildAnomalyUserPrompt(context: any): string {
    const columnNames = context.schema.columns.map((col: any) => col.name).join(', ');
    const sampleData = context.previewData.slice(0, 3);
    
    return `Analyze this business dataset for anomalies:

Dataset Information:
- File: ${context.filename}
- Total records: ${context.rowCount}
- Columns: ${columnNames}

Sample data:
${JSON.stringify(sampleData, null, 2)}

Identify any significant anomalies that require business attention. Focus on metrics that show:
- Unexpected spikes or drops (>20% change)
- Unusual patterns or outliers
- Deviations from expected trends
- Operational irregularities

Return ONLY the JSON array format specified in the system prompt.`;
  }

  private parseAnomalyResponse(response: any): Anomaly[] {
    try {
      // Clean the response to remove any markdown formatting
      const cleanResponse = response.choices[0]?.message?.content?.replace(/```json|```/g, '').trim() || '[]';
      const parsed = JSON.parse(cleanResponse);
      
      // Validate and format the anomalies
      if (Array.isArray(parsed)) {
        return parsed.map(anomaly => ({
          ...anomaly,
          timestamp: new Date()
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing anomaly response:', error);
      return [];
    }
  }

  private generateAlertMessage(anomaly: Anomaly, context: any): string {
    const formattedDeviation = anomaly.deviation > 0 ? `+${anomaly.deviation.toFixed(2)}%` : `${anomaly.deviation.toFixed(2)}%`;
    
    return `🚨 ANOMALY DETECTED in ${context.filename}
    
Metric: ${anomaly.metric}
Current Value: ${anomaly.currentValue.toLocaleString()}
Expected Value: ${anomaly.expectedValue.toLocaleString()}
Deviation: ${formattedDeviation}

Description: ${anomaly.description}

Recommended Action: ${anomaly.recommendation}`;
  }
}