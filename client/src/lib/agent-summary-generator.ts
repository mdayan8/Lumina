/**
 * Utility functions to generate concise summaries for agent responses in chat
 */

export interface AgentSummaryResult {
    summary: string;
    highlights: string[];
    metrics?: Record<string, string | number>;
    chartData?: any;
    reportData?: any;
}

/**
 * Generate a concise summary for Athena agent results
 */
export function generateAthenaSummary(results: any): AgentSummaryResult {
    const insights = results.insights || [];
    const insightCount = insights.length;

    let summary = '';
    const highlights: string[] = [];
    const metrics: Record<string, string | number> = {};

    if (results.summary) {
        // Use first 150 characters of the summary
        summary = results.summary.length > 150
            ? results.summary.substring(0, 150) + '...'
            : results.summary;
    } else if (insightCount > 0) {
        summary = `Identified ${insightCount} key insight${insightCount > 1 ? 's' : ''} from your data analysis.`;
    } else {
        summary = 'Analysis completed successfully.';
    }

    // Add top insights as highlights
    if (insights.length > 0) {
        highlights.push(...insights.slice(0, 3).map((insight: any) =>
            insight.finding || insight.type || 'Key finding'
        ));
    }

    // Add metrics
    metrics['Insights'] = insightCount;
    if (results.recommendedVisualizations) {
        metrics['Recommended Charts'] = results.recommendedVisualizations.length;
    }

    return { summary, highlights, metrics };
}

/**
 * Generate a concise summary for Scribe agent results
 */
export function generateScribeSummary(results: any): AgentSummaryResult {
    const highlights: string[] = [];
    const metrics: Record<string, string | number> = {};

    let summary = '';

    if (results.executiveSummary) {
        // Use first 150 characters
        summary = results.executiveSummary.length > 150
            ? results.executiveSummary.substring(0, 150) + '...'
            : results.executiveSummary;
    } else if (results.reportContent?.executiveSummary) {
        summary = results.reportContent.executiveSummary.length > 150
            ? results.reportContent.executiveSummary.substring(0, 150) + '...'
            : results.reportContent.executiveSummary;
    } else {
        summary = 'Report generated successfully with comprehensive analysis.';
    }

    // Add sections count
    if (results.reportContent?.sections) {
        metrics['Sections'] = results.reportContent.sections.length;
        highlights.push(...results.reportContent.sections.slice(0, 2).map((s: any) => s.heading));
    }

    if (results.reportContent?.recommendations) {
        metrics['Recommendations'] = results.reportContent.recommendations.length;
    }

    // Pass the full results as reportData for download
    return { summary, highlights, metrics, reportData: results };
}

/**
 * Generate a concise summary for Viz agent results
 */
export function generateVizSummary(results: any): AgentSummaryResult {
    const highlights: string[] = [];
    const metrics: Record<string, string | number> = {};

    let summary = '';

    if (results.description) {
        summary = results.description.length > 150
            ? results.description.substring(0, 150) + '...'
            : results.description;
    } else if (results.chartType) {
        summary = `Generated ${results.chartType} visualization for your data.`;
    } else {
        summary = 'Visualization created successfully.';
    }

    if (results.chartType) {
        metrics['Chart Type'] = results.chartType;
    }

    if (results.generatedCharts) {
        metrics['Charts Created'] = results.generatedCharts.length;
        highlights.push(...results.generatedCharts.slice(0, 2).map((c: any) =>
            c.title || c.chartType || 'Chart'
        ));
    }

    // Extract chart data if available (single chart or first of generated charts)
    let chartData = undefined;
    if (results.chart) {
        chartData = results.chart;
    } else if (results.generatedCharts && results.generatedCharts.length > 0) {
        chartData = results.generatedCharts[0];
    }

    return { summary, highlights, metrics, chartData };
}

/**
 * Generate a concise summary for SQL agent results
 */
export function generateSQLSummary(results: any): AgentSummaryResult {
    const highlights: string[] = [];
    const metrics: Record<string, string | number> = {};

    let summary = '';

    if (results.explanation) {
        summary = results.explanation.length > 150
            ? results.explanation.substring(0, 150) + '...'
            : results.explanation;
    } else {
        summary = 'SQL query generated successfully.';
    }

    if (results.rows !== undefined) {
        metrics['Rows'] = results.rows;
    }

    if (results.query) {
        // Extract query type (SELECT, INSERT, etc.)
        const queryType = results.query.trim().split(' ')[0].toUpperCase();
        highlights.push(`${queryType} query generated`);
    }

    return { summary, highlights, metrics };
}

/**
 * Generate a concise summary for DataClean agent results
 */
export function generateDataCleanSummary(results: any): AgentSummaryResult {
    const highlights: string[] = [];
    const metrics: Record<string, string | number> = {};

    let summary = 'Data quality analysis completed.';

    if (results.qualityReport) {
        const report = results.qualityReport;

        if (report.overallScore !== undefined) {
            metrics['Quality Score'] = `${Math.round(report.overallScore)}%`;
            summary = `Data quality score: ${Math.round(report.overallScore)}%. `;
        }

        if (report.issues && report.issues.length > 0) {
            metrics['Issues Found'] = report.issues.length;
            summary += `Found ${report.issues.length} issue${report.issues.length > 1 ? 's' : ''} to address.`;

            // Add top issues as highlights
            highlights.push(...report.issues.slice(0, 3).map((issue: any) =>
                issue.description || issue.type || 'Data quality issue'
            ));
        } else {
            summary += 'No critical issues found.';
        }
    }

    return { summary, highlights, metrics };
}

/**
 * Main function to generate summary based on agent type
 */
export function generateAgentSummary(agentId: string, results: any): AgentSummaryResult {
    switch (agentId) {
        case 'athena':
            return generateAthenaSummary(results);
        case 'scribe':
            return generateScribeSummary(results);
        case 'viz':
            return generateVizSummary(results);
        case 'sql':
            return generateSQLSummary(results);
        case 'dataclean':
            return generateDataCleanSummary(results);
        default:
            return {
                summary: 'Analysis completed successfully.',
                highlights: [],
                metrics: {}
            };
    }
}
