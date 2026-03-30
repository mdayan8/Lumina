import { DeepSeekClient } from "./deepseek-client";
import { DataFile } from "@shared/schema";

export interface SQLResult {
    query: string;
    explanation: string;
    preview: any[];
    schemaNotes: string;
    relationshipExplanation: string;
}

export class SQLAgent {
    async generateQuery(query: string, file: DataFile, apiKey: string): Promise<SQLResult> {
        const deepSeek = new DeepSeekClient(apiKey);
        const schema = file.schema as any;
        const columns = Object.keys(schema).join(', ');

        const systemPrompt = `You are SQL, the Query Generator Agent.

Your tasks:
1. Convert natural language into safe, optimized SQL queries.
2. Analyze DB schema to ensure column/table validity.
3. Suggest joins, aggregates, filters when needed.
4. ALWAYS show:
   - SQL query
   - Explanation
   - Expected output structure
5. NEVER run SQL automatically; user must approve execution.
6. Use parameterized SQL only.
7. Detect ambiguous queries and ask clarifying questions.

Return JSON format:
{
    "query": "SELECT * FROM table WHERE ...",
    "explanation": "I am selecting ...",
    "preview": [{"col1": "val1", "col2": 100}],
    "schemaNotes": "Note: 'date' column is stored as string...",
    "relationshipExplanation": "Assuming 'user_id' links to users table...",
    "isSafe": boolean,
    "requiresApproval": true
}`;

        const userPrompt = `Query: "${query}"\nDataset Columns: ${columns}\nSchema: ${JSON.stringify(schema)}`;

        try {
            const response = await deepSeek.callDeepSeekAPI(systemPrompt, userPrompt);
            return this.parseResponse(response);
        } catch (error) {
            console.error("SQL Agent failed:", error);
            throw new Error("Failed to generate SQL query");
        }
    }

    private parseResponse(response: any): SQLResult {
        try {
            const content = response.choices[0].message.content;
            const jsonStr = content.replace(/```json\n|\n```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse SQL response", e);
            return {
                query: "SELECT * FROM dataset LIMIT 10;",
                explanation: "Could not generate specific query, defaulting to SELECT *.",
                preview: [],
                schemaNotes: "N/A",
                relationshipExplanation: "N/A"
            };
        }
    }
}

export const sqlAgent = new SQLAgent();
