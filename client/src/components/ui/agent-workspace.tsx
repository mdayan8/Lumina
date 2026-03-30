import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Activity, BarChart2, Lightbulb, Code, Play, CheckCircle, AlertTriangle, ArrowRight, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AgentThinkingSteps, ThinkingStep } from "./agent-thinking-steps";

interface AgentWorkspaceProps {
    fileId: string;
    userId: string;
    apiKey: string;
}

export function AgentWorkspace({ fileId, userId, apiKey }: AgentWorkspaceProps) {
    const [session, setSession] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[] | null>(null);
    const { toast } = useToast();

    const startAutoAgent = async () => {
        setIsAnalyzing(true);
        setThinkingSteps(null);
        try {
            const response = await fetch('/api/agents/auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId, apiKey })
            });
            const data = await response.json();

            if (data.success) {
                setSession({ results: data.result });
                if (data.result.thinkingSteps) {
                    setThinkingSteps(data.result.thinkingSteps);
                }
                toast({
                    title: "Analysis Complete",
                    description: "Athena has finished the autonomous analysis.",
                });
            } else {
                throw new Error(data.error || "Analysis failed");
            }
        } catch (error) {
            console.error("Auto Agent failed:", error);
            toast({
                variant: "destructive",
                title: "Analysis Failed",
                description: error instanceof Error ? error.message : "Something went wrong.",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!session && !isAnalyzing) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-background/50 backdrop-blur-sm">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Lightbulb className="w-12 h-12 text-primary opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Athena — Senior Data Analyst</h3>
                <p className="max-w-md mb-8 text-sm">
                    Automated EDA, insights & visual summaries. Athena will perform a complete audit of your dataset.
                </p>
                <Button size="lg" onClick={startAutoAgent} className="gradient-button">
                    <Play className="w-4 h-4 mr-2" />
                    Start Auto Analysis
                </Button>
            </div>
        );
    }

    if (isAnalyzing) {
        return (
            <div className="h-full p-8 bg-background/50 backdrop-blur-sm overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                Athena is analyzing...
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {thinkingSteps ? (
                                <AgentThinkingSteps steps={thinkingSteps} />
                            ) : (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const { datasetOverview, dataHealth, eda, insights, recommendedVisualizations, pythonCode } = session.results;

    return (
        <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-card/50">
                <div>
                    <h2 className="text-lg font-semibold flex items-center">
                        <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mr-2">
                            <Lightbulb className="w-5 h-5 text-primary" />
                        </span>
                        Athena Analysis
                    </h2>
                    <p className="text-xs text-muted-foreground ml-10">Automated EDA & Insights</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={startAutoAgent}>
                        <Play className="w-4 h-4 mr-2" />
                        Re-run
                    </Button>
                    <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="max-w-5xl mx-auto space-y-8 pb-12">

                    {/* Section 1: Dataset Overview */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                            <FileText className="w-5 h-5 text-primary" />
                            1. Dataset Overview
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Card className="bg-muted/50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold">{datasetOverview?.rows}</div>
                                    <div className="text-xs text-muted-foreground">Rows</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold">{datasetOverview?.columns}</div>
                                    <div className="text-xs text-muted-foreground">Columns</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50 col-span-3">
                                <CardContent className="p-4">
                                    <div className="text-xs font-medium mb-2">Column Types</div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(datasetOverview?.dtypes || {}).slice(0, 8).map(([col, type]: any) => (
                                            <Badge key={col} variant="outline" className="text-[10px]">
                                                {col}: {type}
                                            </Badge>
                                        ))}
                                        {Object.keys(datasetOverview?.dtypes || {}).length > 8 && (
                                            <Badge variant="outline" className="text-[10px]">...</Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sample Preview Table */}
                        <Card>
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm">Sample Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-xs uppercase">
                                        <tr>
                                            {datasetOverview?.samplePreview?.[0] && Object.keys(datasetOverview.samplePreview[0]).map(key => (
                                                <th key={key} className="px-4 py-2 font-medium">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datasetOverview?.samplePreview?.map((row: any, i: number) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                                                {Object.values(row).map((val: any, j: number) => (
                                                    <td key={j} className="px-4 py-2 truncate max-w-[150px]">{String(val)}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Section 2: Data Health Report */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                            <Activity className="w-5 h-5 text-primary" />
                            2. Data Health Report
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Missing Values</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {dataHealth?.missingValueChart?.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                <span className="w-20 truncate">{item.column}</span>
                                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-red-400"
                                                        style={{ width: `${item.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="w-8 text-right">{item.percentage}%</span>
                                            </div>
                                        ))}
                                        {(!dataHealth?.missingValueChart || dataHealth.missingValueChart.length === 0) && (
                                            <div className="text-xs text-green-500 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> No missing values
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Duplicates & Outliers</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Duplicate Rows</span>
                                        <Badge variant={dataHealth?.duplicateCount > 0 ? "destructive" : "secondary"}>
                                            {dataHealth?.duplicateCount || 0}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-sm text-muted-foreground block mb-1">Outliers Detected</span>
                                        {dataHealth?.outlierSummary?.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span>{item.column}</span>
                                                <span className="font-mono">{item.count}</span>
                                            </div>
                                        ))}
                                        {(!dataHealth?.outlierSummary || dataHealth.outlierSummary.length === 0) && (
                                            <div className="text-xs text-muted-foreground">None detected</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="flex flex-col justify-center items-center p-6 bg-muted/20">
                                <div className="text-4xl font-bold text-primary mb-2">{dataHealth?.score || 0}/100</div>
                                <div className="text-sm text-muted-foreground">Overall Health Score</div>
                            </Card>
                        </div>
                    </section>

                    {/* Section 3: Automated EDA */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                            <BarChart2 className="w-5 h-5 text-primary" />
                            3. Automated EDA
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Summary Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs space-y-2">
                                        {Object.entries(eda?.summaryStats?.mean || {}).slice(0, 5).map(([col, val]: any) => (
                                            <div key={col} className="flex justify-between border-b border-border/50 pb-1 last:border-0">
                                                <span className="font-medium">{col}</span>
                                                <span className="text-muted-foreground">Mean: {Number(val).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Correlations (Top 5)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {eda?.correlations?.slice(0, 5).map((corr: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span>{corr.x} ↔ {corr.y}</span>
                                                <Badge variant={Math.abs(corr.value) > 0.7 ? "default" : "outline"}>
                                                    {corr.value.toFixed(2)}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Section 4: Key Insights */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                            <Lightbulb className="w-5 h-5 text-primary" />
                            4. Key Insights
                        </h3>
                        <div className="space-y-3">
                            {insights?.map((insight: any, i: number) => (
                                <Card key={i} className="border-l-4 border-l-primary">
                                    <CardContent className="p-4 flex gap-4 items-start">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm mb-1">{insight.finding}</p>
                                            <p className="text-xs text-muted-foreground">{insight.impact}</p>
                                        </div>
                                        <Badge variant={
                                            insight.confidence === 'High' ? 'default' :
                                                insight.confidence === 'Medium' ? 'secondary' : 'outline'
                                        }>
                                            {insight.confidence}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Section 5: Recommended Visualizations */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                            <BarChart2 className="w-5 h-5 text-primary" />
                            5. Recommended Visualizations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recommendedVisualizations?.map((viz: any, i: number) => (
                                <Card key={i} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">{viz.title}</CardTitle>
                                        <CardDescription className="text-xs">{viz.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <div className="h-24 bg-muted/30 rounded flex items-center justify-center mb-3">
                                            <BarChart2 className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <Button size="sm" variant="outline" className="w-full text-xs">
                                            <Play className="w-3 h-3 mr-2" /> Generate via @Viz
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Section 6: Python Code */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                            <Code className="w-5 h-5 text-primary" />
                            6. Python Code
                        </h3>
                        <Card className="bg-muted/30">
                            <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b">
                                <span className="text-xs font-mono text-muted-foreground">generated_analysis.py</span>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <Download className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-64 w-full">
                                    <pre className="p-4 text-xs font-mono text-foreground/80">
                                        {pythonCode}
                                    </pre>
                                </ScrollArea>
                            </CardContent>
                            <div className="p-3 border-t bg-background/50 flex justify-end">
                                <Button size="sm" className="gradient-button">
                                    <Play className="w-3 h-3 mr-2" /> Run in Sandbox
                                </Button>
                            </div>
                        </Card>
                    </section>

                </div>
            </ScrollArea>
        </div>
    );
}
