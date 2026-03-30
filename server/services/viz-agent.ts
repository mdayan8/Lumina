import { DeepSeekClient } from "./deepseek-client";
import { DataFile } from "@shared/schema";

export interface VizResult {
    chartType: string;
    description: string;
    code: string;
    requiredFields: string[];
}

export class VizAgent {
    async createChart(query: string, file: DataFile, apiKey: string): Promise<VizResult> {
        const deepSeek = new DeepSeekClient(apiKey);
        const schema = file.schema as any;
        const columns = Object.keys(schema).join(', ');

        const systemPrompt = `You are VIZ, the Visualization Specialist.

Your tasks:
1. Choose best chart type based on: data types, cardinality, relationships, user goal.
2. Generate visualizations using: plotly (preferred) or matplotlib.
3. Provide:
   - a chart preview (description)
   - explanation why chart is appropriate
   - readable Python code to reproduce the chart
4. Allow adding visuals to Dashboards and Reports.

Rules:
- Always validate that required columns exist.
- If asked for dashboard, compile multiple visuals.
- Never hallucinate insights; rely strictly on dataset.

Return JSON format:
{
    "chartType": "bar/line/scatter/etc",
    "description": "Explanation of why this chart is appropriate...",
    "code": "import plotly.express as px\\nfig = px.bar(df, ...)",
    "requiredFields": ["col1", "col2"],
    "dashboardCompatible": boolean
}`;

        const userPrompt = `Query: "${query}"\nDataset Columns: ${columns}\nSchema: ${JSON.stringify(schema)}`;

        try {
            const response = await deepSeek.callDeepSeekAPI(systemPrompt, userPrompt);
            return this.parseResponse(response);
        } catch (error) {
            console.error("Viz Agent failed:", error);
            throw new Error("Failed to generate visualization");
        }
    }

    private parseResponse(response: any): VizResult {
        try {
            const content = response.choices[0].message.content;
            const jsonStr = content.replace(/```json\n|\n```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse Viz response", e);
            // Fallback
            return {
                chartType: "bar",
                description: "Could not generate specific chart, defaulting to simple bar chart.",
                code: "import plotly.express as px\n# Error generating code\nfig = px.bar(df, x=df.columns[0], y=df.columns[1])",
                requiredFields: []
            };
        }
    }
}

export const vizAgent = new VizAgent();
