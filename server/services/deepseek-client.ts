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

export interface PythonExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
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
    pythonExecution?: PythonExecutionResult;
  }> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(query, context);

    try {
      const response = await this.callDeepSeekAPI(systemPrompt, userPrompt);
      const aiResponse = response.choices[0]?.message?.content || 'No response generated';

      // Parse the response to extract insights and chart data
      const parsed = this.parseAIResponse(aiResponse, query);

      return {
        response: parsed.textResponse,
        insights: parsed.insights,
        chartData: parsed.chartData,
      };
    } catch (error) {
      console.error('Analysis error:', error);
      // Return a friendly error message that can be displayed to the user
      return {
        response: "I'm having trouble connecting to the AI service right now. Please check your internet connection and try again. If the problem persists, please verify your API key is valid.",
        insights: {
          keyFindings: ["• Connection to AI service failed"],
          recommendations: [
            "• Check your internet connection",
            "• Verify your DeepSeek API key is valid",
            "• Try asking your question again"
          ],
          metrics: {
            "Status": "Connection Error",
            "Next Steps": "Check connection/API key"
          }
        },
        chartData: undefined,
      };
    }
  }

  /**
   * Public method to call DeepSeek API directly
   */
  public async callDeepSeekAPI(systemPrompt: string, userPrompt: string): Promise<DeepSeekResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('DeepSeek API error:', error);
      
      // Handle specific error cases
      if (error.name === 'AbortError') {
        throw new Error('The request to the AI service timed out. Please try again.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
        throw new Error('Unable to connect to the AI service. Please check your internet connection.');
      } else if (error.message && error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your DeepSeek API key.');
      }
      
      throw new Error(`Failed to call DeepSeek API: ${error.message || 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(context: DataContext): string {
    return `You are Lumina, an expert data analyst AI assistant. You help users understand their business data through conversational analysis.

Data Context:
- File: ${context.filename}
- Total rows: ${context.rowCount}
- Columns: ${context.schema.columns.map((col: any) => `${col.name} (${col.type})`).join(', ')}

Your responses should be formatted for direct presentation to business users with:
1. Clear, actionable insights in plain English
2. Specific numbers and percentages (formatted as $1.2M, 23%, etc.)
3. Bullet-point lists for key findings and recommendations
4. Chart data when relevant to illustrate trends or comparisons

Format your response as JSON with this EXACT structure:
{
  "textResponse": "A clear, conversational summary of your analysis (2-3 sentences max)",
  "insights": {
    "keyFindings": [
      "• Specific finding with formatted numbers (e.g., '• Revenue increased 15% YoY to $2.4M')",
      "• Another concrete insight with data"
    ],
    "recommendations": [
      "• Actionable recommendation based on findings",
      "• Strategic suggestion for business improvement"
    ],
    "metrics": {
      "Revenue": "$2.4M",
      "Growth": "15%",
      "Customers": "1,250"
    }
  },
  "chartData": {
    "title": "Descriptive chart title",
    "type": "bar|line|pie|doughnut",
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "datasets": [{
      "label": "Revenue",
      "data": [1200000, 1800000, 2100000, 2400000],
      "backgroundColor": undefined
    }]
  }
}

IMPORTANT: Only include the "metrics" section when the user specifically asks for KPIs, metrics, or performance indicators. For general questions, focus on providing relevant insights and analysis without defaulting to KPIs.

CRITICAL GUIDELINES:
- ALWAYS format numbers appropriately ($, %, K, M) - e.g., "$1.2M" not "1200000"
- ALWAYS use bullet points for findings and recommendations
- ALWAYS start bullet points with "• " (bullet and space)
- NEVER include raw data arrays in textResponse
- NEVER include technical jargon in textResponse
- Include chartData ONLY when the user explicitly requests a chart, visualization, graph, or plot
- If the user does NOT request a chart, provide tables and textual summaries instead
- When providing chartData, ONLY include it if the user's query contains words like: chart, plot, graph, visualize, show me, display
- Keep textResponse conversational and under 3 sentences
- Focus on business impact and actionable insights
- Choose appropriate colors for charts based on the data being visualized and the relationships between data points. Select colors that enhance data readability and provide good contrast. For categorical data, use distinct colors. For sequential data, use color gradients. For diverging data, use contrasting color schemes.
- Choose the most appropriate chart type for the data:
  * Bar charts for comparisons
  * Line charts for trends over time
  * Pie/doughnut charts for proportions
  * Make sure labels and data arrays have the same length

RESPONSE FLEXIBILITY:
- ALWAYS interpret the user's specific request and respond accordingly
- Do NOT default to showing Key Performance Indicators unless explicitly requested
- For general questions, provide relevant insights and analysis that directly answer the question
- Only show KPIs when the user specifically asks for metrics, KPIs, or performance indicators
- Adapt your response format based on what the user is asking for (analysis, summary, specific metrics, etc.)

ADDITIONAL CONTEXT:
The Python code has already been executed and the results are available. Your task is to interpret these results and provide human-readable insights. The Python execution results will be provided in the user query.`;
  }

  private buildUserPrompt(query: string, context: DataContext): string {
    const sampleData = context.previewData.slice(0, 5);
    
    // Check if the query is asking for a chart
    const chartKeywords = ['chart', 'plot', 'graph', 'visualize', 'show me', 'display', 'bar chart', 'line chart', 'pie chart'];
    const isChartRequest = chartKeywords.some(keyword => query.toLowerCase().includes(keyword));
    
    // Check if the query is asking for KPIs or single metrics
    const kpiKeywords = ['kpi', 'key performance', 'metric', 'single view'];
    const isKPIRequest = kpiKeywords.some(keyword => query.toLowerCase().includes(keyword));
    
    return `Question: ${query}

Sample data preview:
${JSON.stringify(sampleData, null, 2)}

Please provide a detailed analysis that directly answers this question with specific insights from the data. 
Format your response as JSON with the exact structure specified in the system prompt.
Include relevant metrics with proper formatting ($1.2M, 23%, etc.), clear bullet-point findings, 
${isChartRequest ? 'and a chart visualization when appropriate to illustrate your key insights.' : 'and focus on providing tables and textual summaries rather than charts.'}
${isKPIRequest ? 'For KPI requests, prioritize creating clear, single-value metrics in the "metrics" section that directly answer the user\'s question.' : ''}

RESPONSE GUIDELINES:
- ONLY include chartData if the user explicitly requested a chart, visualization, graph, or plot
- If the user did NOT request a chart, provide tables and textual summaries instead
- Choose the most appropriate chart type for the data being analyzed
- Ensure labels and data arrays have the same length
- Use descriptive titles that explain what the chart shows
- Include 3-7 data points for clarity (avoid too many data points in a single chart)
- Respond directly to the user's specific question without defaulting to KPIs unless requested
- Provide analysis, summaries, or specific information as requested

PYTHON EXECUTION CONTEXT:
The Python code has already been executed on the actual data. Any results or errors from the Python execution are included in the query above. Please use these results to provide your analysis and insights that directly answer the user's question.`;
  }

  private parseAIResponse(response: string, query: string): {
    textResponse: string;
    insights: any;
    chartData?: any;
  } {
    try {
      // Clean the response to remove any markdown formatting
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      
      // Try to parse as JSON first
      const parsed = JSON.parse(cleanResponse);
      
      // Format the response for better presentation
      return {
        textResponse: parsed.textResponse || response,
        insights: {
          keyFindings: Array.isArray(parsed.insights?.keyFindings) 
            ? parsed.insights.keyFindings 
            : [`• Analysis completed for: ${query}`],
          recommendations: Array.isArray(parsed.insights?.recommendations) 
            ? parsed.insights.recommendations 
            : ['• Consider exploring related metrics', '• Review data trends over time'],
          metrics: parsed.insights?.metrics || {}
        },
        chartData: parsed.chartData,
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // If not JSON, treat as plain text and generate default structure
      return {
        textResponse: response,
        insights: {
          keyFindings: [],
          recommendations: [],
          metrics: {}
        },
        chartData: undefined,
      };
    }
  }

  private generateDefaultInsights(query: string): any {
    return {
      keyFindings: [
        `• Analysis completed for: "${query}"`,
        "• The AI is processing your request and will provide detailed insights shortly"
      ],
      recommendations: [
        "• Try rephrasing your question for more specific insights",
        "• Ask about trends, comparisons, or performance metrics for deeper analysis"
      ],
      metrics: {
        "Status": "Processing",
        "Next Steps": "Refine your question"
      },
    };
  }

  async generateSuggestions(context: DataContext): Promise<string[]> {
    const columnNames = context.schema.columns.map((col: any) => col.name).join(', ');
    const prompt = `Based on this dataset structure, suggest 5 specific and actionable business questions a user might ask:
    
Dataset Information:
- Total records: ${context.rowCount}
- Available columns: ${columnNames}

Create questions that would reveal valuable business insights such as:
- Performance metrics (revenue, growth, profitability)
- Trends over time or across categories
- Customer or product segmentation
- Comparative analysis between groups
- Identification of opportunities or risks

Return ONLY a JSON array of question strings. NO other text, NO markdown formatting, NO explanations. Example format:
["What are the top 5 highest revenue products?", "Which region has the highest customer retention rate?", "Show quarterly sales trends for the past 2 years"]`;

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
      // Clean the response to remove any markdown formatting
      const cleanResponse = data.choices[0]?.message?.content?.replace(/```json|```/g, '').trim() || '[]';
      const suggestions = JSON.parse(cleanResponse);
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [
        'What are the top performing products by revenue?',
        'Show me sales trends over time',
        'Which customer segments generate the most value?',
        'Identify any seasonal patterns or anomalies',
        'What are the key factors driving customer satisfaction?'
      ];
    }
  }
}