export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export interface DataContext {
  filename: string;
  schema: any;
  rowCount: number;
  previewData: any[];
}

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeData(query: string, context: DataContext): Promise<{
    response: string;
    insights: any;
    chartData?: any;
  }> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(query, context);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} - ${response.statusText}`);
      }

      const data: DeepSeekResponse = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'No response generated';

      // Parse the response to extract insights and chart data
      const parsed = this.parseAIResponse(aiResponse, query);

      return {
        response: parsed.textResponse,
        insights: parsed.insights,
        chartData: parsed.chartData,
      };
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw new Error(`Failed to analyze data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(context: DataContext): string {
    return `You are Lumina, an expert data analyst AI assistant. You help users understand their business data through conversational analysis.

Data Context:
- File: ${context.filename}
- Total rows: ${context.rowCount}
- Columns: ${context.schema.columns.map((col: any) => `${col.name} (${col.type})`).join(', ')}

Your responses should:
1. Provide clear, actionable business insights
2. Include specific numbers and percentages when relevant
3. Suggest follow-up questions or recommendations
4. Format your response as JSON with this structure:
{
  "textResponse": "Your main analysis in plain English",
  "insights": {
    "keyFindings": ["finding1", "finding2"],
    "recommendations": ["rec1", "rec2"],
    "metrics": {"metric1": value1, "metric2": value2}
  },
  "chartData": {
    "type": "bar|line|pie|doughnut",
    "labels": ["label1", "label2"],
    "datasets": [{"label": "Series 1", "data": [1,2,3], "backgroundColor": ["#5C4BBA", "#A280E0"]}]
  }
}

If the query requires a chart, include appropriate chart data. Use purple color scheme (#5C4BBA, #A280E0) for visualizations.`;
  }

  private buildUserPrompt(query: string, context: DataContext): string {
    const sampleData = context.previewData.slice(0, 3);
    return `Question: ${query}

Sample data preview:
${JSON.stringify(sampleData, null, 2)}

Please analyze this data and provide insights with appropriate visualizations if needed.`;
  }

  private parseAIResponse(response: string, query: string): {
    textResponse: string;
    insights: any;
    chartData?: any;
  } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return {
        textResponse: parsed.textResponse || response,
        insights: parsed.insights || this.generateDefaultInsights(query),
        chartData: parsed.chartData,
      };
    } catch {
      // If not JSON, treat as plain text and generate default structure
      return {
        textResponse: response,
        insights: this.generateDefaultInsights(query),
        chartData: undefined,
      };
    }
  }

  private generateDefaultInsights(query: string): any {
    return {
      keyFindings: [`Analysis completed for: ${query}`],
      recommendations: ['Consider exploring related metrics', 'Review data trends over time'],
      metrics: {},
    };
  }

  async generateSuggestions(context: DataContext): Promise<string[]> {
    const prompt = `Based on this dataset structure, suggest 5 relevant business questions a user might ask:
    
Columns: ${context.schema.columns.map((col: any) => `${col.name} (${col.type})`).join(', ')}
Total rows: ${context.rowCount}

Return only a JSON array of question strings, nothing else.`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data: DeepSeekResponse = await response.json();
      const suggestions = JSON.parse(data.choices[0]?.message?.content || '[]');
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [
        'What are the top performing items?',
        'Show me trends over time',
        'Which categories drive the most value?',
        'Identify any patterns or anomalies',
        'What insights can help improve performance?'
      ];
    }
  }
}
