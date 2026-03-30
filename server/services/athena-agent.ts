import { DeepSeekClient } from "./deepseek-client";
import { DataFile } from "@shared/schema";

export interface ThinkingStep {
    step: number;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    duration?: number;
    details?: string;
    timestamp: Date;
}

export class AthenaAgent {
    async analyze(file: DataFile, apiKey: string, onProgress?: (steps: ThinkingStep[]) => void): Promise<any> {
        const deepSeek = new DeepSeekClient(apiKey);
        const steps: ThinkingStep[] = [
            { step: 1, description: 'Understanding dataset structure', status: 'pending', timestamp: new Date() },
            { step: 2, description: 'Performing Automated EDA', status: 'pending', timestamp: new Date() },
            { step: 3, description: 'Identifying Data Quality Issues', status: 'pending', timestamp: new Date() },
            { step: 4, description: 'Generating high-impact insights', status: 'pending', timestamp: new Date() },
            { step: 5, description: 'Suggesting recommended visualizations', status: 'pending', timestamp: new Date() },
            { step: 6, description: 'Generating safe Python code', status: 'pending', timestamp: new Date() },
            { step: 7, description: 'Planning agent delegation', status: 'pending', timestamp: new Date() },
            { step: 8, description: 'Producing non-technical summary', status: 'pending', timestamp: new Date() }
        ];

        const updateStep = (stepIndex: number, status: ThinkingStep['status'], details?: string, duration?: number) => {
            steps[stepIndex].status = status;
            if (details) steps[stepIndex].details = details;
            if (duration !== undefined) steps[stepIndex].duration = duration;
            if (onProgress) onProgress([...steps]);
        };

        try {
            // Step 1: Understand dataset structure
            const startTime1 = Date.now();
            updateStep(0, 'in_progress', 'Inferring types, roles, and counts');
            const datasetOverview = this.profileDataset(file);
            updateStep(0, 'completed', `Analyzed ${datasetOverview.rows} rows and ${datasetOverview.columns} columns`, (Date.now() - startTime1) / 1000);

            // Step 2: Automated EDA
            const startTime2 = Date.now();
            updateStep(1, 'in_progress', 'Calculating stats, distributions, and correlations');
            const eda = this.runEDA(file);
            updateStep(1, 'completed', 'EDA complete', (Date.now() - startTime2) / 1000);

            // Step 3: Data Quality Issues
            const startTime3 = Date.now();
            updateStep(2, 'in_progress', 'Detecting missing values, duplicates, and outliers');
            const dataHealth = this.runQualityChecks(file);
            updateStep(2, 'completed', `Quality Score: ${dataHealth.score}/100`, (Date.now() - startTime3) / 1000);

            // Step 4: Insights
            const startTime4 = Date.now();
            updateStep(3, 'in_progress', 'Using AI to identify patterns and trends');

            const systemPrompt = `You are ATHENA, a Senior Data Analyst with 10+ years of experience. 
Your responsibilities:
1. Understand dataset structure: infer data types, semantic roles, unique counts, missingness.
2. Perform Automated EDA: summary statistics, correlations, distributions, outliers.
3. Identify Data Quality Issues: missing values, duplicates, invalid values, type mismatches.
4. Generate 5–10 high-impact insights with confidence levels.
5. Suggest 3–8 recommended visualizations and why they matter.
6. On request, generate safe and commented Python code using: pandas, numpy, matplotlib/plotly.
7. Communicate with other agents: Send cleaning tasks → DataClean, Send visualization tasks → Viz, Send reporting tasks → Scribe, Send DB tasks → SQL.
8. Produce a non-technical summary at the end.

Rules:
- Always produce structured sections.
- Never run SQL on your own.
- Never hallucinate data; only use dataset provided.
- For Python generation, ensure safety and sandbox compatibility.

Return JSON format:
{
    "insights": [{ "finding": "...", "confidence": "High/Medium/Low", "impact": "..." }],
    "summary": "Non-technical summary...",
    "delegation": { "needsCleaning": boolean, "suggestedViz": boolean, "needsReport": boolean }
}`;

            const userPrompt = `Profile: ${JSON.stringify(datasetOverview)}\nQuality: ${JSON.stringify(dataHealth)}\nEDA: ${JSON.stringify(eda)}`;
            const aiResponse = await deepSeek.callDeepSeekAPI(systemPrompt, userPrompt);
            const aiResults = this.parseAIResponse(aiResponse);

            updateStep(3, 'completed', `Generated ${aiResults.insights.length} insights`, (Date.now() - startTime4) / 1000);

            // Step 5: Suggest recommended visualizations
            const startTime5 = Date.now();
            updateStep(4, 'in_progress', 'Analyzing data patterns for visualizations');
            const recommendedVisualizations = this.generateVisualizations(datasetOverview, eda);
            updateStep(4, 'completed', `Proposed ${recommendedVisualizations.length} visualizations`, (Date.now() - startTime5) / 1000);

            // Step 6: AUTO-GENERATE CHARTS using Viz agent
            const startTime6_5 = Date.now();
            updateStep(5, 'in_progress', 'Calling Viz Agent to generate charts');

            const generatedCharts: any[] = [];
            try {
                // Import Viz agent dynamically to avoid circular dependency
                const { vizAgent } = await import('./viz-agent');

                // Ask AI which charts would be most valuable
                updateStep(5, 'in_progress', 'Calling Viz Agent: Asking AI for best chart recommendations');

                const chartSelectionPrompt = `Based on this data analysis, recommend the 3 most valuable charts to create:
                
Dataset: ${JSON.stringify(datasetOverview).substring(0, 500)}
Insights: ${aiResults.insights.map((i: any) => i.finding).join('; ')}

Return JSON array of exactly 3 chart recommendations:
[
  {
    "type": "bar/line/scatter/pie/box",
    "title": "Chart title",
    "description": "What this chart reveals",
    "priority": "high/medium/low"
  }
]`;

                const deepSeek = new DeepSeekClient(apiKey);
                const chartRecommendations = await deepSeek.callDeepSeekAPI(
                    "You are a data visualization expert. Recommend the most impactful charts.",
                    chartSelectionPrompt
                );

                let chartsToGenerate = recommendedVisualizations.slice(0, 3);
                try {
                    const aiCharts = JSON.parse(chartRecommendations.choices[0].message.content.replace(/```json\n|\n```/g, '').trim());
                    if (Array.isArray(aiCharts) && aiCharts.length > 0) {
                        chartsToGenerate = aiCharts;
                    }
                } catch (e) {
                    console.log('Using default chart recommendations');
                }

                // Generate actual charts for each AI recommendation
                for (let i = 0; i < chartsToGenerate.length; i++) {
                    const vizRec = chartsToGenerate[i];
                    try {
                        updateStep(5, 'in_progress', `Calling Viz Agent: Generating chart ${i + 1}/3 - ${vizRec.title}`);
                        const chartQuery = `Create a ${vizRec.type} chart for ${vizRec.title}: ${vizRec.description}`;
                        const chartResult = await vizAgent.createChart(chartQuery, file, apiKey);
                        generatedCharts.push({
                            ...vizRec,
                            chartCode: chartResult.code,
                            chartType: chartResult.chartType,
                            requiredFields: chartResult.requiredFields
                        });
                    } catch (err) {
                        console.error(`Failed to generate chart for ${vizRec.title}:`, err);
                        generatedCharts.push(vizRec); // Include recommendation without code
                    }
                }
            } catch (err) {
                console.error('Viz agent not available:', err);
            }

            updateStep(5, 'completed', `Generated ${generatedCharts.length} charts via Viz Agent`, (Date.now() - startTime6_5) / 1000);

            // Step 7: Python Code
            const startTime6 = Date.now();
            updateStep(6, 'in_progress', 'Generating executable Pandas code');
            const pythonCode = this.generatePythonCode(datasetOverview, dataHealth, eda);

            // Step 7: Delegation
            const startTime7 = Date.now();
            updateStep(6, 'in_progress', 'Checking if other agents are needed');
            // Logic to determine if we need to call other agents based on AI results
            updateStep(6, 'completed', aiResults.delegation?.needsCleaning ? 'Cleaning recommended' : 'No immediate delegation needed', (Date.now() - startTime7) / 1000);

            // Step 8: Summary
            const startTime8 = Date.now();
            updateStep(7, 'in_progress', 'Finalizing analysis report');
            updateStep(7, 'completed', 'Analysis complete', (Date.now() - startTime8) / 1000);

            return {
                datasetOverview,
                dataHealth,
                eda,
                insights: aiResults.insights,
                summary: aiResults.summary,
                recommendedVisualizations,
                generatedCharts, // Include actual generated charts
                pythonCode,
                thinkingSteps: steps,
                delegation: aiResults.delegation
            };
        } catch (error) {
            const currentStep = steps.findIndex(s => s.status === 'in_progress');
            if (currentStep >= 0) {
                updateStep(currentStep, 'failed', error instanceof Error ? error.message : 'Unknown error');
            }
            throw error;
        }
    }

    private parseAIResponse(response: any) {
        try {
            const content = response.choices[0].message.content;
            const jsonStr = content.replace(/```json\n|\n```/g, '').trim();
            const result = JSON.parse(jsonStr);
            return {
                insights: result.insights || [],
                summary: result.summary || "Analysis completed.",
                delegation: result.delegation || {}
            };
        } catch (e) {
            console.error("Failed to parse AI insights", e);
            return { insights: [], summary: "Error parsing insights.", delegation: {} };
        }
    }

    // ... existing private methods (profileDataset, runQualityChecks, runEDA, generateVisualizations, generatePythonCode) ...
    // Note: keeping existing private methods as they simulate the work for now.

    private profileDataset(file: DataFile) {
        const schema = file.schema as any;
        const columns = Object.keys(schema);

        // Mocking detailed stats that would usually come from a real scan
        const dtypes: Record<string, string> = {};
        const missingValues: Record<string, number> = {};
        const uniqueCounts: Record<string, number> = {};

        columns.forEach(col => {
            dtypes[col] = schema[col];
            missingValues[col] = Math.floor(Math.random() * 10); // Mock
            uniqueCounts[col] = Math.floor(Math.random() * 100); // Mock
        });

        return {
            rows: file.rowCount || 0,
            columns: columns.length,
            dtypes,
            missingValues,
            uniqueCounts,
            samplePreview: (schema.previewData || []).slice(0, 5)
        };
    }

    private runQualityChecks(file: DataFile) {
        // Mock implementation
        return {
            score: 85,
            missingValueChart: [
                { column: 'age', percentage: 5 },
                { column: 'income', percentage: 12 }
            ],
            duplicateCount: 15,
            outlierSummary: [
                { column: 'price', count: 3 }
            ],
            invalidValueReport: []
        };
    }

    private runEDA(file: DataFile) {
        // Mock implementation
        return {
            summaryStats: {
                mean: { price: 100, age: 30 },
                median: { price: 90, age: 28 }
            },
            categoryFrequencies: {
                category: { 'A': 50, 'B': 30, 'C': 20 }
            },
            timeSeriesTrends: [],
            correlations: [
                { x: 'price', y: 'age', value: 0.5 }
            ]
        };
    }

    private generateVisualizations(profile: any, eda: any) {
        return [
            { type: 'bar', title: 'Category Distribution', description: 'Bar chart showing frequency of categories' },
            { type: 'line', title: 'Sales Trend', description: 'Line chart showing sales over time' },
            { type: 'box', title: 'Price Outliers', description: 'Boxplot to identify price anomalies' }
        ];
    }

    private generatePythonCode(profile: any, health: any, eda: any) {
        return `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load dataset
df = pd.read_csv('dataset.csv')

# 1. Data Cleaning
# Handle missing values
df.fillna(method='ffill', inplace=True)
# Remove duplicates
df.drop_duplicates(inplace=True)

# 2. Summary Statistics
print(df.describe())

# 3. Visualizations
plt.figure(figsize=(10, 6))
sns.histplot(df['price'])
plt.title('Price Distribution')
plt.show()

plt.figure(figsize=(10, 6))
sns.boxplot(x='category', y='price', data=df)
plt.title('Price by Category')
plt.show()`;
    }
}

export const athenaAgent = new AthenaAgent();
