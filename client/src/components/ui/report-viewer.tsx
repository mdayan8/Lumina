import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, X, Printer, Share2 } from 'lucide-react';
import { ChartRenderer } from '@/components/ui/chart-renderer';
import { downloadPDF, downloadMarkdown, downloadJSON } from '@/lib/download-utils';

interface ReportViewerProps {
    reportData: any;
    chartData?: any; // Single chart or array of charts
    onClose?: () => void;
}

export function ReportViewer({ reportData, chartData, onClose }: ReportViewerProps) {
    const reportRef = useRef<HTMLDivElement>(null);

    // Normalize charts to array
    const charts = Array.isArray(chartData) ? chartData : (chartData ? [chartData] : []);

    // Also check if reportData has charts in metadata or elsewhere
    const allCharts = [
        ...charts,
        ...(reportData.generatedCharts || []),
        ...(reportData.recommendedVisualizations || [])
    ].filter((v, i, a) => a.findIndex(t => t.title === v.title) === i); // Deduplicate by title

    const handleDownloadPDF = async () => {
        // We can pass the rendered element ref to the PDF generator if we update it to support it
        // For now, we'll use the existing data-based generator but ensure charts are captured from DOM
        await downloadPDF({
            ...reportData,
            generatedCharts: allCharts
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            {reportData.reportContent?.title || 'Analysis Report'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                            <span>{new Date(reportData.metadata?.generatedAt || Date.now()).toLocaleDateString()}</span>
                            <Badge variant="outline" className="text-xs">
                                {reportData.metadata?.reportType?.replace(/_/g, ' ').toUpperCase() || 'REPORT'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">ID: {reportData.metadata?.analysisId || 'N/A'}</span>
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadMarkdown(reportData)}>
                            MD
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadJSON(reportData)}>
                            JSON
                        </Button>
                        <Button variant="default" size="sm" onClick={handleDownloadPDF} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export PDF
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-8 bg-white dark:bg-zinc-950">
                    <div ref={reportRef} className="max-w-4xl mx-auto space-y-8 pb-20 font-serif text-foreground">
                        {/* Abstract / Executive Summary */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold border-b pb-2 text-primary">Abstract</h2>
                            <div className="text-lg leading-relaxed text-muted-foreground bg-muted/20 p-6 rounded-lg border border-border/50 italic">
                                {reportData.executiveSummary}
                            </div>
                        </section>

                        {/* Dynamic Sections */}
                        {reportData.reportContent?.sections?.map((section: any, index: number) => (
                            <section key={index} className="space-y-4">
                                <h2 className="text-2xl font-bold border-b pb-2 text-primary">{section.heading}</h2>
                                <div className="prose dark:prose-invert max-w-none text-base leading-7 whitespace-pre-wrap">
                                    {section.content}
                                </div>

                                {/* Render charts if this is the Visualizations section */}
                                {(section.heading.toLowerCase().includes('visualization') || section.heading.toLowerCase().includes('chart')) && allCharts.length > 0 && (
                                    <div className="grid grid-cols-1 gap-8 mt-6">
                                        {allCharts.map((chart: any, i: number) => (
                                            <div key={i} className="border rounded-xl p-4 bg-card shadow-sm break-inside-avoid" data-chart-title={chart.title}>
                                                <h3 className="text-lg font-semibold mb-2 text-center">Figure {i + 1}: {chart.title}</h3>
                                                <div className="h-[350px] w-full">
                                                    <ChartRenderer
                                                        type={chart.chartType || chart.type}
                                                        data={chart.data}
                                                        title=""
                                                        description=""
                                                    />
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-3 text-center italic">
                                                    {chart.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}

                        {/* Recommendations */}
                        {reportData.reportContent?.recommendations?.length > 0 && (
                            <section className="space-y-4 break-before-page">
                                <h2 className="text-2xl font-bold border-b pb-2 text-primary">Recommendations</h2>
                                <div className="grid gap-4">
                                    {reportData.reportContent.recommendations.map((rec: string, i: number) => (
                                        <div key={i} className="flex gap-4 items-start p-4 rounded-lg border bg-card/50">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {i + 1}
                                            </div>
                                            <p className="mt-1">{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Next Steps */}
                        {reportData.reportContent?.nextSteps?.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold border-b pb-2 text-primary">Next Steps</h2>
                                <ul className="space-y-2 list-disc pl-5 marker:text-primary">
                                    {reportData.reportContent.nextSteps.map((step: string, i: number) => (
                                        <li key={i} className="pl-2">{step}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                            <p>Generated by Lumina Analytics • {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </ScrollArea>
            </Card>
        </div>
    );
}
