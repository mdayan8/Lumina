import { DeepSeekClient } from './deepseek-client';

export interface DataQualityIssue {
    type: 'missing_values' | 'duplicates' | 'outliers' | 'inconsistent_types' | 'invalid_values';
    column: string;
    severity: 'high' | 'medium' | 'low';
    count: number;
    percentage: number;
    description: string;
    suggestedFix: string;
}

export interface DataCleaningReport {
    totalRows: number;
    totalColumns: number;
    issues: DataQualityIssue[];
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
    autoFixable: boolean;
}

export class DataCleanAgent {
    private static instance: DataCleanAgent;

    private constructor() { }

    public static getInstance(): DataCleanAgent {
        if (!DataCleanAgent.instance) {
            DataCleanAgent.instance = new DataCleanAgent();
        }
        return DataCleanAgent.instance;
    }

    async analyzeDataQuality(schema: any, previewData: any[]): Promise<DataCleaningReport> {
        const issues: DataQualityIssue[] = [];
        const totalRows = schema.totalRows || previewData.length;
        const totalColumns = schema.columns?.length || 0;

        // Analyze each column
        for (const column of schema.columns || []) {
            // Check for missing values
            const missingCount = this.countMissingValues(column, previewData);
            if (missingCount > 0) {
                const percentage = (missingCount / totalRows) * 100;
                issues.push({
                    type: 'missing_values',
                    column: column.name,
                    severity: percentage > 50 ? 'high' : percentage > 20 ? 'medium' : 'low',
                    count: missingCount,
                    percentage,
                    description: `${percentage.toFixed(1)}% of values are missing`,
                    suggestedFix: percentage > 50
                        ? 'Consider dropping this column or using advanced imputation'
                        : 'Fill with mean/median for numeric, mode for categorical'
                });
            }

            // Check for duplicates (only for first column as identifier)
            if (schema.columns.indexOf(column) === 0) {
                const duplicateCount = this.countDuplicates(column, previewData);
                if (duplicateCount > 0) {
                    issues.push({
                        type: 'duplicates',
                        column: column.name,
                        severity: duplicateCount > totalRows * 0.1 ? 'high' : 'low',
                        count: duplicateCount,
                        percentage: (duplicateCount / totalRows) * 100,
                        description: `${duplicateCount} duplicate rows found`,
                        suggestedFix: 'Remove duplicate rows keeping first occurrence'
                    });
                }
            }

            // Check for outliers (numeric columns only)
            if (column.type === 'number') {
                const outlierInfo = this.detectOutliers(column, previewData);
                if (outlierInfo.count > 0) {
                    issues.push({
                        type: 'outliers',
                        column: column.name,
                        severity: outlierInfo.count > totalRows * 0.05 ? 'medium' : 'low',
                        count: outlierInfo.count,
                        percentage: (outlierInfo.count / totalRows) * 100,
                        description: `${outlierInfo.count} potential outliers detected`,
                        suggestedFix: 'Review outliers - may be valid extreme values or errors'
                    });
                }
            }
        }

        // Determine overall quality
        const highSeverityCount = issues.filter(i => i.severity === 'high').length;
        const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length;

        let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
        if (highSeverityCount > 0) {
            overallQuality = 'poor';
        } else if (mediumSeverityCount > 2) {
            overallQuality = 'fair';
        } else if (issues.length > 0) {
            overallQuality = 'good';
        } else {
            overallQuality = 'excellent';
        }

        // Generate recommendations
        const recommendations = this.generateRecommendations(issues, overallQuality);

        return {
            totalRows,
            totalColumns,
            issues,
            overallQuality,
            recommendations,
            autoFixable: issues.every(i => i.severity !== 'high')
        };
    }

    async generateCleaningPlan(report: DataCleaningReport, apiKey: string): Promise<any> {
        const deepSeek = new DeepSeekClient(apiKey);

        const systemPrompt = `You are DATACLEAN, the Data Cleaning Specialist.

Your tasks:
1. Detect missing values, duplicates, incorrect types, outliers.
2. Produce a Cleaning Plan:
   - missing value strategy (mean/median/mode, or removal)
   - type correction plan
   - duplicate handling
   - outlier strategy
3. Provide BEFORE/AFTER cleaning previews.
4. Generate Python code for cleaning using:
   - pandas
   - numpy
5. Return cleaned dataset as artifact for Athena/Viz/Scribe.

Rules:
- Never modify original data without user confirmation.
- Suggest safest cleaning method first.
- Communicate back to ATHENA after cleaning so she can re-analyse.

Return JSON format:
{
    "cleaningPlan": [
        { "issue": "Missing Values in Age", "action": "Impute with Median", "impact": "Preserves data distribution" }
    ],
    "pythonCode": "import pandas as pd...",
    "beforeAfterPreview": {
        "before": "...",
        "after": "..."
    }
}`;

        const userPrompt = `Analyze this data quality report and generate a cleaning plan: ${JSON.stringify(report)}`;

        try {
            const response = await deepSeek.callDeepSeekAPI(systemPrompt, userPrompt);
            return this.parseResponse(response);
        } catch (error) {
            console.error("DataClean Agent failed:", error);
            throw new Error("Failed to generate cleaning plan");
        }
    }

    private parseResponse(response: any): any {
        try {
            const content = response.choices[0].message.content;
            const jsonStr = content.replace(/```json\n|\n```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse DataClean response", e);
            return {
                cleaningPlan: [],
                pythonCode: "# Failed to generate code",
                beforeAfterPreview: {}
            };
        }
    }

    private countMissingValues(column: any, data: any[]): number {
        let count = 0;
        for (const row of data) {
            const value = row[column.name];
            if (value === null || value === undefined || value === '' || value === 'null' || value === 'NULL') {
                count++;
            }
        }
        return count;
    }

    private countDuplicates(column: any, data: any[]): number {
        const seen = new Set();
        let duplicates = 0;
        for (const row of data) {
            const value = row[column.name];
            if (seen.has(value)) {
                duplicates++;
            } else {
                seen.add(value);
            }
        }
        return duplicates;
    }

    private detectOutliers(column: any, data: any[]): { count: number; outliers: number[] } {
        const values = data
            .map(row => row[column.name])
            .filter(v => v !== null && v !== undefined && !isNaN(v))
            .map(v => parseFloat(v));

        if (values.length === 0) return { count: 0, outliers: [] };

        // Use IQR method
        values.sort((a, b) => a - b);
        const q1 = values[Math.floor(values.length * 0.25)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outliers = values.filter(v => v < lowerBound || v > upperBound);

        return {
            count: outliers.length,
            outliers: outliers.slice(0, 10) // Return first 10 outliers
        };
    }

    private generateRecommendations(issues: DataQualityIssue[], quality: string): string[] {
        const recommendations: string[] = [];

        if (quality === 'poor') {
            recommendations.push('⚠️ Critical: This dataset has significant quality issues that should be addressed before analysis');
        }

        const missingIssues = issues.filter(i => i.type === 'missing_values');
        if (missingIssues.length > 0) {
            recommendations.push(`📊 Handle missing values in ${missingIssues.length} column(s)`);
        }

        const duplicateIssues = issues.filter(i => i.type === 'duplicates');
        if (duplicateIssues.length > 0) {
            recommendations.push(`🔄 Remove ${duplicateIssues[0].count} duplicate rows`);
        }

        const outlierIssues = issues.filter(i => i.type === 'outliers');
        if (outlierIssues.length > 0) {
            recommendations.push(`📈 Review outliers in ${outlierIssues.length} numeric column(s)`);
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ Data quality is good! Ready for analysis');
        }

        return recommendations;
    }
}

export const dataCleanAgent = DataCleanAgent.getInstance();
