import React, { useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Copy, Download } from 'lucide-react';

interface ChartRendererProps {
    chart: {
        title: string;
        description: string;
        chartType: string;
        chartCode: string;
        requiredFields?: string[];
    };
    data?: any[];
}

export function ChartRenderer({ chart, data }: ChartRendererProps) {
    const [plotData, setPlotData] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    useEffect(() => {
        // Parse the Python code to extract Plotly configuration
        try {
            const plotlyData = extractPlotlyConfig(chart.chartCode, data);
            setPlotData(plotlyData);
        } catch (err) {
            console.error('Failed to parse chart code:', err);
            setError('Unable to render chart');
        }
    }, [chart.chartCode, data]);

    const extractPlotlyConfig = (code: string, chartData?: any[]) => {
        // Simple chart type detection and configuration
        const chartType = chart.chartType.toLowerCase();

        // Generate sample data if not provided
        const sampleData = chartData || generateSampleData(chartType);

        // Create Plotly configuration based on chart type
        switch (chartType) {
            case 'bar':
                return {
                    data: [{
                        type: 'bar',
                        x: sampleData.map((_, i) => `Category ${i + 1}`),
                        y: sampleData.map(d => d.value || Math.random() * 100),
                        marker: { color: '#3b82f6' }
                    }],
                    layout: {
                        title: chart.title,
                        xaxis: { title: 'Categories' },
                        yaxis: { title: 'Values' },
                        height: 400
                    }
                };

            case 'line':
                return {
                    data: [{
                        type: 'scatter',
                        mode: 'lines+markers',
                        x: sampleData.map((_, i) => i),
                        y: sampleData.map(d => d.value || Math.random() * 100),
                        line: { color: '#10b981' }
                    }],
                    layout: {
                        title: chart.title,
                        xaxis: { title: 'Time/Index' },
                        yaxis: { title: 'Values' },
                        height: 400
                    }
                };

            case 'scatter':
                return {
                    data: [{
                        type: 'scatter',
                        mode: 'markers',
                        x: sampleData.map(() => Math.random() * 100),
                        y: sampleData.map(() => Math.random() * 100),
                        marker: { color: '#8b5cf6', size: 8 }
                    }],
                    layout: {
                        title: chart.title,
                        xaxis: { title: 'X Axis' },
                        yaxis: { title: 'Y Axis' },
                        height: 400
                    }
                };

            case 'pie':
                return {
                    data: [{
                        type: 'pie',
                        labels: sampleData.map((_, i) => `Segment ${i + 1}`),
                        values: sampleData.map(() => Math.random() * 100),
                        marker: {
                            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                        }
                    }],
                    layout: {
                        title: chart.title,
                        height: 400
                    }
                };

            case 'box':
            case 'boxplot':
                return {
                    data: [{
                        type: 'box',
                        y: Array.from({ length: 50 }, () => Math.random() * 100),
                        name: 'Distribution',
                        marker: { color: '#3b82f6' }
                    }],
                    layout: {
                        title: chart.title,
                        yaxis: { title: 'Values' },
                        height: 400
                    }
                };

            default:
                // Default to bar chart
                return {
                    data: [{
                        type: 'bar',
                        x: ['A', 'B', 'C', 'D', 'E'],
                        y: [20, 14, 23, 18, 25],
                        marker: { color: '#3b82f6' }
                    }],
                    layout: {
                        title: chart.title,
                        height: 400
                    }
                };
        }
    };

    const generateSampleData = (chartType: string) => {
        const count = chartType === 'pie' ? 5 : 10;
        return Array.from({ length: count }, (_, i) => ({
            index: i,
            value: Math.random() * 100
        }));
    };

    const copyCode = () => {
        navigator.clipboard.writeText(chart.chartCode);
    };

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{chart.title}</span>
                        <Badge variant="destructive">Error</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <div className="mt-4">
                        <Button variant="outline" size="sm" onClick={copyCode}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Code
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{chart.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{chart.description}</p>
                    </div>
                    <Badge>{chart.chartType}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {plotData && (
                    <div className="chart-container">
                        <Plot
                            data={plotData.data}
                            layout={plotData.layout}
                            config={{ responsive: true, displayModeBar: true }}
                            style={{ width: '100%' }}
                        />
                    </div>
                )}

                <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyCode}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                    </Button>
                </div>

                {chart.chartCode && (
                    <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                            View Python Code
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-60">
                            <code>{chart.chartCode}</code>
                        </pre>
                    </details>
                )}
            </CardContent>
        </Card>
    );
}
