import { DeepSeekClient } from "./deepseek-client";
import { DeepSeekResponse } from "./deepseek-client";

export interface SQLQueryResult {
  query: string;
  explanation: string;
  result: any[];
  columns: string[];
}

export class SQLGenerator {
  private deepSeekClient: DeepSeekClient;

  constructor(apiKey: string) {
    this.deepSeekClient = new DeepSeekClient(apiKey);
  }

  async generateSQLQuery(naturalLanguageQuery: string, context: any): Promise<SQLQueryResult> {
    const systemPrompt = this.buildSQLSystemPrompt(context);
    const userPrompt = this.buildSQLUserPrompt(naturalLanguageQuery, context);

    try {
      // First, generate the SQL query
      const sqlResponse = await this.deepSeekClient.callDeepSeekAPI(systemPrompt, userPrompt);
      const parsedSQL = this.parseSQLResponse(sqlResponse);

      // Then, explain the query in business terms
      const explanationPrompt = this.buildExplanationPrompt(parsedSQL.query, context);
      const explanationResponse = await this.deepSeekClient.callDeepSeekAPI(
        "You are a data analyst that explains SQL queries in simple business terms.",
        explanationPrompt
      );
      
      return {
        query: parsedSQL.query,
        explanation: explanationResponse.choices[0]?.message?.content || "No explanation available",
        result: [], // This would be populated by executing the query against the actual data
        columns: parsedSQL.columns
      };
    } catch (error) {
      console.error('SQL Generation error:', error);
      throw new Error(`Failed to generate SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSQLSystemPrompt(context: any): string {
    return `You are an expert SQL generator that translates natural language questions into accurate PostgreSQL queries.

Data Context:
- Table structure: ${JSON.stringify(context.schema.columns, null, 2)}
- Total rows: ${context.rowCount}
- File name: ${context.filename}

CRITICAL RULES:
1. ONLY generate valid PostgreSQL syntax
2. ONLY use column names that exist in the schema
3. NEVER use backticks or MySQL-specific syntax
4. ALWAYS use double quotes for column names with spaces or special characters
5. NEVER include sample data values in the query
6. Format your response as JSON with this EXACT structure:
{
  "query": "SELECT column1, column2 FROM table WHERE condition",
  "columns": ["column1", "column2"]
}

Example response:
{
  "query": "SELECT \\"PRODUCTLINE\\", SUM(\\"SALES\\") as total_sales FROM data GROUP BY \\"PRODUCTLINE\\" ORDER BY total_sales DESC LIMIT 5",
  "columns": ["PRODUCTLINE", "total_sales"]
}`;
  }

  private buildSQLUserPrompt(query: string, context: any): string {
    return `Translate this natural language question into a PostgreSQL query:
"${query}"

Use the table structure provided in the system prompt. Return ONLY the JSON format specified.
Do not include any explanations, markdown, or additional text.`;
  }

  private buildExplanationPrompt(sqlQuery: string, context: any): string {
    return `Explain this SQL query in simple business terms:
"${sqlQuery}"

Data context:
- File: ${context.filename}
- Rows: ${context.rowCount}

Explain what insights this query would provide to a non-technical business user. Keep it concise and actionable.`;
  }

  private parseSQLResponse(response: DeepSeekResponse): { query: string; columns: string[] } {
    try {
      // Clean the response to remove any markdown formatting
      const cleanResponse = response.choices[0]?.message?.content?.replace(/```json|```/g, '').trim() || '{}';
      const parsed = JSON.parse(cleanResponse);
      
      return {
        query: parsed.query || '',
        columns: parsed.columns || []
      };
    } catch (error) {
      console.error('Error parsing SQL response:', error);
      throw new Error('Failed to parse SQL generation response');
    }
  }
}